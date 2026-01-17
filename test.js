import ollama from 'ollama';
import fs from 'fs';
import nodePath from 'path';

const addTwoNumbers = ({ a, b }) => a + b;

const addTwoNumbersTool = {
  type: 'function',
  function: {
    name: 'addTwoNumbers',
    description: 'Add two numbers',
    parameters: {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: { type: 'number', description: 'The first number' },
        b: { type: 'number', description: 'The second number' }
      }
    }
  }
};

const getFileTool = {
  type: 'function',
  function: {
    name: 'getFile',
    description: 'Read a file from disk and return its contents',
    parameters: {
      type: 'object',
      required: ['path'],
      properties: {
        path: { type: 'string', description: 'Workspace-relative file path' }
      }
    }
  }
};

async function run() {
  const messages = [{ role: 'user', content: 'Kardeş şu toolsu kullan getFile config.json dosyasını oku ve url yi söyle' }];
  // örnek: model'e dosya okut ve yorumlatmak istersen şöyle sor
  // const messages = [{ role: 'user', content: 'Use getFile to read examples/qwen-tools-example.js and comment the code.' }];

  const availableFunctions = { addTwoNumbers,
    getFile: async ({ path: requestedPath }) => {
        console.log('Requested path:', requestedPath);
        return fs.readFileSync(requestedPath, 'utf-8');
    }
   };

  const response = await ollama.chat({
    model: 'qwen2.5-coder:0.5b',
    messages,
    tools: [addTwoNumbersTool, getFileTool]
  });

  if (response.message.tool_calls) {
    for (const call of response.message.tool_calls) {
      const fn = availableFunctions[call.function.name];
      if (fn) {
        const args = call.function.arguments;
        const result = await fn(args);
        messages.push(response.message);
        messages.push({ role: 'tool', content: result.toString(), tool_name: call.function.name });
      }
    }

    const finalRes = await ollama.chat({ model: 'qwen2.5-coder:0.5b', messages });
    console.log(finalRes.message.content);
  } else {
    console.log(response.message.content);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
