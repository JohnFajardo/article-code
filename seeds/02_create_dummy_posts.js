exports.seed = function (knex) {
  return knex('posts').del()
    .then(function () {
      return knex('posts').insert([
        {
          user_id: 1,
          title: 'JavaScript',
          body: 'JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification. JavaScript is high-level, often just-in-time compiled, and multi-paradigm. It has curly-bracket syntax, dynamic typing, prototype-based object-orientation, and first-class functions.'
        },
        {
          user_id: 1,
          title: 'Node.js',
          body: 'Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside of a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user\'s web browser. Consequently, Node.js represents a \"JavaScript everywhere\" paradigm, unifying web-application development around a single programming language, rather than different languages for server- and client-side scripts.'
        },
        {
          user_id: 1,
          title: 'Express.js',
          body: 'Express.js, or simply Express, is a web application framework for Node.js, released as free and open-source software under the MIT License. It is designed for building web applications and APIs. It has been called the de facto standard server framework for Node.js.'
        }
      ]);
    });
};
