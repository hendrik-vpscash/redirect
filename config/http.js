var path = require('path');

module.exports.http = {
  port   : process.env.PORT || 1337,
  docroot: path.join(__dirname, '..', 'docs'),
  build_query: function(values) {
    var output = '';
    for(var i in values) {
      if (!values.hasOwnProperty(i)) continue;
      output += output.length ? '&' : '';
      output += prefix = encodeURIComponent(i)+'='+encodeURIComponent(values[i]);
    }
    return output;
  }
};
