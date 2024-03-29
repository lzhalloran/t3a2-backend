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

// Login Route tests.
describe("User login route...", () => {
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

    // user to login
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can login user with appropriate data", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({
        password: "testPassword1",
        username: "testUser",
      });
    expect(response.statusCode).toEqual(200);
  });

  it("login fails with incorrect username", async () => {
    const response = await request(app).post("/users/login").send({
      password: "testPassword1",
      username: "testYser",
    });
    expect(response.statusCode).toEqual(400);
  });

  it("login fails with incorrect password", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({
        password: "testp2",
        username: "testUser",
      });
    expect(response.statusCode).toEqual(400);
  })

});

// Update Route tests.
describe("User update route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  let encryptedUserJWT = "";

  // connect and clean up before using the database
  beforeAll(async () => {
    await databaseConnector();
  });

  // recreate the example user after each test
  beforeEach(async () => {
    await User.deleteMany({});

    // user to update
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    const loginResponse = await request(app).post("/users/login").send({
      username: "testUser",
      password: "testPassword1",
    });
    encryptedUserJWT = loginResponse._body;
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can update user with appropriate data", async () => {
    const response = await request(app)
      .put("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        password: "testPassword2",
        name: "bobby2",
        about: "hi I'm bobby",
      });
    expect(response.statusCode).toEqual(200);
  });

  it("returns error details if password is too short", async () => {
    const response = await request(app)
      .put("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        password: "testPas",
        name: "bobby2",
        about: "hi I'm bobby",
      });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
  });

  it("returns error details if name is too short", async () => {
    const response = await request(app)
      .put("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        password: "testPassword2",
        name: "",
        about: "hi I'm bobby",
      });
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
  });
});

// Partial Update Route tests.
describe("User partial update route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  let encryptedUserJWT = "";

  // connect and clean up before using the database
  beforeAll(async () => {
    await databaseConnector();
  });

  // recreate the example user after each test
  beforeEach(async () => {
    await User.deleteMany({});

    // user to update
    const response = await request(app).post("/users/register").send({
      email: "testUser@email.com",
      password: "testPassword1",
      username: "testUser",
      name: "Test User",
    });
    const loginResponse = await request(app).post("/users/login").send({
      username: "testUser",
      password: "testPassword1",
    });
    encryptedUserJWT = loginResponse._body;
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can update user password", async () => {
    const response = await request(app)
      .patch("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        password: "testPassword2",
      });
    expect(response.statusCode).toEqual(200);
  });

  it("can update user name", async () => {
    const response = await request(app)
      .patch("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        name: "bobby2",
      });
    expect(response.statusCode).toEqual(200);
  });

  it("can update user about", async () => {
    const response = await request(app)
      .patch("/users/")
      .set("jwt", encryptedUserJWT)
      .send({
        about: "hi I'm bobby",
      });
    expect(response.statusCode).toEqual(200);
  });
});