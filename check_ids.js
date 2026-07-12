const fs = require('fs');

const mainJs = fs.readFileSync('src/main.js', 'utf-8');
const indexHtml = fs.readFileSync('index.html', 'utf-8');

const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
while ((match = regex.exec(mainJs)) !== null) {
  const id = match[1];
  if (!indexHtml.includes(`id="${id}"`) && !indexHtml.includes(`id='${id}'`)) {
    console.log(`Missing ID in index.html: ${id}`);
  }
}
console.log("Check complete.");
