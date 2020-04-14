const jwt = require('jsonwebtoken');
const privateKey = process.env.jwt_secret;

module.exports = {
    getToken(userID, username, email) {
        const payload = { user_id: userID, username: username, email: email };
        return jwt.sign(payload, privateKey, { algorithm: 'HS256', noTimestamp: true });
    },

    decodeToken(token) {
        return jwt.verify(token, privateKey);
    }
}