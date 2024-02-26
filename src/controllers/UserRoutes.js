// Import Express for the router
const express = require("express");
// Create an Express router instance
const router = express.Router();

// Import the model
const { User } = require("../models/UserModel");

// Import express validator for standard validation
const { body, validationResult } = require('express-validator');

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
  verifyJWTHeader,
  verifyJWTUserID,
  uniqueEmailCheck,
  uniqueUsernameCheck,
  handleErrors,
} = require("./UserFunctions");

// Register a new user
router.post(
  "/register",
  body("email").isEmail().normalizeEmail(),
  body("password").trim().escape().isLength({ min: 8 }),
  body("username").trim().escape().isLength({ min: 3 }),
  body("name").trim().escape().isLength({ min: 1 }),
  uniqueEmailCheck,
  uniqueUsernameCheck,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    let userData = {
      email: request.body.email,
      password: request.body.password,
      username: request.body.username,
      about: "",
      name: request.body.name,
    };
    let newUser = await createUser(userData);

    response.json({
      user: newUser,
    });
  }
);

// Login an existing user
router.post("/login", handleErrors, async (request, response) => {
  let userFromDatabase = await User.findOne({
    username: request.body.username,
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
router.post("/refresh-token", handleErrors, async (request, response) => {
  let oldJWT = request.body.jwt;
  let refreshJWT = await verifyUserJWT(oldJWT).catch((error) => {
    return { error: error.message };
  });
  response.json(refreshJWT);
});

// Read a user by ID in params
router.get("/:userID", handleErrors, async (request, response) => {
  response.json(await getUserByID(request.params.userID));
});

// Read a user by ID in JWT
router.get(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
  async (request, response) => {
    response.json(await getUserByID(request.headers.userID));
  }
);

// Update a user by ID in JWT
router.put(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
  body("email").isEmail().normalizeEmail(),
  body("password").trim().escape().isLength({ min: 8 }),
  body("username").trim().escape().isLength({ min: 3 }),
  body("name").trim().escape().isLength({ min: 1 }),
  uniqueEmailCheck,
  uniqueUsernameCheck,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    let userData = {
      userID: request.headers.userID,
      updatedData: request.body,
    };
    let userFromDatabase = await updateUser(userData);
    let encryptedUserJWT = await generateUserJWT({
      userID: userFromDatabase.id,
      email: userFromDatabase.email,
      password: userFromDatabase.password,
    });
    response.json({
      user: userFromDatabase,
      jwt: encryptedUserJWT,
    });
    //response.json(await updateUser(userData));
  }
);

// Delete a user by ID in JWT
router.delete(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
  async (request, response) => {
    response.json(await deleteUser(request.headers.userID));
  }
);

// Export the router so it can be used elsewhere
module.exports = router;
