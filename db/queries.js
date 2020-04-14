const knex = require('./knex');
const argon = require('argon2');
const auth = require('../middleware/auth')

module.exports = {
    getAll(table) {
        return table == 'users' ? knex.table('users').select('id', 'username') : knex(table);
    },

    getAllComments(id) {
        return knex.select([
            'comments.id',
            'comments.post_id',
            'comments.body',
            'users.username',
        ]).from('comments').innerJoin('users', 'users.id', '=', 'comments.user_id')
            .where('comments.post_id', '=', id).orderBy('comments.id', 'asc');
    },

    getAllPosts() {
        return knex.select([
            'posts.id',
            'posts.user_id',
            'posts.title',
            'posts.body',
            'users.username'
        ]).from('posts').innerJoin('users', 'users.id', '=', 'posts.user_id').orderBy('posts.id', 'desc');
    },

    getOne(table, id) {
        return table == 'users' ? knex.table('users').select('id', 'username').first() : knex(table).where('id', id).first();
    },

    getPostByUser(id) {
        return knex.table('posts').where('user_id', id);
    },

    async createUser(username, email, password) {
        try {
            let password_hash = await argon.hash(password);
            return knex('users').returning(['username', 'email']).insert({ username: username, email: email, password_hash: password_hash });
        } catch (error) {
            process.exit(1);
        }
    },

    async createPost(id, title, body) {
        return knex('posts').returning(['title', 'body']).insert({ user_id: id, title: title, body: body });
    },

    createComment(postId, userId, body) {
        return knex('comments').returning(['body']).insert({ post_id: postId, user_id: userId, body: body });
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
            throw Error('Wrong username or password');
        }
    },

    async getToken(token) {
        newToken = auth.decodeToken(token)
        return newToken;
    }
}