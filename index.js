import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

import { loadModels, filesToPromts, splitePromts } from './utils/models.js';
import { getFiles } from './utils/fileSystem.js';
import { processBatchesSequential } from './utils/util.js';
import c from 'ansi-colors';

async function main() {
  const models = await loadModels();

  for (const codeSpace of config.codeSpaces) {
    const Allfiles = getFiles(codeSpace)

    for (const aiModel of config.aiModels) {
      const ModelClass = models[aiModel.type];

      if (!ModelClass) {
        console.warn(c.red(`Model Type ${aiModel.type} not found! Skipping...`));
        continue;
      }

      const modelInstance = new ModelClass(aiModel);
      const availableModels = await modelInstance.getModels();
      const tempModel = availableModels.find(m => m === aiModel.model);

      if (!tempModel) {
        console.warn(c.red(`Model ${aiModel.model} not found! Skipping...`));
        continue;
      }

      console.log(c.cyan(`Using model: ${tempModel}`));
      console.log(c.bold.yellow(`Code Space: ${codeSpace}`));
      
      const chat = (messages, options) => modelInstance.generateResponse(messages, options);
      
      let promt = fs.readFileSync(aiModel.promt, 'utf-8');
      promt = promt
        .replace("{FUNCTIONS}", modelInstance.tools.map(x => x.function.name).join(', '))
      const promts = filesToPromts(promt, Allfiles);
      const splitedPromts = splitePromts(promts, aiModel.rateLimit || 0);

      const results = await processBatchesSequential(chat, splitedPromts, {
        codeSpace
      });

      if(results.find(r => r)){
        console.log(c.red.bold(`Issues found in code space: ${codeSpace} using model: ${tempModel}`));
        if(config.exitOnError) process.exit(1);
      }else {
        console.log(c.green.bold(`No issues found in code space: ${codeSpace} using model: ${tempModel}`));
      }

    }

  }
}

main()