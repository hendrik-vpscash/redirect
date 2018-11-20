var crypto  = require('crypto'),
    Promise = require('bluebird');

module.exports.admin = {

  users: {
    'robin@vpscash'  : '27jDTBnQXxfKz+JsSdxctIapczTC2HtgmsSFVBp8DNk=',
    'stephan@vpscash': 'Zvzex2bSGjQ5hzcfIavhhrbL9We4vhaxN55QXcUXMxk=',
    'henk@vpscash'   : 'B47o/8fIg4+LSZ1w5VgH4VzDI9ed2NpteI6eKeOHgLY=',
    'hendrik@vpscash': 'a9S9QVHGEbefkVEw35ajLrwPJ7+wFsoAqfyxFiA+DgE=',
    'gaby@vpscash'   : 'AzJdsLwXzQ/wT6Q+SJzzzm7jGKrMwEI1IzkAM9aB+UQ=',
    'dennis@vpscash' : 'vcZN7kxzItrLlaUft1Fx/GGqjdOjLz46+0CAFGQUWrA='
  },

  hosts: [
    'redirect.vpscash.nl',
    'redirect.dok',
    'localhost:1337'
  ],

  checkPassword: function(username, hash) {

    var environment = process.env.ENVIRONMENT || 'production';
    if ( environment === 'test' && username === 'test' ) return Promise.resolve(username);

    if (crypto.createHash('sha256').update(username+config.admin.users[username]).digest('base64') == hash) {
      console.log('Authentication  ',username,'granted');
      return Promise.resolve(username);
    } else {
      console.log('Authentication  ',username,'denied');
      return Promise.reject();
    }
  },

  firewall: function(request, response) {
    var ip = request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.connection.socket.remoteAddress;

    request.clientIp = ip;

    var allowed = [
      '87.213.98.98',
      '192.168.56.1',
      '127.0.0.1',
      '::ffff:127.0.0.1',
      '::1'
    ];

    var output = allowed.indexOf(ip) >= 0;
    console.log('Firewall        ',ip,output?'allowed':'denied');
    return output;
  }

};
