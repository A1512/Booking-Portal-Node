
require("dotenv").config();
//database information to connect app with database.
const sqlConfig = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE,
    options: {
        encrypt: false,
        trustedConnection: true, // Use Windows Authentication
      },
}

module.exports = sqlConfig;