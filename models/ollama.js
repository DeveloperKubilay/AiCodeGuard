import ollama from 'ollama';

export default async () => {
  const list = await ollama.list();
  console.log(list);
  return list;
};

const tools = [
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
      description: 'No issues found in the file.',
      parameters: {
        type: 'object',
        required: ['path', "description"],
        properties: {
          path: { type: 'string', description: 'The exact absolute file path to the file containing the issue. Do NOT use function names. Copy the path from the "File:" header.' },
          description: { type: 'string', description: 'Description of the issue found in the file' }
        }
      }
    }
  }
]

export async function getModels() {
  const { models } = await ollama.list();
  return { models: models.map(m => m.model), type: 'ollama', generateResponse, tools };
}

export async function generateResponse(model, messages) {
  if (!Array.isArray(messages)) messages = [messages];
  const response = await ollama.chat({
    model: model.model,
    messages,
    tools: tools
  });

  if (response.message.tool_calls) {
    for (const call of response.message.tool_calls) {
      console.log(`Tool called: ${call.function.name} with arguments: ${JSON.stringify(call.function.arguments)}`);
    }
  } else {
    console.log(response.message.content);
  }

  return;
}