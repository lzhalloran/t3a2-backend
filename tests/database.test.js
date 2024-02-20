// Import mongoose for database functionality
const mongoose = require("mongoose");

// Import connector and disconnector from database to test
const { databaseConnector, databaseDisconnector } = require("../src/database");

// Test databaseConnector
describe("Database Connector", () => {
  test("Database connection readyState is 1 (connected)", async () => {
    await databaseConnector();
    expect(mongoose.connection.readyState).toEqual(1);
  });
});

// Test databaseDisconnector
describe("Database Disconnector", () => {
  test("Database disconnection readyState is 0 (disconnected)", async () => {
    await databaseDisconnector();
    expect(mongoose.connection.readyState).toEqual(0);
  });
});
