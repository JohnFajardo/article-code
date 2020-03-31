// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: 'postgres://localhost/tutorial'
  },

  test: {
    client: 'postgresql',
    connection: 'postgres://localhost/tutorial-test'
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
};