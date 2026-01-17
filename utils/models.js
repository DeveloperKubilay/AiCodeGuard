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


export async function splitePromts(promts, limit){
  const splited = [[]];
  for(const promt of promts){
    if(limit > 0){
      console.log(promt)
      for(let i=0; i < promt.length; i += limit){
      }
    } else {
      splited[splited.length - 1].push(promt);
    }
  }

  return splited;
}

export function filesToPromts(promt, Allfiles) {
  const data = Allfiles.map(files => (
    {
      role: 'user', 
      content: `${promt}\n\n${files.map(file =>{
        return `File: ${file.path}\n${fs.readFileSync(file.path, 'utf-8')}`;
      }).join('\n\n')}`
    }));
    return data;
}