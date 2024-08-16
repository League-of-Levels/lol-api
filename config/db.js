const mssql = require('mssql');

const dbConfig = {
    user: 'your_db_user',
    password: 'your_db_password',
    server: 'your_db_server',
    database: 'your_db_name',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to false for production
    }
};

const poolPromise = new mssql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MS SQL Server');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql: mssql,
    poolPromise: poolPromise
};
