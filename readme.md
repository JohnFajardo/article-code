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

# Part 4

If you’re new to the series, click here for part 1, part 2 and part 3. We now have a basic API where we can do basic queries for posts, comments and users, but speaking of users, we have no actual way of signing up or logging in or out. Let’s take care of that.
Adding new dependencies

Fire up a terminal on your project folder and run npm i -S argon2 body-parser jsonwebtoken:

* As always, the i is shorthand for the --installswitch and -S is shorthand the --save switch.
* argon2 is an award-winning password hashing function that we’ll use to save our users’ password hashes instead of saving the passwords themselves to the database.
* body-parser is a middleware that we’ll use to parse the body of our incoming requests.
* Finally, jsonwebtoken is a token generator that we’ll use to store in our users’ browsers to keep their sessions alive.

Now we need to update our app.js file to include body-parser:

```
const bodyparser = require('body-parser')
app.use(bodyparser.json());
```

## Changing the database

So far we’re storing our user’s username and email, but we’re not saving their password hashes, so open your timeStamp_create-users.js file and add the following line:

```
table.string('password_hash');
```

And then rerun your migrations. If you have any problems rerunning th migrations, just delete the database by running dropdb yourDatabaseName and recreate it by running createdb yourDatabaseName. Mind you, when you run your seeds, your users will not have a hash, so we’ll take care of that later on.
Signing up new users: the route

Remember how the queries file worked closely with the routes? It’s that time again! Let’s start with the route. In your users.js file, add the following:

```
router.post('/signup', (req, res) => {
    queries.createUser(req.body.username, req.body.email, req.body.password).then(user => {
        res.json(user[0]);
    });
});
```

So we’re creating a new route to /signup that takes a post request. Then we’re calling a function from our queries files that we haven’t written yet, but that it takes a username, an email address and a password. We will be sending that info as json, and thanks to body-parser, our data is parsed into strings that will be usable to our function when it gets it. Finally, we’re taking our function response and rendering it as json.
Signing up new users: the function

As explained earlier, our function, called createUser, takes three arguments: a username, an email and a password. We are going to use argon2 to hash the password before saving the user -sans their password for safety- to the database. Since argon2’s hashing function is asynchronous, we need to use async/await in our function:

```
async createUser(username, email, password) {try {
  let password_hash = await argon.hash(password);
return knex('users').returning(['username', 'email']).insert({ username: username, email: email, password_hash: password_hash });} catch (error) {
  console.log('That did not go well.');
  console.error(error);
  process.exit(1);
  }
}
```

At this point, you should also console log some hashes for you to copy to your seeds file.

To test our signup functionality, fire up Postman and make a post request to http://localhost:3000/users/signup with this as the body:

```
{
 "username": "Tony Stark",
 "email": "irontony@starkindustries.biz",
 "password": "IamIronMan"
}
```

You’ll get the following response:

```
{
"username": "Tony Stark",
"email": "irontony@starkindustries.biz"
}
```

And if you check your database, you’ll see your new user there, complete with it’s password hash. Cool, now let’s make our users log in!
Creating our JWT signing function

Before we log in, we need a way to issue tokens. Our users should make a post request to our login route and then get a token that we can grab from our frontend. To start, create a new folder in your project root called middleware. Inside, create a file called auth.js and paste the following:

```
const jwt = require('jsonwebtoken');
const privateKey = process.env.jwt_secret;module.exports = {
    getToken(userID, username) {
        const payload = { user_id: userID, username: username };
        return jwt.sign(payload, privateKey, { algorithm: 'HS256', noTimestamp: true });
    },decodeToken(token) {
        return jwt.verify(token, privateKey);
    }
}
```

We will use these methods later to generate and read tokens. But before we do, we need to add an environment variable to our system and add the following:

```
jwt_secret='someRandomStringOfYourChoice'
```

JWT uses this string to generate the tokens and it’s very important that you don’t share them publicly on GitHub since it’s a huge security risk. Click here for instructions for Mac, Windows and Linux. If you have a hard time setting up an environment variable on your system, you can replace process.env.jwt_secret with the string you want to use, but ONLY AS A TEMPORARY MEASURE. This is terrible practice, a security hole and you’ll look bad to the world, so don’t commit your changes until you take care of this.
How JWT works

JWT is a token generator that needs three pieces of information:

* A header that tells it what hashing algorithm to use.
* A payload, which is the actual information we want to store.
* And a signature, which at the very least requires a secret word, which we set in our environment variable.

If you go to jwt.io, you can play around with it in a visual way. There’s a section to the right of the screen in which you can input the information you want and see the token update to the left. So for example, you can leave the header section the way it is and then erase the payload section and replace it with

```
{
  "id": 1,
  "username": "John Doe"
}
```

and set the secret to awesomesecret, you get the following token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJKb2huIERvZSJ9.zF7dg9DVjjTIGWnS2_AQa67v3i1Y0oxBQXLsMRd2lEA
```

See how they’re separated by dots? Each group represents the header, the payload and the signature respectively.

How is any of this useful? Note that after the token, there’s a blue checkmark saying Signature Verified, which means that all the information provided is correct. To test it, paste this in the token section:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJKb2huIERvZSJ9.J-RT_r_PN0izkBzUTt4nsbbvmBXIvXECB2t-PzASn1o
```

See how it now says Invalid Signature? That’s because I changed the secret to superawesomesecret. Go ahead and change it yourself so you can see it in action.

Coming back to our function, we have all the pieces we need to build our token. We have our private key (the secret word), we are building a payload that has the username and their id and we finally call jwt.sign with the payload, the secret and an object that will become the header. Finally, we’re returning the token.

Our second method, decodeToken, does what it says: it checks the validity of the supplied token using the private key we set up earlier.
Logging users in

With our token system in place, we can now proceed to build our login functionality. We’re going to build a new /login route that will send a query to the database with the username and the password, then when it gets the user back, it will return a token based on the user info:

```
router.post('/login', (req, res) => {
  queries.login(req.body.username, req.body.password).then((user) => {
  if (user) {
    res.json(auth.getToken(user.id, user.username));
  } else {
      return res.sendStatus(401);
    }
  });
});
```

Then we can define our login function in the queries file:

```
async login(username, password) {
  let getUser = await knex('users').where('username', username);
  let user = getUser[0];
  try {
    if (await argon.verify(user.password_hash, password)) {
      return user;
    } else {
      console.log('password did not match');
    }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
},
```

Our login function first gets a user with the supplied username. It the receives the user as an array with a single object, but since the function is asynchronous, we add the [0] after it’s returned. Then we’re making use of argon2’s verify function to compare the supplied password with the stored hash. If the comparison gives a match, we return the user, which in turn will be taken by the router to create a token and return it. The rest of the function is self-explanatory.

Finally, we have one last route to make /profile, which is going to take the token, verify it and return the user’s name and id:

```
router.post('/profile', (req, res) => {
    queries.getToken(req.header('Authorization').replace('Bearer ', '')).then((data) => {
        res.json(data);
    });
});
```

First we need to assume that our frontend is using the browser localstorage to store our token as 'Bearer': ourToken. We’re grabbing the token from localstorage, stripping off the 'Bearer ' part and passing it to our getToken function in our queries file:

```
async getToken(token) {
  newToken = auth.decodeToken(token)
  return newToken;
}
```

Then our router is going to render the token as json, which we can grab from the frontend to use the username and id. With it, our API is complete, yay!
Room for improvement

So far our API works, but it could use some work. For example, we’re not really handling password errors, so it crashes if you enter a wrong password. Also, if you’re a newcomer, it’s hard to see how we can really use all this since we’re just “rendering json”. We’re going to take care of that in the next and last part, where we’re going to fix things around and build a simple frontend in React. Stay tuned!

# Part 5

If you're new to the series, click here for part 1, part 2, part 3 and part 4. Our API is ready so it's time for a quick frontend, but first, let's take care of a few issues we left unsolved and make it do a little more.

## Fixing the user seed file
Our seed file worked at first, but then we were copying hashes from somewhere else and hardcoded them into the file. This works, but ideally, we should be generating our hashes at runtime, so open your seed file and change it like so:

```
exports.seed = (knex) => {
  knex('users').del();
  return knex.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    .then(async () => {
      const users = [
        { username: 'John Doe', email: 'johndoe@example.com', 'password': 'abc123' },
        { username: 'Jane Doe', email: 'janedoe@example.com', 'password': 'abc123' },
        { username: 'Rob Doe', email: 'robdoe@example.com', 'password': 'abc123' }
      ];
      for (user of users) {
        user.password_hash = await argon.hash(user.password);
      }
      return knex('users').insert(users.map(({ password, ...rest }) => rest));
    });
}
```
Not a huge change. We're adding a password key to our users with its value set to the plain text version of the password, then we're looping over our user object and adding a new password_hash key where we're doing the actual hashing. Finally, we're mapping over the users and saving them to the database without the `password` key with the help of the spread operator.

# Fixing our login logic
Our login function works, but we're not really handling any errors, so if we enter a wrong username or password, our app crashes. Let's take care of that.