// Import mongoose for database functionality
const mongoose = require("mongoose");

// Configure Mongoose Database, depending on environment
var databaseURL = "";
switch (process.env.NODE_ENV.toLowerCase()) {
  case "test":
    databaseURL = "mongodb://localhost:27017/T3A2API-test";
    break;
  case "development":
    databaseURL = "mongodb://localhost:27017/T3A2API-dev";
    break;
  case "production":
    databaseURL = process.env.DATABASE_URL;
    break;
  default:
    console.error("Incorrect JS environment specified, database not connected");
    break;
}

// An asynchronous function to connect to the database
async function databaseConnector() {
  try {
    await mongoose.connect(databaseURL);
    console.log(`
  Database connected successfully!
    `);
  } catch (error) {
    console.warn(`
    Some error occurred while connecting to the database! Error Details:
    ${error}
    `);
  }
}

// An asynchronous function to disconnect from the database
async function databaseDisconnector() {
  try {
    await mongoose.connection.close();
    console.log(`
  Database disconnected successfully!
    `);
  } catch (error) {
    console.warn(`
    Some error occurred while disconnecting from the database! Error Details:
    ${error}
    `);
  }
}

// Exports needed to control connection to the database from server
module.exports = {
  databaseConnector,
  databaseDisconnector,
};
