const fs = require('fs');

// We test if the object has the property at runtime
require('ts-node').register();
const trans = require('./src/lib/translations.ts').default;

console.log("sys.str_4390:", trans['ar']['sys.str_4390']);
console.log("sys.str_4400:", trans['ar']['sys.str_4400']);

