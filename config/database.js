module.exports.database = {
  default: 'local',

  local: {
    host    : process.env.DB_HOST           || 'localhost',
    port    : parseInt(process.env.DB_PORT) || 3306,
    user    : process.env.DB_USER           || 'admin',
    password: process.env.DB_PASSWORD       || '',
    database: process.env.DB_DATABASE       || 'redirect'
  }
};
