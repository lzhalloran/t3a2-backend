// Import mongoose for database funcitonality
const mongoose = require("mongoose");

// An asynchronous function to connect to the database
async function databaseConnector(databaseURL) {
  await mongoose.connect(databaseURL);
}

// An asynchronous function to disconnect from the database
async function databaseDisconnector() {
  await mongoose.connection.close();
}

// Exports needed to control connection to the database from server
module.exports = {
  databaseConnector,
  databaseDisconnector,
};
