// Require corresponding model to create relevant functionality
const { User } = require("../models/UserModel");

// ------ Database ------

// Create a new friend request
async function createFriendRequest(requestingUser, otherUser) {
  requestingUser.requestedFriends.push(otherUser._id);
  let updatedRequestingUser = await requestingUser.save();
  otherUser.receivedFriends.push(requestingUser._id);
  let updatedOtherUser = await otherUser.save();
  console.log(
    "Updated friend request: " +
      JSON.stringify(updatedRequestingUser) +
      " & " +
      JSON.stringify(updatedOtherUser)
  );
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

// ------ Exports ------

module.exports = {
  createFriendRequest,
  verifyParamsUsername,
};
