const express = require('express');
const { login, getProfile } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/profile', getProfile);
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', accountId: req.session.accountId });
});

module.exports = router;
