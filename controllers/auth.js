const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');
const mssql = require('mssql');

const JWT_SECRET = process.env.JWT_SECRET;

function sha256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

exports.login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        const hashedPassword = sha256(password);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .input('password', mssql.NVarChar, hashedPassword)
            .query('SELECT * FROM Accounts WHERE Email = @Email AND Password = @Password AND VerificationDate IS NOT NULL');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'The email and password provided do not match our records.' });
        }

        const sessionToken = jwt.sign({ accountId: user.AccountID }, JWT_SECRET, { expiresIn: rememberMe ? '365d' : '1h' });

        if (rememberMe) {
            res.cookie('AccountID', user.AccountID, { maxAge: 365 * 24 * 60 * 60 * 1000 });
            res.cookie('AccountHash', hashedPassword, { maxAge: 365 * 24 * 60 * 60 * 1000 });
        }

        req.session.loggedIn = true;
        req.session.accountId = user.AccountID;
        req.session.accountEmail = user.Email;
        req.session.accountName = user.ProfileName;
        req.session.accountImage = user.ProfileImage;
        req.session.accountProfileURL = user.ProfileURL;
        req.session.accountBalls = user.Balls;
        req.session.accountLocks = user.Locks;

        // Fetch associated teams
        const teamsResult = await pool.request()
            .input('accountId', mssql.Int, user.AccountID)
            .query('SELECT Teams.TeamID FROM LinkAccountsTeams INNER JOIN Teams ON Teams.TeamID = LinkAccountsTeams.TeamID WHERE LinkAccountsTeams.AccountID = @AccountID');

        const teams = teamsResult.recordset.map(team => team.TeamID).join(',');

        req.session.accountTeams = teams;

        res.json({
            message: 'Login successful',
            sessionToken,
            account: {
                id: user.AccountID,
                name: user.ProfileName,
                email: user.Email,
                image: user.ProfileImage,
                profileURL: user.ProfileURL,
                balls: user.Balls,
                locks: user.Locks,
                teams
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getProfile = async (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized: Please log in first.' });
    }

    try {
        const profile = {
            accountId: req.session.accountId,
            accountName: req.session.accountName,
            accountEmail: req.session.accountEmail,
            accountImage: req.session.accountImage,
            accountProfileURL: req.session.accountProfileURL,
            accountBalls: req.session.accountBalls,
            accountLocks: req.session.accountLocks,
            accountTeams: req.session.accountTeams,
        };

        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
