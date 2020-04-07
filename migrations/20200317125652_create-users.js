exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments(); // This will set up an id field with autoincrement set to true and an unique constraint
        table.string('username');
        table.string('email');
        table.string('password_hash');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
