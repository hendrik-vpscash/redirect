var crypto = require('crypto');

module.exports.admin = {

  users: {
    'ronald@vpscash': 'NyaDNd1pMQRb3N+SYj/4GaZCRLU9DnRtQ4eXNJ1NpXg=',
    'robin@vpscash' : 'OAA6mXFzCSjayx+KOGooiSpzEI+gMP9n871EM3FNlsw=',
    'guru1300'      : 'KYurETbc3owBVxkPpTdMvzbDP3mxOnWX2oAnxa/o3DE='
  },

  hosts: [
    'localhost',
    'localhost:1337',
    'redirect.dok'
  ],

  checkPassword: function(username, hash) {
        return crypto.createHash('sha256').update(username+config.admin.users[username]).digest('base64') == hash;
  }

};
