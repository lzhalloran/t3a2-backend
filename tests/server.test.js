// Import supertest to make web requests to the ExpressJS app
const request = require("supertest");

// Import the app
var { app } = require("../src/server");
const { response } = require("express");

// Default Route tests.
describe("Default route...", () => {
  it("Server 'homepage' can be viewed just fine.", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toEqual(200);
  });
  it("The message property exists and has data", async () => {
    const response = await request(app).get("/");
    expect(response.body).toHaveProperty("message");
  });
  it("The message property says 'Welcome to T3A2 API!'", async () => {
    const response = await request(app).get("/");
    expect(response.body.message).toEqual("Welcome to T3A2 API!");
  });
});

// Database Health Route tests.
describe("Database Health route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../src/database");

  it("can get the route with status code 200", async () => {
    // Connect database
    await databaseConnector();

    const response = await request(app).get("/databaseHealth");
    expect(response.statusCode).toEqual(200);

    // Disconnect database
    await databaseDisconnector();
  });
  it("connection health properties return as expected", async () => {
    // Connect database
    await databaseConnector();

    const response = await request(app).get("/databaseHealth");
    const health = response.body;
    expect(health.readyState).toEqual(mongoose.connection.readyState);
    expect(health.dbName).toEqual(mongoose.connection.name);
    expect(health.dbModels).toEqual(mongoose.connection.modelNames());
    expect(health.dbHost).toEqual(mongoose.connection.host);

    // Disconnect database
    await databaseDisconnector();
  });
});

// 404 Route tests.
describe("404 route...", () => {
  it("responds with status code 404", async () => {
    const response = await request(app).get("/blah");
    expect(response.statusCode).toEqual(404);
  });
  it("responds with message and the attempted path", async () => {
    const attemptedPath = "/blah";
    const response = await request(app).get(attemptedPath);
    expect(response.body.attemptedPath).toEqual(attemptedPath);
    expect(response.body.message).toEqual("No route with that path found!");
  });
});