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

If you're new to the series, click here for part 1, part 2, part 3 and part 4. Our API is ready so it's time for a quick frontend, but first, let's take care of a few issues we left unsolved and make it do a little more. This is going to be a longer post so I won't explain every change in depth as often as in the previous parts. I will show you all the scss code, but I'm not going to explain them either.

## Updating the user seed file
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

## Updating the remaining seed files
We also need to update the other files to play better with our increments. Open the remaining seed files and change them so they go from

```
exports.seed = function (knex) {
  return knex('posts').del() // or 'comments'
    .then(function () {
[...]
```

to 

```
exports.seed = function (knex) {
  knex('posts').del();
  return knex.raw('TRUNCATE TABLE posts RESTART IDENTITY CASCADE')
    .then(function () {
[...]
```

## Updating the auth file
In your `/middleware/auth` folder, update the `getToken()` function from

```
getToken(userID, username) {
```

to

```
getToken(userID, username, email) {
```

so that it can also take an email string.

## Updating our queries file
Our queries files works for the most part, but we still have some work to do. Here's what the final version looks like:

```
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

    getPostsByUser(id) {
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
        return knex('posts').insert({ body: body, title: title, user_id: id });
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
```

* The first change is to our getAll query. We changed it so it has a check for the queried table. If the table is `users`, it will only return the id and the username, otherwise it would include the email and password hash. If it's any other table, it returns anything. Admittedly, we could've built a getAll method for every table, but I wanted to make this one parametric to illustrate how easy it is to add some simple logic.
* Then we built more queries, called getAllComments and getAllPosts, which illustrates the last point.
* Then we changed the getOne query with a check that's similar to the first one.
* We added a createPost query and then we fixed our login query to really handle errors.

## Updating our route files
Our root files need some updating too. Let's start with `/users`:

```
const express = require('express');
const router = express.Router();
const postsRouter = express.Router({ mergeParams: true });
const queries = require('../db/queries');
const auth = require('../middleware/auth');
router.use('/:id/posts', postsRouter);


router.get('/', (req, res) => {
    queries.getAll('users').then(users => {
        res.json(users);
    });
});

router.get('/:id', (req, res) => {
    queries.getOne('users', req.params.id).then(user => {
        res.json(user);
    });
});

postsRouter.get('/', (req, res) => {
    queries.getPostsByUser(req.params.id).then(posts => {
        res.json(posts);
    });
});

router.post('/', (req, res) => {
    queries.createUser(req.body.username, req.body.email, req.body.password).then(user => {
        res.json(user[0]);
    });
});

router.post('/login', (req, res) => {
    if (req.body.username == '' || req.body.password == '') {
        res.status(401).send({ error: "Wrong username or password" });
    } else {
        queries.login(req.body.username, req.body.password).then((user) => {
            res.json(auth.getToken(user.id, user.username, user.email));
        }).catch((error) => {
            res.status(401).send({ error: error.message });
        });
    }
});

router.post('/profile', (req, res) => {
    queries.getToken(req.header('Authorization').replace('Bearer: ', '')).then((data) => {
        res.json(data);
    });
});

module.exports = router;
```
* The most important change on this file is on lines 3 and 6 and they're related to the `postRouter.get('/')` route. What we're basically doing is adding a new route called `postRouter` and then setting `mergeParams: true` as it options. This allows for nesting and calling "one route from the other". In a nutshell, this allows us to have something like `user/posts` to get all posts made by a specific user. We will talk a bit more about this at the very end of the article.
* The rest of the changes are minor edits and cleanups that are self-explanatory.

Now we need to update the `posts` router to get both all and single posts and to create new ones:

```
const express = require('express');
const router = express.Router();
const queries = require('../db/queries');

router.get('/', (req, res) => {
    queries.getAllPosts().then(posts => {
        res.json(posts);
    })
});

router.get('/:id', (req, res) => {
    queries.getOne('posts', req.params.id).then(post => {
        res.json(post);
    });
});

router.post('/new', (req, res) => {
    queries.createPost(req.body.user_id, req.body.title, req.body.body).then(post => {
        res.json(post[0]);
    });
});

module.exports = router;
```

And Finally, we update our comments file in a similar fashion:

```
const express = require('express');
const router = express.Router();
const queries = require('../db/queries');

router.get('/:id', (req, res) => {
    queries.getAllComments(req.params.id).then(comments => {
        res.json(comments);
    })
});

// postId, userId, body
router.post('/', (req, res) => {
    queries.createComment(req.body.postId, req.body.userId, req.body.body).then(comment => {
        res.json(comment);
    })
});

module.exports = router;
```

With this, we are done with our API. Now let's go for the fun part!

## Building a simple React frontend for our API
We did a lot of work, but let's face it, just rendering a bunch of json is not the most exciting thing in the world, so let's put our shiny new API to use!

We are going to use create-react-app. If you don't have it installed, fire up a terminal and run `npm install -g create-react-app`. This will install create-react-app globally so you can start using it. To do so, launch a terminal in the folder of your choice (or stay in the one you were in when you installed CRA) and run `npx create-react-app my-api-frontend` and then wait for it to finish. We need a few more packages, so after CRA is done, cd into `my-api-frontend` and run `npm i -S bulma react-router-dom md5`

## The file structure
Go into the `/src` directory and delete `App.css`, `index.css` and `logo.svg`. Then create the following files and folders:

```
/src
├── index.js
├── App.js
├── App.test.js
├── components
│   └── Users
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   └── LoginError.jsx
│   ├── Home
│   │   └── Home.jsx
│   ├── NavBar
│   │   └── NavBar.jsx
│   ├── PostList
│   │   └── PostList.jsx
│   ├── Post
│   │   └── Post.jsx
│   ├── Comments
│   │   ├── CommentForm.jsx
│   │   └── Comments.jsx
│   ├── NewPost
│   │   └── NewPost.jsx
│   ├── NotFound
│   │   ├── lost.gif
│   │   └── NotFound.jsx
├── sass
│   ├── comments.scss
│   ├── home.scss
│   ├── loginError.scss
│   ├── login.scss
│   ├── navbar.scss
│   ├── newPost.scss
│   ├── notFound.scss
│   └── styles.scss
├── serviceWorker.js
└── setupTests.js
```

And now let's go into each file, but instead of going .

## index.js
```
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
```
This is the starting poit of our application. The most important thing we're doing here is we're importing BrowserRouter and wrapping our `<App />` call with it so we can have access to the history.


## App.js
```
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import './sass/styles.scss';
import Login from './components/Users/Login';
import SignUp from './components/Users/SignUp';
import Home from './components/Home/Home';
import Post from './components/Post/Post';
import NewPost from './components/NewPost/NewPost';
import NotFound from './components/NotFound/NotFound';


function App() {
  return (
    <div>
      <Switch>
        <Route path='/post/new' component={NewPost} />
        <Route path='/post/:id' component={Post} />
        <Route path='/signup' component={SignUp} />
        <Route path='/home' component={Home} />
        <Route exact path='/' component={Login} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
```

Again, self explanatory. This is where we define the routes our app is going to use and the main takeaway here is that the routes defined here have absolutely nothing to do with the routes we're defined in our API. We're also importing our styles file from the `/sass` folder, which will be rendered into CSS.

Another important thing to note is that the last `<Route />` call has no path and it's listed at the end of the list. This means that if there's not a match for any of the routes above it, it will match any route and will render the `NotFound` component which will be our 404 page.

## styles.scss
```
#root {
    min-height: 100vh;
}

body {
    background-color: #F7F7F7;
}


@import './login.scss';
@import './loginError.scss';
@import './navbar.scss';
@import './home.scss';
@import './comments.scss';
@import './notFound.scss';
@import './newPost.scss';
@import '~bulma/bulma.sass';

```
This is the only scss file we're going to import. All of the other ones will be called from this one.

## Login.jsx

```
import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import LoginError from './LoginError';

class Login extends Component {

    state = {
        username: "",
        password: "",
        loginError: false,
        loginErrorMessage: "Test"
    }

    handleLoginForm = (e) => {
        e.preventDefault();
        fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: {
                'Accept': 'Application/json',
                'Content-type': 'Application/json'
            },
            body: JSON.stringify(this.state)
        }).then(res => res.json())
            .then(data => {
                if (data.error) {
                    this.setState({ 'loginError': true, 'loginErrorMessage': data.error });
                } else {
                    localStorage.token = `Bearer: ${data}`;
                    this.props.history.push('/home');
                }
            })
    }

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    }

    render() {
        return (
            <>
                {this.state.loginError ? <LoginError message={this.state.loginErrorMessage} /> : null}
                <div id="login">
                    <div className="login-card">
                        <div className="card-title">
                            <h1 className="is-size-4 has-text-weight-bold">Please log in</h1>
                        </div>
                        <div className="login-content">
                            <form onSubmit={this.handleLoginForm}>
                                <input className="username" name="username" value={this.state.username} onChange={this.handleChange} type="text" title="username" placeholder="Username" />
                                <input className="password" type="password" title="password" placeholder="Password" name="password" value={this.state.password} onChange={this.handleChange} />
                                <button type="submit" className="btn btn-primary">Log in!</button>
                                <div className="options">
                                    <p>Need an account? <Link to={{ pathname: "/signup" }}>Sign up!</Link></p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default Login
```

Nothing special happening here. Just a controlled form that makes our first request to the API!


## login.scss

```
$primary:      hsl(171, 100%, 41%);
$grey-darker:  hsl(0, 0%, 21%);
$grey-dark:    hsl(0, 0%, 29%);
$grey:         hsl(0, 0%, 48%);
$grey-light:   hsl(0, 0%, 71%);
$grey-lighter: hsl(0, 0%, 86%);
$green-link: #00d1b2;


#login {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: #F7F7F7;

	.login-card {
		background: #fff;
		width: 24rem;
		box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.11);

		.card-title {
			background-color: darken($primary, 5%);
			padding: 2rem;

			h1 {
				color: #fff;
				text-align: center;
				font-size: 1.2rem;
			}
		}

		.login-content {
			padding: 3rem 2.5rem 2rem;
		}

		.username, .email, .password {
			display: block;
			width: 100%;
			font-size: 1rem;
			margin-bottom: 1.75rem;
			padding: 0.25rem 0;
			border: none;
			border-bottom: 1px solid $grey-lighter;
			transition: all .5s;

			&:hover {
				border-color: $grey;
			}

			&:active, &:focus {
				border-color: $primary;
			}
		}

		a {
            color: $green-link;
            transition: color .5s, border-color .5s;
            &:hover {
                color: darken($green-link, 10%);
            }
		}

		.options {
            text-align: center;
			color: $grey-light;
			margin-top: 1.5rem;
		}

		button {
			cursor: pointer;
			font-size: 1.2rem;
			color: $primary;
			border-radius: 4rem;
			display: block;
			width: 100%;
			background: transparent;
			border: 2px solid $primary;
			padding: 0.9rem 0 1.1rem;
			transition: color .5s, border-color .5s;

			&:hover, &:focus {
				color: darken($primary, 10%);
				border-color: darken($primary, 10%);
			}

			&:active {
				transform: translateY(1px);
			}
		}
	}
}


input:focus,
select:focus,
textarea:focus,
button:focus {
	outline: none;
}
```

Just a few styles to make the login form look better. If you're following along, it should look something like this:

[Login image]

## LoginError.jsx
```
import React from 'react'

export default function LoginError(props) {
    return (

        <div className="flash">
            <div class="notification is-danger is-light">
                <p>{props.message}</p>
            </div>
        </div>
    )
}

```

## loginError.scss
```
.flash {
    width: 24rem;
    position: absolute;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    top:200px;
}
```
This is a very small component what we'll use to render any errors that might arise during login.

## Signup.jsx
```
import React, { Component } from 'react'
import { Link } from 'react-router-dom';

class SignUp extends Component {

    state = {
        username: '',
        email: '',
        password: ''
    }

    handleSubmit = (event) => {
        event.preventDefault();
        fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'Application/Json',
                'Accept': 'Application/Json'
            },
            body: JSON.stringify(this.state)
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error)
                } else {
                    this.props.history.push('/login');
                }
            });
    }

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    }

    render() {
        return (
            <div id="login">
                <div className="login-card">
                    <div className="card-title">
                        <h1 className="is-size-4 has-text-weight-bold">Please sign up</h1>
                    </div>
                    <div className="login-content">
                        <form onSubmit={this.handleSubmit}>
                            <input className="username" name="username" type="text" value={this.state.username} onChange={this.handleChange} placeholder="Username" />
                            <input className="email" name="email" type="email" value={this.state.email} onChange={this.handleChange} placeholder="email" />
                            <input className="password" name="password" type="password" value={this.state.password} onChange={this.handleChange} placeholder="password" />
                            <button type="submit" className="btn btn-primary btn btn-link">Sign up!</button>
                            <div className="options">
                                <p>Have an account? <Link className="btn btn-link" to={{ pathname: "/" }}>log in!!</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


        )
    }
}

export default SignUp
```
Pretty much the same as the login, just with a different request. We also reused the `login.scss` file so there's no need to write any styles for it.

## Home.jsx
```
import React, { Component } from 'react';
import NavBar from '../NavBar/NavBar';
import PostList from '../PostList/PostList';

class Home extends Component {
    state = {
        currentUser: {
            id: "",
            username: "",
            email: ""
        },
        posts: []
    }

    componentDidMount() {
        if (!localStorage.token) {
            this.props.history.push('/')
        } else {
            this.getUser();
        }
    }

    getUser = async () => {
        if (localStorage.token) {
            await fetch('http://localhost:3000/users/profile', {
                method: "POST",
                headers: {
                    'Authorization': localStorage.token
                }
            })
                .then(resp => resp.json())
                .then(data => this.setState({ currentUser: { id: data.user_id, username: data.username, email: data.email } }));
            fetch(`http://localhost:3000/posts`)
                .then(resp => resp.json())
                .then(posts => this.setState({ posts: posts }));
        }
    }

    render() {

        return (
            <div>
                <NavBar history={this.props.history} user={this.state.currentUser} />
                <section className="section">
                    <div className="container box content">
                        <div className="columns">
                            <div className="column is-full has-background-white">
                                <h1 className="has-text-centered is-size-3 has-text-weight-bold">Latest posts</h1>
                                <PostList user={this.state.currentUser} posts={this.state.posts} />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default Home;

```

## home.scss

```
.main-container {
    margin-top: 32px;
}

.content {
    background-color: #fff;
}
```

Alright, things start to get interesting! The first thing that happens when this component is loaded is it checks for a token, which was set upon successful login. If there's no token, it kicks us back to the login page. If it finds a token, it makes a post request to our API to decode it. It then grabs the result and saves the username, id and email to the state, fetches all posts and then sends them to the state.

With the state fully loaded, we make two more things. We call the `<NavBar />` component at the top with the user info that is in our state, and then we render the `<PostList />` component with everything we have in the state. We'll get to the why in a bit.

## NavBar.jsx

```
import React from 'react';
import md5 from 'md5';
import { Link } from 'react-router-dom';

class NavBar extends React.Component {

    handleLogout = () => {
        localStorage.clear();
        this.props.history.push('/');
    }

    user = () => {
        return !this.props.user ? this.props.history.location.state.user : this.props.user;
    }

    handleNewPost = () => {
        this.props.history.push('/post/new', { user: this.user() })
    }

    homeLink = () => {
        return this.props.history.location.pathname == '/home' ? null : <p className="home"><Link className="has-text-primary" to="/home">Back to home</Link></p>;
    }

    render() {

        return (
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="container">
                    <div className="navbar-start">
                        <p className="navbar-item">
                            <img
                                className="profile-pic"
                                src={`https://www.gravatar.com/avatar/${md5(this.user().email)}`}
                                alt="User profile pic" />
                                Hello {this.user().username}
                        </p>
                    </div>
                    <div className="navbar-center">
                        {this.homeLink()}
                    </div>
                    <div className="navbar-end">
                        <div className="navbar-item">
                            <div className="buttons">
                                <button className="button is-primary has-text-weight-bold" onClick={this.handleNewPost}>New Post</button>
                                <button className="button is-primary has-text-weight-bold" onClick={this.handleLogout}>Log out</button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        )
    }
}

export default NavBar;
```

## navBar.scss
```
.profile-pic {
    border-radius: 50%;
    margin-right: 16px;
}

.navbar {
    box-shadow: 0 0.25em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
}

.navbar-item.navbar-center {
    flex-grow: 1;
    flex-direction: column;
    justify-content: center;
    margin-top: 16px;
}

.home {
    padding-top:16px;
}
```
This one is a little tricky:
* The first thing to notice is that we're importing the `md5` package. If you sign up to the app with your real email, provided you have a gravatar account, your email address is turned into an md5 hash to render your profile picture using the url `https://www.gravatar.com/avatar/md5-hash-of-your-email` as the `src` attribute for the `img` tag.
* Then we render the username from the `user.name` props we sent. But wait a minute, what's that on line 12? Well, we're going to call our `<NavBar />` from different locations, so we need to check where our user prop is, so we built this little function whose sole job is to check where our user prop is coming from.
* Then we have a similar check to see what page we're on. If we're in any page other than `/home`, it will render a link to take us back there.
* The rest of the file is self explanatory with a log out and new post button, each with its respective handler function.

## PostList.jsx

```
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class PostList extends Component {

    renderPosts = () => {
        return this.props.posts.map(post => {
            return (
                <div key={post.id}>
                    <Link className="is-size-4 has-text-weight-bold has-text-primary" to={{ pathname: `/post/${post.id}`, state: { user: this.props.user } }}>{post.title}</Link>
                    <p className="is-size-7 has-text-weight-light">By {post.username}</p>
                    <p>{post.body}</p>
                    <hr />
                </div>
            )
        });
    }

    render() {
        return (
            <div>
                {this.renderPosts()}
            </div>
        )
    }
}

export default PostList;
```
This one was called from `<Home />` and it also gets the user props. The reason why is we're rendering the list of our posts, and each one has a link that points to the individual post -for you Rails folks, think index and show-, which have a comment form, so we're going to need the user information later on. Are you starting to see a convoluted pattern of bouncing data around until we reach the needed component? Hold that thought, we are going to talk about it at the end.

## Post.jsx

```
import React, { Component } from 'react'
import NavBar from '../NavBar/NavBar'
import Comments from '../Comments/Comments';
import CommentForm from '../Comments/CommentForm'

class Post extends Component {

    state = {
        post: {
            title: '',
            body: ''
        },
        comments: []
    }

    componentDidMount() {
        fetch(`http://localhost:3000/posts/${this.props.match.params.id}`)
            .then(response => response.json())
            .then(post => this.setState({ post: { title: post.title, body: post.body } }));
        fetch(`http://localhost:3000/comments/${this.props.match.params.id}`)
            .then(response => response.json())
            .then(comments => this.setState({ comments: comments }));
    }

    showComments = () => {
        return this.state.comments.map(comment => {
            return <Comments key={comment.id ? comment.id : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
            } user={comment.username} body={comment.body} />
        });
    }

    addToComments = (user, body) => {

        fetch(`http://localhost:3000/comments/`, {
            method: 'POST',
            headers: {
                'Accept': 'Application/Json',
                'Content-Type': 'Application/Json'
            },
            body: JSON.stringify({ postId: `${this.props.match.params.id}`, userId: `${this.props.history.location.state.user.id}`, body: body })
        }).then(response => response.json());
        this.setState({ comments: [...this.state.comments, { 'username': user, 'body': body }] })

    }

    render() {
        return (
            <div>
                <NavBar history={this.props.history} user={this.props.history.location.state.user} />
                <section className="section">
                    <div className="container box content">
                        <div className="columns">
                            <div className="column is-full has-background-white">
                                <h1 className="has-text-centered is-size-3 has-text-weight-bold">{this.state.post.title}</h1>
                                <p>{this.state.post.body}</p>
                                <hr />
                                {this.showComments()}
                                <hr />
                                <CommentForm addToComments={this.addToComments} user={`${this.props.history.location.state.user.username}`} />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default Post
```
As soon as we load this component, we're fetching our API for the specific post we clicked and sending the result to the state. After that, we're using the post id to make another fetch, this time for the comments that belong to this specific post. We then display the post from the state and map over the comments array to render the comments. There are two other important things to notice here:
* Our `addComment()` function has a double job: It first makes a post request to the API to save the comment, and then adds the comment to the state so it gets added via ajax to the list of comments. This new comment is ephemeral and will be replaced by the one we saved on the database the next time we visit the post.
* We're calling our `<NavBar />` again, but since `Post.jsx` was called from a router `<Link />`, the user prop won't be available to the `<NavBar />` from `this.props.user`, but from `this.props.history.location.state.user`. Are you dizzy yet?

## Comments.jsx

```
import React, { Component } from 'react'

class Comments extends Component {
    render() {
        return (
            <div className="has-background-light comment">
                <p className="commenter"><strong>{this.props.user}</strong> says:</p >
                <p>{this.props.body}</p>
            </div >
        )
    }
}

export default Comments;
```
Couldn't be simpler. Just a plain old div that receives the comment contents to display on the post view.

## CommentForm.jsx

```
import React, { Component } from 'react'

class CommentForm extends Component {
    state = {
        body: '',
        user: ''
    }

    componentDidMount() {
        this.setState({ user: `${this.props.user}` })
    }

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.addToComments(this.state.user, this.state.body);
        this.setState({ body: '' });
    }

    handleCancel = (event) => {
        event.preventDefault();
        this.setState({ body: '' });
    }

    render() {
        return (
            <div className="commentFormContainer">
                <form onSubmit={this.handleSubmit}>
                    <div className="field">
                        <label className="label">Add your Voice!</label>
                        <div className="control">
                            <textarea className="textarea" name="body" value={this.state.body} onChange={this.handleChange} placeholder="Your comment..."></textarea>
                        </div>
                        <div className="field">
                            <div className="control is-pulled-right">

                                <div className="control is-pulled-right buttons">
                                    <button className="button is-danger is-light cancel commentButton" onClick={this.handleCancel}>Cancel</button>
                                    <button className="button is-primary commentButton">Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

export default CommentForm
```
Not much going on here either. A simple controlled form that will make a post request to the API to save the comment.

## comments.scss
```
.commentFormContainer {
    width: 500px;
    margin: 0 auto;
}

.commentButton {
    margin-top:16px;
}

.comment{
    margin: 16px 0px;
    padding: 16px;
    border: 1px solid #f5f5f5;
}
```
## NewPost.jsx
```
import React, { Component } from 'react'
import NavBar from '../NavBar/NavBar'

class NewPost extends Component {


    state = {
        user_id: this.props.location.state.user.id,
        title: '',
        body: ''
    }

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    }

    handleSubmit = async event => {
        event.preventDefault();
        await fetch('http://localhost:3000/posts/new', {
            method: 'POST',
            headers: {
                'Accept': 'Application/json',
                'Content-type': 'Application/json'
            },
            body: JSON.stringify(this.state)
        }).then(resp => resp.json())
            .then(this.props.history.push('/home'));
    }

    handleCancel = (event) => {
        event.preventDefault();
        this.setState({ title: '', body: '' })
    }

    render() {
        return (
            <div>
                <NavBar history={this.props.history} user={this.props.history.location.state.user} />
                <section className="section">
                    <div className="container box content">
                        <div className="columns">
                            <div className="column is-full has-background-white">
                                <h1 className="has-text-centered is-size-3 has-text-weight-bold">Adding a new post</h1>
                                <form onSubmit={this.handleSubmit}>

                                    <div className="field">
                                        <label className="label">Post title</label>
                                        <div className="control">
                                            <input className="input" name="title" value={this.state.title} onChange={this.handleChange} type="text" placeholder="Text input" />
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label className="label">Post contents</label>
                                        <div className="control">
                                            <textarea className="textarea" name="body" value={this.state.body} onChange={this.handleChange} placeholder="Your post content..."></textarea>
                                        </div>
                                        <div className="field">
                                            <div className="control is-pulled-right buttons">
                                                <button className="button is-danger is-light cancel postButton" onClick={this.handleCancel}>Cancel</button>
                                                <button className="button is-primary postButton">Submit</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default NewPost

```
This one is also simple. Just a component that sets the user prop on load and a simple controlled form that on submission will trigger a fetch with the data entered to save a new post.

## newPost.scss
```
.postButton {
    margin-top:16px;
}

.control textarea {
    height: 400px;
}
```

## NotFound.jsx
```
import React, { Component } from 'react';
import lost from './lost.gif';
import { Link } from 'react-router-dom';

class NotFound extends Component {
    render() {
        return (
            <div>
                <section className="section">
                    <div className="container box content">
                        <div className="columns">
                            <div className="column is-full has-background-white">
                                <h1 className="has-text-centered is-size-3 has-text-weight-bold">Oops! You took a wrong turn!</h1>
                                <div>
                                    <img className="centered-image" src={lost} alt="404 Not found" />
                                    <p className="center"><Link className="has-text-primary is-size-2 has-text-weight-bold" to="/home">Back to home</Link></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default NotFound;
```
Nothing but a huge gif of lost John Travolta with a link to go back home. This could've been a function component since we're not using state or props, but hey.

## notFound.scss
```
.centered-image {
  margin: 0 auto;
  display: block;
 }

 .center {
  text-align: center;
  margin-top: 16px;
}
```

## Closing thoughts
Our simple app is finished, but there's still room for growth if you're up to the challenge:

* Our backend has a auth file in a middleware folder, but that's not really middleware, it's just an helper function.
* We defined a function and a route for getting all the posts from a specific user. Want to implement that function? A nice way could be clicking on a username takes you to their profile and a list of their posts.
* Our LoginError is set up so it can display our errors coming from the backend, but we could change it around so it can handle other types of errors.
* Our state management is atrocius and a crime against humanity! We are passing the user object all around and all this bouncing gets tiring pretty soon. I designed it this way to illustrate the problem that libraries like redux solve. Instead of passing our objects back and forth, we have a single source of truth at the top from which with can read ad write without the mess of having state and props all around the place. If you're intimidated by this, another way of solving this would've been using context or even some higher order components to keep our state at the top of the component hierarchy. However, I must stress that redux should be the way to go.
* We protected the `/home` route, but if we log out, and revisit say `/post/new`, we understandably get an error. If you feel like fixing it, take a good look at the error and try to implement a check for the missing information (Hint: is `this.props.location.state is undefined`).
* We also could have used a better directory structure, but this is a highly debated topic that mostly boils down to personal preference.

With this, we finally reached the end of our project. Thank you so much for reading, let me know your thoughts!