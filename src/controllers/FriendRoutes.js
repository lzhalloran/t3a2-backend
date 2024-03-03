// Import Express for the router
const express = require("express");
// Create an Express router instance
const router = express.Router();

// Import the model
const { User } = require("../models/UserModel");

// Import express validator for standard validation
const { body, validationResult } = require("express-validator");

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
const {
  verifyParamsUsername,
  createFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  friendRequestNotSent,
  notAlreadyFriends,
  friendRequestSent,
} = require("./FriendFunctions");

// Create a new friend request
router.post(
  "/add/:username",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyParamsUsername,
  friendRequestNotSent,
  notAlreadyFriends,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    requestingUser = await getUserByID(request.headers.userID);
    otherUser = await User.findOne({
      username: request.params.username,
    });

    createFriendRequest(requestingUser, otherUser);

    response.json({
      message: "Friend request sent successfully",
      jwt: request.headers.jwt,
    });
  }
);

// Accept a friend request
router.put(
  "/accept/:username",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyParamsUsername,
  friendRequestSent,
  notAlreadyFriends,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    acceptingUser = await getUserByID(request.headers.userID);
    requestingUser = await User.findOne({
      username: request.params.username,
    });

    acceptFriendRequest(acceptingUser, requestingUser);

    response.json({
      message: "Friend request accepted successfully",
      jwt: request.headers.jwt,
    });
  }
);

// Reject a friend request
router.delete(
  "/reject/:username",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyParamsUsername,
  friendRequestSent,
  notAlreadyFriends,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    rejectingUser = await getUserByID(request.headers.userID);
    requestingUser = await User.findOne({
      username: request.params.username,
    });

    rejectFriendRequest(rejectingUser, requestingUser);

    response.json({
      message: "Friend request rejected successfully",
      jwt: request.headers.jwt,
    });
  }
);

// Export the router so it can be used elsewhere
module.exports = router;
