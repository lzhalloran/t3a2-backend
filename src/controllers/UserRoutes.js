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
  partialUpdateUser,
  deleteUser,
  verifyJWTHeader,
  verifyJWTUserID,
  uniqueEmailCheck,
  uniqueUsernameCheck,
  handleErrors,
  getUsers,
  addFollow,
  removeFollow,
  viewFollows,
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
      avatarImg: request.body.avatarImg ? request.body.avatarImg : "",
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
    userFromDatabase &&
    (await validateHashedData(request.body.password, userFromDatabase.password))
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

// Get a user by username
router.get("/username/:username", handleErrors, async (request, response) => {
  const user = await User.findOne({ username: request.params.username });

  if (user) {
    response.json(user);
  } else {
    response.status(400).json({ message: "User not found" });
  }
});

// Get all users
router.get("/list/all", handleErrors, async (request, response) => {
  response.json(await getUsers());
});

// Update a user by ID in JWT
router.put(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
  body("password").trim().escape().isLength({ min: 8 }),
  body("name").trim().escape().isLength({ min: 1 }),
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
    user = await getUserByID(request.headers.userID);
    userData.updatedData.username = user.username;
    userData.updatedData.email = user.email;

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

// Partial update a user by ID in JWT
router.patch(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
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
    let userFromDatabase = await partialUpdateUser(userData);
    let encryptedUserJWT = await generateUserJWT({
      userID: userFromDatabase.id,
      email: userFromDatabase.email,
      password: userFromDatabase.password,
    });
    response.json({
      user: userFromDatabase,
      jwt: encryptedUserJWT,
    });
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

// Add a follow to the user
router.post(
  "/follows/:follow",
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
  async (request, response) => {
    await addFollow(request.headers.userID, request.params.follow);
    response.json({
      message: "Follow added successfully",
    });
  }
);

// Remove a follow from the user
router.delete(
  "/follows/:follow",
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
  async (request, response) => {
    await removeFollow(request.headers.userID, request.params.follow);
    response.json({
      message: "Follow removed successfully",
    });
  }
);

// View follows
router.get(
  "/follows/list",
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
  async (request, response) => {
    response.json({
      follows: await viewFollows(request.headers.userID),
    });
  }
);

// Export the router so it can be used elsewhere
module.exports = router;
