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