const jwt = require('jsonwebtoken');
const privateKey = process.env.jwt_secret;

module.exports = {
    getToken(userID, username) {
        const payload = { user_id: userID, username: username };
        return jwt.sign(payload, privateKey, { algorithm: 'HS256', noTimestamp: true });
    }
}