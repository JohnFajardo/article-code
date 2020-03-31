const express = require('express');
const router = express.Router();
const queries = require('../db/queries');

router.get('/', (req, res) => {
    queries.getAll('users').then(users => {
        res.json(users);
    })
});

router.get('/:id', (req, res, next) => {
    queries.getOne('users', req.params.id).then(user => {
        res.json(user);
    })
});

module.exports = router;