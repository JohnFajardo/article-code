const knex = require('./knex');

module.exports = {
    getAll(table) {
        return knex(table);
    }
}