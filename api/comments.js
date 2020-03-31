const express = require('express');
const router = express.Router();
const queries = require('../db/queries');

router.get('/', (req, res) => {
    queries.getAll('comments').then(comments => {
        res.json(comments);
    })
});

module.exports = router;