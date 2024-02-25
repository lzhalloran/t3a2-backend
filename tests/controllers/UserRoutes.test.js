// Import supertest to make web requests to the ExpressJS app
const request = require("supertest");

// Import the app
var { app } = require("../../src/server");
const { response } = require("express");

// Import the model
const { User } = require("../../src/models/UserModel");

// Register Route tests.
describe("User register route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  // connect and clean up before using the database
  beforeAll(async () => {
    await databaseConnector();
    await User.deleteMany({});
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can register a new user with appropriate data", async () => {
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(200);
    await User.deleteMany({});
  });

  it("returns error details if email is invalid", async () => {
    const response = await request(app).post("/users/register").send({
      email: "t",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
    await User.deleteMany({});
  });

  it("returns error details if password is too short", async () => {
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "te",
      username: "testUser",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
    await User.deleteMany({});
  });

  it("returns error details if username is too short", async () => {
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "te",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
    await User.deleteMany({});
  });

  it("returns error details if name is too short", async () => {
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "test",
      name: "",
    });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
    await User.deleteMany({});
  });

  it("returns error if email is not unique", async () => {
    let response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser2",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(500);
    await User.deleteMany({});
  });

  it("returns error if username is not unique", async () => {
    let response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    response = await request(app).post("/users/register").send({
      email: "testUser2@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    expect(response.statusCode).toEqual(500);
    await User.deleteMany({});
  });
});
