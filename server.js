// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');

const app = express();

// Ensure SESSION_SECRET is set
const sessionSecret = process.env.SESSION_SECRET || 'default_fallback_secret'; // Replace with your secure fallback for development or remove fallback
if (!sessionSecret || sessionSecret === 'default_fallback_secret') {
    throw new Error('SESSION_SECRET is not set or is using a default value. Please set a secure SESSION_SECRET in your environment variables.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'default_fallback_jwt_secret'; // Same logic for JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'default_fallback_jwt_secret') {
    throw new Error('JWT_SECRET is not set or is using a default value. Please set a secure JWT_SECRET in your environment variables.');
}

// Body parser middleware to handle JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session management setup
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Use the authentication routes
app.use('/', authRoutes);

// Catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
