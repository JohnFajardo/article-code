const knex = require('./knex');

module.exports = {
    getAll(table) {
        return knex(table);
    },

    getOne(table, id) {
        return knex(table).where('id', id).first();
    }
}