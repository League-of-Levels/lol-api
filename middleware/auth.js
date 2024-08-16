const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');
const mssql = require('mssql');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('sessionToken', mssql.NVarChar, token)
                .query('SELECT * FROM Sessions WHERE SessionToken = @sessionToken AND Expiration > GETDATE()');

            const session = result.recordset[0];

            if (!session) return res.status(401).json({ message: 'Invalid or expired session' });

            req.accountId = decoded.accountId;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
};
