var path = require('path');

module.exports.http = {
  port   : process.env.PORT || 1337,
  docroot: path.join(__dirname, '..', 'docs')
};
