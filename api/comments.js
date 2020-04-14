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