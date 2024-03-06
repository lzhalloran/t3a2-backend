// Import mongoose to handle schemas, models
const mongoose = require("mongoose");

// Schema
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  username: String,
  about: String,
  name: String,
  requestedFriends: [String],
  receivedFriends: [String],
  friends: [String],
  follows: [String],
});

// Make a model based on the above schema
const User = mongoose.model("User", UserSchema);

// Make the model available elsewhere
module.exports = { User };
