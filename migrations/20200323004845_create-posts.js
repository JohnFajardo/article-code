exports.up = function (knex) {
    return knex.schema.createTable('posts', (table) => {
        table.increments(); // This is our id field
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('cascade');
        table.string('title');
        table.text('body', 'longtext');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('posts')
};
