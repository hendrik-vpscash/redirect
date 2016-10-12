var config  = global.config = require('./config'),
    http    = require('http'),
    mysql   = require('mysql'),
    Promise = require('bluebird'),
    url     = require('url'),
    fs      = require('fs'),
    path    = require('path'),
    mime    = require('mime-types'),
    hbs     = require('handlebars');

// Connect to mysql server
var db = mysql.createConnection(config.database[process.env.DB || config.database.default]);
db.connect();

function mimetype(filename) {
  var ext = filename.split('.').pop();
  return mimetype[ext] || (mimetype[ext] = mime.lookup(filename));
}

function getCookie(request, cname) {
  var name = cname + "=";
  var ca = (request.headers.cookie || '').split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length,c.length);
    }
  }
  return "";
}

function auth(request) {
  var authCookie = getCookie(request,'auth'),
      auth = authCookie.split(':');
  if (config.admin.checkPassword(auth[0],auth[1])) {
    console.log('Authentication  ',auth[0],'granted');
    return Promise.resolve(auth[0]);
  } else {
    console.log('Authentication  ',authCookie,'denied');
    return Promise.reject();
  }
}

// Startup compilation of templates
var precompiled = {};
var reg = /(.*)\.hbs$/i;
fs.readdir(config.http.docroot, function(err,files) {
  files.forEach(function(file) {
    var matches = reg.exec(file);
    if (!matches) return;
    fs.readFile(path.join(config.http.docroot, file), function(err,contents) {
      precompiled[path.join(config.http.docroot,matches[1]+'.html')] = hbs.compile(contents.toString());
    })
  })
});

// The redirect server
var server = http.createServer(function(request, response) {

  // request.param shim
  if (!request.param) {
    request.param = function(key) {
      var query = request.url.split('?').pop(),
          vars  = query.split('&');
      for(var i = 0 ; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == key) {
          return decodeURIComponent(pair[1]);
        }
      }
    }
  }

  new Promise(function(resolve, reject) {

    if (config.admin.hosts.indexOf(request.headers.host)>=0) {
      return resolve(204);
    }

    // Check if the host is known
    var q = 'SELECT `target` FROM `domain` WHERE `domain` = "' + encodeURIComponent(request.headers.host) + '";';
    db.query(q, function(err, rows) {

      // Make sure we have a valid response
      if (err) return reject(err);
      if (!rows.length) return reject(404);

      // Write the permanent redirect
      response.writeHead(301, {
        location: decodeURIComponent(rows[0].target)
      });
      response.end();
      resolve(301);
    });
  })
    .then(function(result) {
      // Successful
      if (result==301) return;

      // Admin interface
      if (result==204) {
        var uri      = url.parse(request.url.split('?').shift()).pathname,
            filename = path.join(config.http.docroot, uri);

        function handle(data) {

          var mime = mimetype(filename),
              headers  = {};
          if (mime) headers['Content-Type'] = mime;

          data = data || {};
          if (precompiled[filename]) {
            response.writeHead(200, headers);
            response.write(precompiled[filename](data));
            response.end();
            return;
          }

          fs.readFile(filename, function(err, file) {
            if (err) {
              response.writeHead(301, {
                location: '/login.html'
              });
              return response.end();
            }

            response.writeHead(200, headers);
            response.write(file, "binary");
            response.end();
          })
        }

        if (/(^\/login.html|^\/assets\/.*)/.test(uri)) {
          return handle();
        }

        // This handles closing the response
        if (!config.admin.firewall(request,response)) {
          response.writeHead(403);
          response.write('Permission denied');
          return response.end();
        }

        return auth(request)
          .then(function(username) {

            console.log('Request         ',request.method,request.url);

            // Handle data requests
            if (request.param('delete')) {
              db.query('DELETE FROM `domain` WHERE `domain` = "'+encodeURIComponent(request.param('delete'))+'";');
            }

            // Handle data requests
            if (request.param('create')&&request.param('domain')&&request.param('target')) {
              var domain = encodeURIComponent(request.param('domain')),
                  target = encodeURIComponent(request.param('target'));
              db.query('INSERT INTO `domain` (`domain`,`target`) VALUES ("'+domain+'","'+target+'") ON DUPLICATE KEY UPDATE `target` = "'+target+'"');
            }

            return new Promise(function(resolve,reject) {
              db.query('SELECT `domain`, `target` FROM `domain`;', function(err, rows) {
                if (err) return reject(err);
                return resolve({
                  username: username,
                  row: rows.map(function(row) {
                    return {
                      domainEncoded: row.domain,
                      domain: decodeURIComponent(row.domain),
                      target: decodeURIComponent(row.target)
                    };
                  })
                });
              });
            });
          })
          .then(handle)
          .catch(function() {
            response.writeHead(403);
            response.write('Permission denied');
            response.end();
          });

      }

    })
    .catch(function(err) {

      // Not found
      if (err==404) {
        response.writeHead(404);
        response.write('Not found');
        response.end();
        console.log(request.headers.host, 'not found');
        return;
      }

      // Log the issue
      console.log('Error', err);
    })
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
      db.query("CREATE TABLE `domain` (`domain` varchar(255) NOT NULL,`target` varchar(255) NOT NULL,UNIQUE KEY `domain` (`domain`)) ENGINE=InnoDB DEFAULT CHARSET=latin1");
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
