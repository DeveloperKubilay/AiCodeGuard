import fs from 'fs';

export async function loadModels() {
  const models = {}
  const files = await fs.promises.readdir('./models');
  await Promise.all(
    files.map(async file => {
      if (file.endsWith('.js')) {
        const { getModels } = await import(`../models/${file}`);
        const data = await getModels();
        models[data.type] = data;
      }
    })
  );
  return models;
}


export function splitePromts(promts, limit) {
  if (!Array.isArray(promts) || promts.length === 0) return [];
  const splited = [[]];
  let currentLength = 0;
  for (const promt of promts) {
    if (limit > 0) {
      currentLength++;
      if (currentLength > limit) {
        splited.push([promt]);
        currentLength = 1;
        continue;
      }
    }
    splited[splited.length - 1].push(promt);
  }
  return splited;
}

export function filesToPromts(promt, Allfiles) {
  const data = Allfiles.map(files => (
    {
      role: 'user',
      content: `${promt}\nFILE PATH: ${files.path}\n\n${fs.readFileSync(files.path, 'utf-8')}`
    }));
  return data;
}