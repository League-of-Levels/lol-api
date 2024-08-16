const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');
const mssql = require('mssql');

const JWT_SECRET = 'your_secret_key';

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT AccountID, Password, Hash, Active FROM Accounts WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user || !user.Active) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }

        const isMatch = await bcrypt.compare(password + user.Hash, user.Password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const sessionToken = jwt.sign({ accountId: user.AccountID }, JWT_SECRET, { expiresIn: '1h' });

        await pool.request()
            .input('accountId', mssql.Int, user.AccountID)
            .input('sessionToken', mssql.NVarChar, sessionToken)
            .input('expiration', mssql.DateTime, new Date(Date.now() + 60 * 60 * 1000))
            .query('INSERT INTO Sessions (AccountID, SessionToken, Expiration) VALUES (@accountId, @sessionToken, @expiration)');

        res.json({ sessionToken });
    } catch (error) {
        console.error('Login error: ', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
