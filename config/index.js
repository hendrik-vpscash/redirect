var fs   = require('fs'),
    path = require('path'),
    _    = require('lodash');

module.exports = {};

var skipFiles = [
  'index.js',
  'local.js'
];

// Loop through files in this folder
var skippedFiles = [];
fs.readdirSync(__dirname).forEach(function(filename) {
  if (skipFiles.indexOf(filename)>=0) {
    skippedFiles.push(filename);
    return;
  }
  _.merge(module.exports, require(path.join(__dirname,filename)));
});

// Load local.js later, because it overrides stuff
if (skippedFiles.indexOf('local.js')>=0) {
  _.merge(module.exports, require(path.join(__dirname,'local.js')));
}
