import ollama from 'ollama';

export default async () => {
  const list = await ollama.list();
  console.log(list);
  return list;
};


export async function getModels() {
  const { models } = await ollama.list();
  return { models: models.map(m => m.model), type: 'ollama', generateResponse };
}

export async function generateResponse(model, messages) {
  console.log(messages)
}