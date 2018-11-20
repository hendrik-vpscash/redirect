var crypto     = require('crypto');
global.Promise = global.Promise || require('bluebird');
var args       = [].slice.call(process.argv,2);

if (args.length !== 1) {
  console.log('Usage: node newpass.js <password>');
  process.exit(1);
}

console.log(crypto.createHash('sha256').update(args[0]).digest('base64'));
