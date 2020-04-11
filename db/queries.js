const knex = require('./knex');
const argon = require('argon2');
const auth = require('../middleware/auth')

module.exports = {
    getAll(table) {
        return table == 'users' ? knex.table('users').select('id', 'username') : knex(table);
    },

    getOne(table, id) {
        return table == 'users' ? knex.table('users').select('id', 'username').first() : knex(table).where('id', id).first();
    },

    async createUser(username, email, password) {
        try {
            let password_hash = await argon.hash(password);
            return knex('users').returning(['username', 'email']).insert({ username: username, email: email, password_hash: password_hash });
        } catch (error) {
            process.exit(1);
        }
    },

    async login(username, password) {
        let getUser = await knex('users').where('username', username);
        let user = getUser[0];

        try {
            if (await argon.verify(user.password_hash, password)) {
                return user;
            }
            throw Error('Wrong username or password');
        } catch (e) {
            throw Error(e.message);
        }
    },

    async getToken(token) {
        newToken = auth.decodeToken(token)
        return newToken;
    }
}