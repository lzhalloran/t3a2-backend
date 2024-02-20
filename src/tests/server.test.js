// Import supertest to make web requests to the ExpressJS app
const request = require("supertest");

// Import the app
var { app } = require("../server");

// Default Route tests.
describe("Default route exists.", () => {
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
