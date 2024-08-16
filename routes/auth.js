const express = require('express');
const { login } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', accountId: req.accountId });
});

module.exports = router;
