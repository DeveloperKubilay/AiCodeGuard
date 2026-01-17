import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

import { loadModels, filesToPromts, splitePromts } from './utils/models.js';
import { getFiles } from './utils/fileSystem.js';
import { processBatchesSequential } from './utils/util.js';

async function main() {
  const models = await loadModels();

  for (const codeSpace of config.codeSpaces) {
    const Allfiles = getFiles(codeSpace)

    for (const aiModel of config.aiModels) {
      const modelSystem = models[aiModel.type] || { models: [] };
      const tempModel = modelSystem.models.find(m => m === aiModel.model)

      if (!tempModel) {
        console.warn(`Model ${aiModel} not found! Skipping...`);
        continue;
      }
      console.log(`Using model: ${tempModel}`);
      console.log(`Code Space: ${codeSpace}`);
      const chat = (messages) => modelSystem.generateResponse(aiModel, messages);
      let promt = fs.readFileSync(aiModel.promt, 'utf-8');
      promt = promt
        .replace("{FUNCTIONS}", modelSystem.tools.map(x => x.function.name).join(', '))
        .replace("{ALLFILES}", Allfiles.map(x => x.path).join('\n'));
      const promts = filesToPromts(promt, Allfiles);
      const splitedPromts = splitePromts(promts, aiModel.rateLimit || 0);

      const responses = await processBatchesSequential(chat, splitedPromts);
    }

  }
  // console.log(config, models)
}

main()


