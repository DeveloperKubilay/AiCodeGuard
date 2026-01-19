import { Ollama } from 'ollama';
import path from 'path';
import c from 'ansi-colors';
import fs from 'fs';

export default class OllamaModel {
  static type = 'ollama';

  constructor(config) {
    this.config = config;
    this.ollama = new Ollama({
      host: config.endpoint,
      headers: config.headers
    });
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'WARN',
          description: 'Warning issued due to misuse, even though no correction is required.',
          parameters: {
            type: 'object',
            required: ['path', "description"],
            properties: {
              path: { type: 'string', description: 'The exact absolute file path to the file containing the issue. Do NOT use function names. Copy the path from the "File:" header.' },
              description: { type: 'string', description: 'Description of the issue found in the file' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'CRITICAL',
          description: 'definitely needs to be corrected or carries potential risks.',
          parameters: {
            type: 'object',
            required: ['path', "description"],
            properties: {
              path: { type: 'string', description: 'The exact absolute file path to the file containing the issue. Do NOT use function names. Copy the path from the "File:" header.' },
              description: { type: 'string', description: 'Description of the issue found in the file' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'SAFE',
          description: 'No Issues found in the file.',
          parameters: {
            type: 'object',
            required: ['path'],
            properties: {
              path: { type: 'string', description: 'The exact absolute file path to the file containing the issue. Do NOT use function names. Copy the path from the "File:" header.' },
            }
          }
        }
      }
    ];
  }

  async getModels() {
    try {
      const list = await this.ollama.list();
      return list.models.map(m => m.model);
    } catch (error) {
      console.error(c.red(`Failed to fetch models from ${this.config.endpoint}: ${error.message}`));
      return [];
    }
  }

  async generateResponse(messages, options = {}) {
    if (!Array.isArray(messages)) messages = [messages];
    
    try {
      const response = await this.ollama.chat({
        model: this.config.model,
        messages,
        tools: this.tools
      });

      if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
        const content = response.message.content || "";
        const toolCalls = [];
        
        const xmlRegex = /<function\s+name="(\w+)"\s+arguments='(.*?)'\s*\/>/g;
        let match;
        while ((match = xmlRegex.exec(content)) !== null) {
          try { toolCalls.push({ function: { name: match[1], arguments: JSON.parse(match[2]) } }); } catch (e) {}
        }

        if (toolCalls.length === 0) {
          const pathRegex = /FILE PATH: (.*?)(\n|$)/;
          const filePath = (messages[0].content.match(pathRegex) || [])[1]?.trim() || "Unknown";
          
          if (content.includes("SAFE") && !content.includes("CRITICAL") && !content.includes("WARN")) {
            toolCalls.push({ function: { name: "SAFE", arguments: { path: filePath } } });
          } else if (content.includes("CRITICAL")) {
            toolCalls.push({ function: { name: "CRITICAL", arguments: { path: filePath, description: content } } });
          } else if (content.includes("WARN")) {
             toolCalls.push({ function: { name: "WARN", arguments: { path: filePath, description: content } } });
          }
        }
        response.message.tool_calls = toolCalls;
      }

      if (!response.message.tool_calls || response.message.tool_calls.length === 0) return false;

      for (const call of response.message.tool_calls) {
        const result = path.relative(
          path.join(options.codeSpace || ""),
          call.function.arguments.path
        );

        if (call.function.name === "SAFE") console.log(c.green(`File is safe: ${result}`));
        else if (call.function.name === "WARN") console.log(c.yellow(`Warning in file: ${result}`));
        else if (call.function.name === "CRITICAL") console.log(c.red(`Critical issue in file: ${result}`));

        if (call.function.name !== "SAFE") {
          fs.appendFileSync("log.txt", `Issue found in file: ${result}\nDescription: ${call.function.arguments.description}\n\n`);
        }
      }

      return response.message.tool_calls.some(call => call.function.name !== "SAFE");
    } catch (error) {
      console.error(c.red(`Error generating response: ${error.message}`));
      return true;
    }
  }
}
