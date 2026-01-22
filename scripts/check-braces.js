const fs = require('fs');
const content = fs.readFileSync('c:/Users/PC/Documents/app/first-app/app/admin/settings.jsx', 'utf8');
let open = 0, close = 0, openParen = 0, closeParen = 0;
for (let char of content) {
    if (char === '{') open++;
    else if (char === '}') close++;
    else if (char === '(') openParen++;
    else if (char === ')') closeParen++;
}
console.log(`Braces: { ${open}, } ${close} | Diff: ${open - close}`);
console.log(`Parens: ( ${openParen}, ) ${closeParen} | Diff: ${openParen - closeParen}`);
