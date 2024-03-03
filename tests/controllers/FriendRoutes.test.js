// Import supertest to make web requests to the ExpressJS app
const request = require("supertest");

// Import the app
var { app } = require("../../src/server");
const { response } = require("express");

// Import the model
const { User } = require("../../src/models/UserModel");
const { getUserByID } = require("../../src/controllers/UserFunctions");

// Request Friend route
describe("Friend request route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  let encryptedUser1JWT = "";
  let encryptedUser2JWT = "";

  // connect to the database, seed data
  beforeAll(async () => {
    await databaseConnector();
    await User.deleteMany({});

    // user1
    let response = await request(app).post("/users/register").send({
      email: "user1@email.com",
      password: "password1",
      username: "user1",
      name: "User One",
    });
    let loginResponse = await request(app).post("/users/login").send({
      username: "user1",
      password: "password1",
    });
    encryptedUser1JWT = loginResponse._body;

    // user2
    response = await request(app).post("/users/register").send({
      email: "user2@email.com",
      password: "password2",
      username: "user2",
      name: "User Two",
    });
    loginResponse = await request(app).post("/users/login").send({
      username: "user2",
      password: "password2",
    });
    encryptedUser2JWT = loginResponse._body;
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can add a friend request with valid JWT, other user name", async () => {
    const response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual("Friend request sent successfully");

    encryptedUser1JWT = response.body.jwt;

    requestingUser = await User.findOne({ username: "user1" });
    otherUser = await User.findOne({ username: "user2" });
    expect(requestingUser).toHaveProperty("requestedFriends");
    expect(requestingUser.requestedFriends[0]).toEqual(
      otherUser._id.toString()
    );
    expect(otherUser).toHaveProperty("receivedFriends");
    expect(otherUser.receivedFriends[0]).toEqual(requestingUser._id.toString());
  });

  it("error code on invalid JWT", async () => {
    const response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT + 1)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code on invalid other username", async () => {
    const response = await request(app)
      .post("/friends/add/user3")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code when trying to friend request if already requested", async () => {
    const response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code when trying to friend request if already a friend", async () => {
    let response = await request(app)
      .put("/friends/accept/user1")
      .set("jwt", encryptedUser2JWT)
      .send({});
    response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });
});

// Accept Friend request route
describe("Accept friend request route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  let encryptedUser1JWT = "";
  let encryptedUser2JWT = "";

  // connect to the database, seed data
  beforeAll(async () => {
    await databaseConnector();
    await User.deleteMany({});

    // user1
    let response = await request(app).post("/users/register").send({
      email: "user1@email.com",
      password: "password1",
      username: "user1",
      name: "User One",
    });
    let loginResponse = await request(app).post("/users/login").send({
      username: "user1",
      password: "password1",
    });
    encryptedUser1JWT = loginResponse._body;

    // user2
    response = await request(app).post("/users/register").send({
      email: "user2@email.com",
      password: "password2",
      username: "user2",
      name: "User Two",
    });
    loginResponse = await request(app).post("/users/login").send({
      username: "user2",
      password: "password2",
    });
    encryptedUser2JWT = loginResponse._body;

    // friend request from user 1 to user 2
    response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    encryptedUser1JWT = response.body.jwt;
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can accept a request with valid JWT, other user name", async () => {
    const response = await request(app)
      .put("/friends/accept/user1")
      .set("jwt", encryptedUser2JWT)
      .send({});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual(
      "Friend request accepted successfully"
    );

    encryptedUser1JWT = response.body.jwt;

    requestingUser = await User.findOne({ username: "user1" });
    acceptingUser = await User.findOne({ username: "user2" });
    expect(requestingUser).toHaveProperty("friends");
    expect(requestingUser.friends[0]).toEqual(acceptingUser._id.toString());
    expect(acceptingUser).toHaveProperty("friends");
    expect(acceptingUser.friends[0]).toEqual(requestingUser._id.toString());
    expect(requestingUser.requestedFriends.length).toEqual(0);
    expect(acceptingUser.receivedFriends.length).toEqual(0);
  });

  it("error code on invalid JWT", async () => {
    const response = await request(app)
      .put("/friends/accept/user1")
      .set("jwt", encryptedUser1JWT + 1)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code on invalid other username", async () => {
    const response = await request(app)
      .put("/friends/accept/user")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code when trying to accept a non-existent request", async () => {
    const response = await request(app)
      .put("/friends/accept/user1")
      .set("jwt", encryptedUser2JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });
});

// Reject Friend request route
describe("Reject friend request route...", () => {
  // Import mongoose for database functionality
  const mongoose = require("mongoose");
  // Import connector and disconnector from database to test
  const {
    databaseConnector,
    databaseDisconnector,
  } = require("../../src/database");

  let encryptedUser1JWT = "";
  let encryptedUser2JWT = "";

  // connect to the database, seed data
  beforeAll(async () => {
    await databaseConnector();
    await User.deleteMany({});

    // user1
    let response = await request(app).post("/users/register").send({
      email: "user1@email.com",
      password: "password1",
      username: "user1",
      name: "User One",
    });
    let loginResponse = await request(app).post("/users/login").send({
      username: "user1",
      password: "password1",
    });
    encryptedUser1JWT = loginResponse._body;

    // user2
    response = await request(app).post("/users/register").send({
      email: "user2@email.com",
      password: "password2",
      username: "user2",
      name: "User Two",
    });
    loginResponse = await request(app).post("/users/login").send({
      username: "user2",
      password: "password2",
    });
    encryptedUser2JWT = loginResponse._body;

    // friend request from user 1 to user 2
    response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    encryptedUser1JWT = response.body.jwt;
  });

  // disconnect and clean up after using the database
  afterAll(async () => {
    await User.deleteMany({});
    await databaseDisconnector();
  });

  it("can reject a request with valid JWT, other user name", async () => {
    const response = await request(app)
      .delete("/friends/reject/user1")
      .set("jwt", encryptedUser2JWT)
      .send({});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual(
      "Friend request rejected successfully"
    );

    encryptedUser1JWT = response.body.jwt;

    requestingUser = await User.findOne({ username: "user1" });
    rejectingUser = await User.findOne({ username: "user2" });
    expect(requestingUser).toHaveProperty("requestedFriends");
    expect(rejectingUser).toHaveProperty("receivedFriends");
    expect(requestingUser.requestedFriends.length).toEqual(0);
    expect(rejectingUser.receivedFriends.length).toEqual(0);
  });

  it("error code on invalid JWT", async () => {
    const response = await request(app)
      .delete("/friends/reject/user1")
      .set("jwt", encryptedUser1JWT + 1)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code on invalid other username", async () => {
    const response = await request(app)
      .delete("/friends/reject/user")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });

  it("error code when trying to reject a non-existent request", async () => {
    const response = await request(app)
      .delete("/friends/reject/user1")
      .set("jwt", encryptedUser2JWT)
      .send({});
    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty("error");
  });
});