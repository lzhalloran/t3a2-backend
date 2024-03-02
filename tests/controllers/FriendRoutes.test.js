// Import supertest to make web requests to the ExpressJS app
const request = require("supertest");

// Import the app
var { app } = require("../../src/server");
const { response } = require("express");

// Import the model
const { User } = require("../../src/models/UserModel");

// Request Friend route
describe("Friend request route...", () => {
  it("can add a friend request with valid JWT, other user name", async () => {
    const response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", encryptedUser1JWT)
      .send({});
    expect(response.statusCode).toEqual(200);
  });

  it("error code on invalid JWT", async () => {
    const response = await request(app)
      .post("/friends/add/user2")
      .set("jwt", "asdfasdfasdf")
      .send({});
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
  });

  it("error code on invalid other username", async () => {
    const response = await request(app)
      .post("/friends/add/user3")
      .set("jwt", "encryptedUser1JWT")
      .send({});
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("errors");
  });
});
