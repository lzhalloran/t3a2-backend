// Import mongoose for database functionality
const mongoose = require("mongoose");

// Import connector and disconnector from database to test
const { databaseConnector, databaseDisconnector } = require("../src/database");

// Test databaseConnector
describe("Database Connector", () => {
  test("Database connection readyState is 1 (connected)", async () => {
    console.log("Node ENV: " + process.env.NODE_ENV);
    expect(mongoose.connection.readyState).toEqual(0);
    await databaseConnector();
    expect(mongoose.connection.readyState).toEqual(1);
    await databaseDisconnector();
    expect(mongoose.connection.readyState).toEqual(0);
  });
});

// Test databaseDisconnector
// describe("Database Disconnector", () => {
//   test("Database disconnection readyState is 0 (disconnected)", async () => {
//     await databaseDisconnector();
//     expect(mongoose.connection.readyState).toEqual(0);
//   });
// });
