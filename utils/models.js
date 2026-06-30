import fs from 'fs';

export async function loadModels() {
  const models = {}
  const files = await fs.promises.readdir('./models');
  await Promise.all(
    files.map(async file => {
      if (file.endsWith('.js')) {
        const module = await import(`../models/${file}`);
        const ModelClass = module.default;
        if (ModelClass && ModelClass.type) {
          models[ModelClass.type] = ModelClass;
        }
      }
    })
  );
  return models;
}


export function splitePromts(promts, limit, options) {
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
  const modeNotes = {
    full: 'Review the full current file content.',
    diff: 'Review only this git diff from the last commit to the current working tree. Focus on newly introduced risks.',
    new: 'Review this full content as a newly added untracked file.'
  };
  const data = Allfiles.map(files => (
    {
      role: 'user',
      content: `${promt}\nFILE PATH: ${files.path}\nSOURCE MODE: ${files.mode || 'full'}\nREVIEW SCOPE: ${modeNotes[files.mode || 'full']}\n\n${files.content ?? fs.readFileSync(files.path, 'utf-8')}`
    }));
  return data;
}
