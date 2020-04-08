const express = require('express');
const router = express.Router();
const queries = require('../db/queries');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
    queries.getAll('users').then(users => {
        res.json(users);
    });
});

router.get('/:id', (req, res, next) => {
    queries.getOne('users', req.params.id).then(user => {
        res.json(user);
    });
});

router.post('/signup', (req, res) => {
    queries.createUser(req.body.username, req.body.email, req.body.password).then(user => {
        res.json(user[0]);
    });
});

router.post('/login', (req, res) => {
    queries.login(req.body.username, req.body.password).then((user) => {
        if (user) {
            res.json(auth.getToken(user.id, user.username));
        } else {
            return res.sendStatus(401);
        }
    });
});

router.get('/profile', (req, res) => {
    queries.getToken(req.header).then((data) => {
        res.json(data);
    })
});


module.exports = router;