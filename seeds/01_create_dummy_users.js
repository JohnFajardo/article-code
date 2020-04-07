const argon = require('argon2');


exports.seed = function (knex) {
  return knex('users').del()
    .then(function () {
      return knex('users').insert([
        { username: 'John Doe', email: 'johndoe@example.com', password_hash: '$argon2i$v=19$m=4096,t=3,p=1$U4t8Tdms9eeMIzqKR+F3NQ$n1vm6DhCu6b+4LIEmjJ0CBLljYtYQbHSDOEVeEEvT/M' },
        { username: 'Jane Doe', email: 'janedoe@example.com', password_hash: '$argon2i$v=19$m=4096,t=3,p=1$WZdJDlAvGw5N+Eppk7w1VA$LNnGQ10Nuw/CsiAS29J0IWttys91roJh0w0AeUEnS0U' }
      ]);
    });
};