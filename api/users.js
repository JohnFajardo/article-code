const express = require('express');
const router = express.Router();
const queries = require('../db/queries');
const argon = require('argon2');

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
    queries.login(req.body.username, req.body.password).then((token) => {
        res.json(token);
    });
});

module.exports = router;