const assert = require('assert');
const { graph } = require('./index.ts');

console.log('Testing OpenCanvas Graph Router');
assert(graph, 'Graph is not defined');
console.log('Graph is defined');

process.exit(0);