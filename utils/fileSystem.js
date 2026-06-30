import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

function runGitCommand(cwd, args) {
    try {
        return execSync(`git -C "${cwd}" ${args}`, {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
    } catch {
        return null;
    }
}

function getGitContext(codeSpace) {
    const repoRoot = runGitCommand(codeSpace, 'rev-parse --show-toplevel');
    if (!repoRoot || !runGitCommand(codeSpace, 'rev-parse --verify HEAD')) return null;

    return {
        repoRoot: path.resolve(repoRoot),
        relativeScope: (path.relative(path.resolve(repoRoot), path.resolve(codeSpace)) || '.').split(path.sep).join('/')
    };
}

function getGitDiffFiles({ repoRoot, relativeScope }) {
    const items = [];
    const seenPaths = new Set();
    const scopeArg = relativeScope === '.' ? '.' : `"${relativeScope}"`;
    const changedFiles = runGitCommand(repoRoot, `diff --name-status HEAD -- ${scopeArg}`);

    if (changedFiles) {
        for (const line of changedFiles.split(/\r?\n/)) {
            if (!line.trim()) continue;

            const parts = line.split('\t');
            const status = parts[0];
            const currentRelativePath = parts[parts.length - 1];
            const absolutePath = path.resolve(repoRoot, currentRelativePath);

            if (status.startsWith('D')) continue;
            if (seenPaths.has(absolutePath) || !fs.existsSync(absolutePath)) continue;

            const relativeFile = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
            const diff = runGitCommand(repoRoot, `diff HEAD -- "${relativeFile}"`);
            if (!diff) continue;

            seenPaths.add(absolutePath);
            items.push({
                path: absolutePath,
                length: Buffer.byteLength(diff, 'utf-8'),
                mode: 'diff',
                content: diff
            });
        }
    }

    const untrackedFiles = runGitCommand(repoRoot, `ls-files --others --exclude-standard -- ${scopeArg}`);

    if (untrackedFiles) {
        for (const relativeFile of untrackedFiles.split(/\r?\n/)) {
            if (!relativeFile.trim()) continue;

            const absolutePath = path.resolve(repoRoot, relativeFile);
            if (seenPaths.has(absolutePath) || !fs.existsSync(absolutePath)) continue;

            const content = fs.readFileSync(absolutePath, 'utf-8');
            seenPaths.add(absolutePath);
            items.push({
                path: absolutePath,
                length: Buffer.byteLength(content, 'utf-8'),
                mode: 'new',
                content: `NEW FILE (untracked)\n\n${content}`
            });
        }
    }

    return items;
}

export function getReviewTargets(codeSpace, options = {}) {
    const absoluteCodeSpace = path.resolve(codeSpace);

    if (!options.useGit) {
        return {
            mode: 'full',
            items: getFiles(absoluteCodeSpace)
        };
    }

    const gitContext = getGitContext(absoluteCodeSpace);
    if (!gitContext) {
        return {
            mode: 'full',
            fallbackReason: 'Git repo or HEAD commit not found.',
            items: getFiles(absoluteCodeSpace)
        };
    }

    return {
        mode: 'git',
        items: getGitDiffFiles(gitContext)
    };
}
