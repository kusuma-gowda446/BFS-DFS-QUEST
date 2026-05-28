const fs = require('fs');
const code = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const ids = new Set();
let match;
let regex = /\$\(['"](.*?)['"]\)/g;
while ((match = regex.exec(code)) !== null) ids.add(match[1]);
regex = /getElementById\(['"](.*?)['"]\)/g;
while ((match = regex.exec(code)) !== null) ids.add(match[1]);

const missing = [];
ids.forEach(id => {
    if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
        missing.push(id);
    }
});
console.log('Missing IDs:', missing);
