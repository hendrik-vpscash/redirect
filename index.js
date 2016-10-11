var config  = require('./config'),
    http    = require('http'),
    mysql   = require('mysql'),
    Promise = require('bluebird');

// Connect to mysql server
var db = mysql.createConnection(config.database[process.env.DB || config.database.default]);
db.connect();

// The redirect server
var server = http.createServer(function(request, response) {
  // Check if the host is known
  var q = 'SELECT `target` FROM `domain` WHERE `domain` = "' + encodeURIComponent(request.headers.host) + '";';
  db.query(q, function(err, rows) {

    // Make sure we have a valid response
    if (err || !rows.length) {
      response.writeHead(500);
      response.write('An error occurred');
      return response.end();
    }

    // Write the permanent redirect
    response.writeHead(301, {
      location: rows[0].target
    });
    response.end();
  });
});

// Make sure the table exists
new Promise(function(resolve, reject) {
  db.query('SHOW TABLES', function(err, rows) {
    if (err) return reject(err);
    return resolve(rows.map(function(row) {
      return row.Tables_in_redirect;
    }));
  });
})
  .then(function(tables) {
    return {
      //users: tables.indexOf('users') >= 0,
      domain: tables.indexOf('domain') >= 0
    };
  })
  .then(function(hasTable) {
    if (!hasTable.domain) {
      db.query("CREATE TABLE `domain` (`domain` varchar(255) NOT NULL,`target` varchar(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1");
      console.log('Creating domain table');
    }
    //if (!hasTable.users) {
    //  db.query("CREATE TABLE `users` (`login` varchar(40) NOT NULL,`password` varchar(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1");
    //  console.log('Creating user table');
    //}
  })
  .finally(function() {
    // Start the server
    server.listen(config.http.port);
    console.log("Redirect server now listening on\n  => localhost:"+config.http.port);
  });
