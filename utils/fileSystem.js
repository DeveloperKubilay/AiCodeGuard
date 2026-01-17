import fs from 'fs';
import path from 'path';

export function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else {
            results.push({ path: filePath, length: stat.size });
        }
    });
    return results;
}

export function SpliteCode(files, kMaxLength) {
    let currentLength = 0;
    let currentChunk = [[]];

    for (const file of files) {
        const fileMaxLength = kMaxLength-file.path.length-15;
        if(file.length > fileMaxLength) continue;
        if (currentLength + file.length > fileMaxLength) {
            currentChunk.push([]);
            currentLength = 0;
        }
        currentChunk[currentChunk.length - 1].push(file);
        currentLength += file.length;
    }

    return currentChunk;
}