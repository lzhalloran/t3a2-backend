// Import mongoose for database functionality
const mongoose = require("mongoose");

// Import connector and disconnector from database to test
const { databaseConnector, databaseDisconnector } = require("../src/database");

// Test databaseConnector
describe("Database Connector", () => {
  test("Database connection", async () => {
    expect(mongoose.connection.readyState).toEqual(0);
    await databaseConnector();
    expect(mongoose.connection.readyState).toEqual(1);
  });
  test("Database disconnection", async () => {
    expect(mongoose.connection.readyState).toEqual(1);
    await databaseDisconnector();
    expect(mongoose.connection.readyState).toEqual(0);
  });
});
