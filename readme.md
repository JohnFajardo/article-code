## Install:
* Latest version of Nodejs
* PostgreSQL
* createdb
* Express-generator `npm install -g express-generator`
* Knex `npm install -g knex`
* gitignore node

## Run express:
`express`

## Create database:
`createdb databaseName`

## Install knex and pg:
`npm i -S knex pg`

## Initialize knex:
`knex init`

This will create a knexfile.js in your project root. Edit this file and delete all entries except for the Development one, then change the client from "sqlite3" to "postgresql" and change connection value from an object to a string and set its value to postgres://localhost/yourdbname. I named mine tutorial, so here's what mine looks like:

```
module.exports = {
  development: {
    client: 'postgresql',
    connection: connection: 'postgres://localhost/tutorial'
  }
};
```

## Create migrations:
`knex migrate:make create-users`

Now check the newly created migrations folder and look for a file called `timestamp_create-users.js`. Inside, you'll find two functions called up and down. This is where we define our table structure:

```
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments(); // This will set up an id field with autoincrement set to true and an unique constraint
        table.string('username');
        table.string('email');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
```
## Run the migration:
`knex migrate:latest`

## Check the database:
Fire up a terminal and run `psql yourDatabaseName`. You'll land at the Postgres prompt where you can type `\dt` and if everything went well, you should see something like this:

```
               List of relations
 Schema |         Name         | Type  | Owner 
--------+----------------------+-------+-------
 public | knex_migrations      | table | john
 public | knex_migrations_lock | table | john
 public | users                | table | john
(3 rows)
```

The first two are used by knex to keep track of our migrations, but notice the third one? Great, that's where our users will be stored, let's check it out!

Still in the Postgres prompt, type `\d users` to see what's inside:

```
                                     Table "public.users"
  Column  |          Type          | Collation | Nullable |              Default              
----------+------------------------+-----------+----------+-----------------------------------
 id       | integer                |           | not null | nextval('users_id_seq'::regclass)
 username | character varying(255) |           |          | 
 email    | character varying(255) |           |          | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
```

Great! We have an id column, an email and a username, just as we planned! Now exit the Postgres prompt byt typing `exit`.

## Create a seed file:
No practice project is complete without some dummy data, so still in your terminal, run `knex seed:make create_dummy_users`. This will create a new file called `create_dummy_users.js` in a new `/migrations` folder. In this file, we have a nice template to fill with dummy data for our database. Just follow the format given to add a few users:

```
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {username: 'John Doe', email: 'johndoe@example.com'},
        {username: 'Jane Doe', email: 'janedoe@example.com'}
      ]);
    });
};
```

One thing to notice though is that the original templates suggest specifying the ID number. This might work on other databases, Postgres takes care of them automatically so we should ommit them to prevent conflicts. Now run the migration by typing `knex seed:run` and your database should get populated in a couple of seconds. To check if it worked, go back to the Postgres prompt and type `SELECT * FROM users;`:

```
 id | username |        email        
----+----------+---------------------
  1 | John Doe | johndoe@example.com
  2 | Jane Doe | janedoe@example.com
(2 rows)
```
In the next parts we're going to add an articles table, user authentication and table relationships.





# Part 2

In the [last post](https://medium.com/@fajardocj/build-your-own-rest-api-with-node-express-knex-and-postgresql-aec98fe75e5), we set up our user model. Let's add two more models and explore its relationship to the user model.

## Create the posts model

Fire up a terminal and type `knex migrate:make create-posts` and then again, this time for a comments column: `knex migrate:make create-comments`. It's important that you create this files in the same order, you'll see why later. This will create two files called timestamp_create-posts.js and timestamp_create-comments.js. For the sake of brevity, I will omit any mention of the timestamps from now on.

Great, we now have two new migration that we can start tweaking around. Let's start with our create-posts.js migration and add an id, a title and a body:

```
exports.up = function (knex) {
    return knex.schema.createTable('posts', (table) => {
        table.increments(); // This is our id field
        table.string('title');
        table.text('body', 'longtext');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('posts')
};
```

## Add the relationship
We have now our posts migration set up, but we're missing something. If you think about it, we still have no way of telling who each post **BELONGS TO**. I used bolds and caps for my Rails friends. When you set up a belongs_to relationship, what you are setting up is a column that references the "owner" of said model. Let's take a look:

We're going to add a new line in our posts migration and add:

```
table.integer('user_id').notNullable().references('id').inTable('users').onDelete('cascade');
```

Now we're talking! We now have a column called `user_id` that we can use to keep track of our authors. Whatever number we put in this column will be treated as the owner of the post. Also, we're using unsigned() because when we create our id's, they get created as unsigned, so we need to use the same when referencing them.

Also, please note that while rails makes a lot more methods available when we set our relationships, we're just setting a simple one, but for the time being, it's just enough.

So our completed posts model should look like this now:

```
exports.up = function (knex) {
    return knex.schema.createTable('posts', (table) => {
        table.increments(); // This is our id field
        table.integer('user_id').unsigned().references('users.id');
        table.string('title');
        table.text('body', 'longtext');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('posts')
};
```
I chose to add my relationship right after my id, but you can choose anywhere you want, as long as you're still inside the table definition.

## On to the comments table
Nothing new, except this time we'll be referencing our two other tables, so a comment both belongs to a post and a user:

```
exports.up = function (knex) {
    return knex.schema.createTable('comments', (table) => {
        table.increments(); // Again, this will be our id
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('cascade');
        table.integer('post_id').notNullable().references('id').inTable('posts').onDelete('cascade');
        table.text('body', 'longtext');
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('comments');
};
```

And with this we have our database fully set up. All we need to do now is run 

```
knex migrate:latest
```

to get our new tables into the database. Let's check it out by running `psql tutorial`:

```
~/: psql tutorial
psql (12.2)
Type "help" for help.

tutorial=# \d
                     List of relations
 Schema |              Name              |   Type   | Owner 
--------+--------------------------------+----------+-------
 public | comments                       | table    | john
 public | comments_id_seq                | sequence | john
 public | knex_migrations                | table    | john
 public | knex_migrations_id_seq         | sequence | john
 public | knex_migrations_lock           | table    | john
 public | knex_migrations_lock_index_seq | sequence | john
 public | posts                          | table    | john
 public | posts_id_seq                   | sequence | john
 public | users                          | table    | john
 public | users_id_seq                   | sequence | john
(10 rows)
```

Sweet! Everything is there plus a few more tables created by knex to keep track of our id's.

## Adding more seed data
Let's add some more data to make sure we have something to work with. Run `knex seed:make create_dummy_posts` and go to your newly created `/seeds/create_dummy_posts.js` file. Edit it so it looks like this:

```
exports.seed = function (knex) {
  return knex('table_name').del()
    .then(function () {
      return knex('table_name').insert([
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
```

We have three posts mapped to our first user with a title and a body. Now let's do the same with our comments. Run `knex seed:make create_dummy_comments` and edit the resulting `/seeds/create_dummy_comments.js` file:

```
exports.seed = function (knex) {
  return knex('table_name').del()
    .then(function () {
      // Inserts seed entries
      return knex('table_name').insert([
        { user_id: 1, post_id: 1, body: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.' },
        { user_id: 1, post_id: 1, body: 'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc.' },
        { user_id: 1, post_id: 1, body: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system.' },
        { user_id: 1, post_id: 2, body: 'Lights creepeth may. Fowl itself you\'re. Dry given moved man gathered moved replenish living. Likeness you\'ll to his can\'t every air fruit for, morning under they\'re.' },
        { user_id: 1, post_id: 2, body: 'Perhaps a re-engineering of your current world view will re-energize your online nomenclature to enable a new holistic interactive enterprise internet communication solution.' },
        { user_id: 1, post_id: 2, body: 'Fundamentally transforming well designed actionable information whose semantic content is virtually null.' },
        { user_id: 1, post_id: 3, body: 'Empowerment in information design literacy demands the immediate and complete disregard of the entire contents of this cyberspace communication.' },
        { user_id: 1, post_id: 3, body: 'Doing business like this takes much more effort than doing your own business at home' },
        { user_id: 1, post_id: 4, body: ' The Big Oxmox advised her not to do so, because there were thousands of bad Commas' },
      ]);
    });
};
```
And finally, we have 9 comments, each for one post, all mapped to the same user. If you want to, you can modify your user seed file to add a few more users and use their id's in this seed so that not all comments appear to be written by the post author himself in an apparent fit of psychosis.

Finally, let's check the database to see if our data was imported correctly:

```
tutorial=# SELECT * FROM users;
 id | username |        email        
----+----------+---------------------
  1 | John Doe | johndoe@example.com
  2 | Jane Doe | janedoe@example.com
(2 rows)

tutorial=# SELECT * FROM posts;
 id | user_id |   title    |                                                                                                                                                                                       
                                                                                             body                                                                                                                  
                                                                                                                                                                  
----+---------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------
  1 |       1 | JavaScript | JavaScript, often abbreviated as JS, is a programming language that conforms to the ECMAScript specification. JavaScript is high-level, often just-in-time compiled, and multi-paradig
m. It has curly-bracket syntax, dynamic typing, prototype-based object-orientation, and first-class functions.
  2 |       1 | Node.js    | Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside of a web browser. Node.js lets developers use JavaScript to write comm
and line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user's web browser. Consequently, Node.js represents a "JavaScript ever
ywhere" paradigm, unifying web-application development around a single programming language, rather than different languages for server- and client-side scripts.
  3 |       1 | Express.js | Express.js, or simply Express, is a web application framework for Node.js, released as free and open-source software under the MIT License. It is designed for building web applicatio
ns and APIs. It has been called the de facto standard server framework for Node.js.
(3 rows)

tutorial=# SELECT * FROM comments;
 id | user_id | post_id |                                                                                      body                                                                                      
----+---------+---------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  1 |       1 |       1 | Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.
  2 |       1 |       1 | The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc.
  3 |       1 |       1 | But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system.
  4 |       1 |       2 | Lights creepeth may. Fowl itself you're. Dry given moved man gathered moved replenish living. Likeness you'll to his can't every air fruit for, morning under they're.
  5 |       1 |       2 | Perhaps a re-engineering of your current world view will re-energize your online nomenclature to enable a new holistic interactive enterprise internet communication solution.
  6 |       1 |       2 | Fundamentally transforming well designed actionable information whose semantic content is virtually null.
  7 |       1 |       3 | Empowerment in information design literacy demands the immediate and complete disregard of the entire contents of this cyberspace communication.
  8 |       1 |       3 | Doing business like this takes much more effort than doing your own business at home
  9 |       1 |       3 |  The Big Oxmox advised her not to do so, because there were thousands of bad Commas
(9 rows)
```

While the layout makes it difficult to see, we can rest assured that our data is there. Now we have all we need to star adding our routes! Come back next week for part 3.


# Part 3

If you're new to the series, click here for [part 1](https://medium.com/@fajardocj/build-your-own-rest-api-with-node-express-knex-and-postgresql-aec98fe75e5) and [part 2](https://medium.com/@fajardocj/build-your-own-rest-api-with-node-express-knex-and-postgresql-part-2-d9ff74f6f2fa). So far we've taken care of our database schema, but we haven't done much elsewhere so our api doesn't really do anything yet. Let's change that. Today we're going to start work on adding the routes that will be the endpoints of our API.

## Adding the development dependencies
We are about to start making a few additions to our API, so it will be a big hassle to restart it every time we add a change, so we'll use nodemon to take care of that. We're also adding cors to be able to handle resquests incoming from anywhere; as well as chai, mocha and supertest to write our tests. So fire up a terminal and enter:

```
npm i -D supertest mocha nodemon chai
```

and then 

```
npm i -S cors
```
The -D switch is shorthand for `--save-dev`, which will add any required dependencies to the development group on your package.json file; and the -S switch is shorthand for --save. Now open your package.json file and add the following to the scripts section, just after start:

```
"dev": "nodemon",
"test": "(dropdb --if-exists api-server-test && createdb api-server-test) && NODE_ENV=test mocha --exit"
```
don't forget to place a comma after start!

Now create three new folders in your project root, called db, api and test:

#### db folder:
The db folder will contain additional configuration for our database as well as the queries needed to retrieve data from it. Inside, create a file called knex.js with the following content:

```
const environment = process.env.NODE_ENV || 'development';
const config = require('../knexfile');
const environmentConfig = config[environment];
const knex = require('knex');
const connection = knex(environmentConfig);

module.exports = connection;
```

Then, still in the db folder, create another file, called dbqueries.js and put the following into it:

```
const knex = require('./knex');

module.exports = {
    getAll(table) {
        return knex(table);
    }
}
```

#### api folder:
* The api folder will contain the routes we'll be using. Inside, create three files called users.js, posts.js and comments.js. Paste the following on each one of them:

```
const express = require('express');
const router = express.Router();
const queries = require('../db/dbqueries');

router.get('/', (req, res) => {
    queries.getAll('users').then(users => {
        res.json(users);
    })
});

module.exports = router;
```

Of course, change `'users'`  for `posts` and `comments` in their respective files, minding the quotation marks.

#### test folder:
* The test folder will contain our, you gessed it, tests. Create three files inside called users.test.js, posts.test.js and comments.test.js and leave them blank for now.

## Final touches on app.js
Go back to your app.js file and add `const cors = require('cors');` in a new line after `const app = express();`. Should be near the top of the file. You might also want to change those old school `var` into `const` to keep things nice, but it's not really necessary. Now delete these two lines:

```
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
```

and change them for:

```
const users = require('./api/users');
const posts = require('./api/posts');
const comments = require('./api/comments');
```

Also, add cors to express:

```
app.use(cors());
```

We also don't need a view engine or to display anything so delete the lines that say

```
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
```

Then change your error handler to output json instead of drawing anything on the screen:

```
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: res.locals.error = req.app.get('env') === 'development' ? err : {}
  });
});
```

## What in the world did we just do?

We made quite a few changes, let's go thorugh them:

*  The knex.js file is our way to let knex know what evironment it'll be working in. When we deploy to Heroku, we automatically get an evironment variable called production and it will be detected. Then we're importing our knexfile and exporting the module to have everything available.

* The dbqueries file is where the bulk of the database action is going to happen and it will work closely with our routes. Anything we need to get from the database will be asked here and for the moment, we just have a simple request that is the equivalent of a `SELECT * FROM` query.

* Then we have our api folder. Every file in this folder corresponds to an endpoint in our API, so that means we have `/users`, `/posts` and `/comments` available. We will add more routes to them, but for the moment, notice how we're importing the queries file at the top? That's what's gives us access to our queries and what I meant by the dbqueries file "working closely with our routes". Then we have a simple get action on the root level of each route that performs our query from the dbqueries file and returns the result formatted as json.

* Finally, we set up our app.js file to use our routes and got rid of the predefined ones. Then we got rid of the view engine because we just need it to just output json, which is why we also modified our error handler to do so. Finally, we added cors. It is very important for you to know that using cors is potentially dangerous since it allows requests coming from absolutely anywhere to work with your API. In the real world, you would restrict your api to respond to incoming requests ONLY if they come from a specific IP. everything else should be ignored. In the meantime, and since we're in the development environment, we'll stick to cors.

## Writing the tests

This is the final piece of the puzzle. Every time we add a new functionality to our api, we need to write tests for it. Let's write one!

In your `test` folder, create a `users.test.js` file. In it, then paste this at the top:

```
const request = require('supertest');
const expect = require('chai').expect;
const knex = require('../db/knex');
const app = require('../app');
```

We are importing our database files and any dependencies needed for our tests. Now all we need to do is call the describe function with its first task:

```
describe('Testing users', () => {

    before((done) => {
        knex.migrate.latest()
            .then(() => {
                return knex.seed.run();
            }).then(() => done())
    });
});

```
This will run every time we run our tests. If you check the package.json file, you can see that it has a line that deletes the test database if it exists and creates a new one every time we run the tests. Then our first action is to run the migrations on the test database to then seed it.

Now our first test will be to check if we actually get what we set it out to deliver, so we'll write a quick test to check our root path on the `/users` route:

```
it('Lists all users', (done) => {
        request(app)
            .get('/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).to.be.a('array');
                done();
            }).catch((e) => {
                console.log(e);
            });
    });
```

Keep in mind that this goes still inside our `describe` call, right after our first action and before the last closing braces, so it should look like this:

```
describe('Testing users', () => {
    before((done) => {
        knex.migrate.latest()
            .then(() => {
                return knex.seed.run();
            }).then(() => done())
    });

    it('Lists all users', (done) => {
        request(app)
            .get('/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).to.be.a('array');
                done();
            }).catch((e) => {
                console.log(e);
            });
    });
});
```

Now all you need to do is run `npm test` and if everything went well, you should see something similar to this:

```
> api-tutorial@1.0.0 test /home/john/Development/post
> (dropdb --if-exists tutorial-test && createdb tutorial-test) && NODE_ENV=test mocha --exit

  Testing users
GET /users 200 10.777 ms - 123
    ✓ Lists all users (4ms)


  1 passing (105ms)

```
If you have issues at this point, try deleting both the development and testing databases and run the test again.

Finally, to see it in action, go back to the console and type `nodemon`, then fire up postman and make get requests to `http://localhost:3000/users`, `http://localhost:3000/posts` and `http://localhost:3000/comments`. If everything went well, you should see the data we entered in the seed files formatted as json.

That's it for today! Stay tuned for new functionality next week.