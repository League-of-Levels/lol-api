const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// Use the authentication routes
app.use('/', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
