const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'app', 'admin');
const arPath = path.join(__dirname, 'src', 'i18n', 'locales', 'ar.json');
const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');

const getAllFiles = (dir, ext) => fs.readdirSync(dir, { withFileTypes: true }).reduce((files, dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) return files.concat(getAllFiles(res, ext));
    if (res.endsWith(ext)) return files.concat(res);
    return files;
}, []);

const files = getAllFiles(adminDir, '.jsx');
const keys = new Set();
// match both t('key') and t("key")
const regex = /t\(['"]([^'"]+)['"]/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
    }
});

console.log(`Found ${keys.size} unique keys in admin files.`);

const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

let added = [];
keys.forEach(key => {
    if (!arJson[key]) {
        arJson[key] = key; // Temporary placeholder
        added.push(key);
    }
    if (!enJson[key]) {
        enJson[key] = key; // Temporary placeholder
    }
});

console.log(`Added ${added.length} missing keys:`);
console.log(added);

fs.writeFileSync(arPath, JSON.stringify(arJson, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 4));
console.log('Update complete.');
