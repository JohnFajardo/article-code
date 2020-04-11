const argon = require('argon2');

exports.seed = (knex) => {
  knex('users').del();
  return knex.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    .then(async () => {
      const users = [
        { username: 'John Doe', email: 'johndoe@example.com', 'password': 'abc123' },
        { username: 'Jane Doe', email: 'janedoe@example.com', 'password': 'abc123' },
        { username: 'Rob Doe', email: 'robdoe@example.com', 'password': 'abc123' }
      ];
      for (user of users) {
        user.password_hash = await argon.hash(user.password);
      }
      return knex('users').insert(users.map(({ password, ...rest }) => rest));
    });
}