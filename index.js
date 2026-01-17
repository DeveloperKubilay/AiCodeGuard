import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

import { loadModels, filesToPromts, splitePromts } from './utils/models.js';
import { getFiles, SpliteCode } from './utils/fileSystem.js';

async function main() {
  const models = await loadModels();

  for (const codeSpace of config.codeSpaces) {
    const Allfiles = getFiles(codeSpace)

    for (const aiModel of config.aiModels) {
      const modelSystem = models[aiModel.type] || { models: [] };
      const tempModel = modelSystem.models.find(m => m.name === aiModel.name)

      if (!tempModel) {
        console.warn(`Model ${aiModel} not found! Skipping...`);
        continue;
      }
      console.log(`Using model: ${tempModel}`);
      console.log(`Code Space: ${codeSpace}`);
      const chat = (...messages) => modelSystem.generateResponse(aiModel, ...messages);
      const promt = fs.readFileSync(aiModel.promt, 'utf-8');
      const files = SpliteCode(Allfiles, (aiModel.context || 1024*1024*1024) - promt.length - 4);
      const promts = filesToPromts(promt, files);
      const splitedPromts = splitePromts(promts, aiModel.rateLimit || 0);

    }

  }
  // console.log(config, models)
}

main()


