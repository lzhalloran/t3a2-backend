// Import Express for the router
const express = require("express");
// Create an Express router instance
const router = express.Router();

// Import the model
const { User } = require("../models/UserModel");

// Import the controller functions
const {
  encryptString,
  decryptString,
  decryptObject,
  hashString,
  validateHashedData,
  generateJWT,
  generateUserJWT,
  verifyUserJWT,
  createUser,
  getUserByID,
  updateUser,
  deleteUser,
} = require("./UserFunctions");

// Register a new user
router.post("/register", async (request, response) => {
  let userData = {
    email: request.body.email,
    password: request.body.password,
    handle: request.body.handle,
    about: request.body.about,
  };
  let newUser = await createUser(userData);

  response.json({
    user: newUser,
  });
});

// Login an existing user
router.post("/login", async (request, response) => {
  let userFromDatabase = await User.findOne({
    email: request.body.email,
  }).exec();

  if (
    await validateHashedData(request.body.password, userFromDatabase.password)
  ) {
    let encryptedUserJWT = await generateUserJWT({
      userID: userFromDatabase.id,
      email: userFromDatabase.email,
      password: userFromDatabase.password,
    });

    response.json(encryptedUserJWT);
  } else {
    response.status(400).json({ message: "Invalid user details provided." });
  }
});

// Refresh a user's JWT
router.post("/refresh-token", async (request, response) => {
  let oldJWT = request.body.jwt;
  let refreshJWT = await verifyUserJWT(oldJWT).catch((error) => {
    return { error: error.message };
  });
  response.json(refreshJWT);
});

// Read a user by ID
router.get("/:userID", async (request, response) => {
  response.json(await getUserByID(request.params.userID));
});

// Update a user by ID
router.put("/:userID", async (request, response) => {
  let userData = {
    userID: request.params.userID,
    updatedData: request.body,
  };

  response.json(await updateUser(userData));
});

// Delete a user by ID
router.delete("/:userID", async (request, response) => {
  response.json(await deleteUser(request.params.userID));
});

// Export the router so it can be used elsewhere
module.exports = router;
