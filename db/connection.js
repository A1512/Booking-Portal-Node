//database information to connect app with database.
const sqlConfig = {
    user:'aman',
    password:'aman@123',
    server:'192.168.29.2',
    database:'MyBooking',
    options: {
        encrypt: false,
        trustedConnection: true, // Use Windows Authentication
      },
}

module.exports = sqlConfig;