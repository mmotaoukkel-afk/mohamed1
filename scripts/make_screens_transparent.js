const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else {
      if (filePath.endsWith('.jsx')) filelist.push(filePath);
    }
  });
  return filelist;
};

const screensDir = path.join(__dirname, '../app');
const files = walkSync(screensDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to replace container { backgroundColor... } specifically
  // Regex to match `container: { ... backgroundColor: XXX ... }`
  content = content.replace(/(container:\s*\{[^}]*backgroundColor:\s*)(tokens\.colors\.background|theme\.background|tokens\?\.colors\?\.background \|\| '[^']+')/g, '$1"transparent"');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${path.relative(screensDir, file)}`);
  }
});
