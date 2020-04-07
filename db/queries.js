const knex = require('./knex');
const argon = require('argon2');
const auth = require('../api/auth');

module.exports = {
    getAll(table) {
        return knex(table);
    },

    getOne(table, id) {
        return knex(table).where('id', id).first();
    },

    async createUser(username, email, password) {

        try {
            let password_hash = await argon.hash(password);
            return knex('users').returning(['username', 'email']).insert({ username: username, email: email, password_hash: password_hash });

        } catch (error) {
            console.log('That did not go well.');
            console.error(error);
            process.exit(1);
        }

    },

    async login(username, password) {
        let getUser = await knex('users').where('username', username);
        let user = getUser[0];

        try {
            if (await argon.verify(user.password_hash, password)) {
                return auth.getToken(user.id);
            } else {
                console.log('password did not match')
            }
        } catch (e) {
            console.error(e);
            process.exit(1);
        }

    }
}