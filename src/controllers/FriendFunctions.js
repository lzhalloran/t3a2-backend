// Require corresponding model to create relevant functionality
const { User } = require("../models/UserModel");
const { getUserByID } = require("./UserFunctions");

// ------ Database ------

// Create a new friend request
async function createFriendRequest(requestingUser, otherUser) {
  requestingUser.requestedFriends.push(otherUser._id.toString());
  let updatedRequestingUser = await requestingUser.save();
  otherUser.receivedFriends.push(requestingUser._id.toString());
  let updatedOtherUser = await otherUser.save();
}

// Accept a friend request
async function acceptFriendRequest(acceptingUser, requestingUser) {
  acceptingUser.receivedFriends.pull(requestingUser._id.toString());
  acceptingUser.friends.push(requestingUser._id.toString());
  let updatedAcceptingUser = await acceptingUser.save();
  requestingUser.requestedFriends.pull(acceptingUser._id.toString());
  requestingUser.friends.push(acceptingUser._id.toString());
  let updatedRequestingUser = await requestingUser.save();
}

// Reject a friend request
async function rejectFriendRequest(rejectingUser, requestingUser) {
  rejectingUser.receivedFriends.pull(requestingUser._id.toString());
  rejectingUser.requestedFriends.pull(requestingUser._id.toString());
  let updatedRejectingUser = await rejectingUser.save();
  requestingUser.requestedFriends.pull(rejectingUser._id.toString());
  requestingUser.receivedFriends.pull(rejectingUser._id.toString());
  let updatedRequestingUser = await requestingUser.save();
}

// Delete a friend
async function deleteFriend(jwtUser, otherUser) {
    jwtUser.friends.pull(otherUser._id.toString());
    otherUser.friends.pull(jwtUser._id.toString());
    let updatedJwtUser = await jwtUser.save();
    let updatedOtherUser = await otherUser.save();
}

// ------ Middleware ------

// Verify a user exists by username provided in params
const verifyParamsUsername = async (request, response, next) => {
  let userExists = await User.exists({ username: request.params.username });
  if (userExists) {
    next();
  } else {
    next(new Error("Other user does not exist"));
  }
};

// Check if a friend request has not already been sent
const friendRequestNotSent = async (request, response, next) => {
  let jwtUser = await getUserByID(request.headers.userID);
  let otherUser = await User.findOne({ username: request.params.username });
  if (jwtUser.requestedFriends.includes(otherUser._id.toString())) {
    next(new Error("Friend request already sent"));
  } else if (otherUser.requestedFriends.includes(jwtUser._id.toString())) {
    next(new Error("Friend request already received"));
  } else {
    next();
  }
};

// Check if a friend request has already been sent
const friendRequestSent = async (request, response, next) => {
  let jwtUser = await getUserByID(request.headers.userID);
  let otherUser = await User.findOne({ username: request.params.username });
  if (jwtUser.receivedFriends.includes(otherUser._id.toString())) {
    next();
  } else {
    next(new Error("Friend request has not been received"));
  }
};

// Check if jwtuser and params user are not friends
const notAlreadyFriends = async (request, response, next) => {
  let jwtUser = await getUserByID(request.headers.userID);
  let otherUser = await User.findOne({ username: request.params.username });
  if (jwtUser.friends.includes(otherUser._id.toString())) {
    next(new Error("Already friends with this user"));
  } else {
    next();
  }
};

// Check if jwtuser and params user and friends
const alreadyFriends = async (request, response, next) => {
    let jwtUser = await getUserByID(request.headers.userID);
  let otherUser = await User.findOne({ username: request.params.username });
  if (jwtUser.friends.includes(otherUser._id.toString())) {
    next();
  } else {
    next(new Error("Already friends with this user"));
  }
}

// ------ Exports ------

module.exports = {
  createFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  verifyParamsUsername,
  friendRequestNotSent,
  friendRequestSent,
  notAlreadyFriends,
  alreadyFriends,
  deleteFriend,
};
