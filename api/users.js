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
    queries.getPostByUser(req.params.id).then(posts => {
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