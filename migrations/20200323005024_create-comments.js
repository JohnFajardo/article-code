
exports.up = function (knex) {
    return knex.schema.createTable('comments', (table) => {
        table.increments(); // Again, this will be our id
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('cascade');
        table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('cascade');
        table.text('body', 'longtext');
    })
};

exports.down = function (knex) {
    return knwx.schema.dropTable('comments');
};
