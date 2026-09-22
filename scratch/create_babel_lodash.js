const fs = require('fs');
const path = require('path');

const lodashRoot = path.join(__dirname, '..', 'node_modules', 'lodash');
const babelLodash = path.join(__dirname, '..', 'node_modules', 'babel-core', 'node_modules', 'lodash');

fs.mkdirSync(babelLodash, { recursive: true });
fs.writeFileSync(path.join(babelLodash, 'package.json'), JSON.stringify({ name: 'lodash', version: '3.10.1', main: 'index.js' }, null, 2));
fs.writeFileSync(path.join(babelLodash, 'index.js'), "module.exports = require('lodash');\n");

const categories = ['lang', 'object', 'collection', 'array', 'string', 'function', 'utility', 'internal', 'math', 'date', 'number'];
for (const cat of categories) {
  const catDir = path.join(babelLodash, cat);
  fs.mkdirSync(catDir, { recursive: true });
}

const _ = require(lodashRoot);
for (const key of Object.keys(_)) {
  for (const cat of categories) {
    const fPath = path.join(babelLodash, cat, `${key}.js`);
    fs.writeFileSync(fPath, `module.exports = require('lodash')[${JSON.stringify(key)}];\n`);
  }
}
console.log('babel-core lodash compatibility layer created successfully!');
