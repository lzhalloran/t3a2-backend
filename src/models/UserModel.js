// Import mongoose to handle schemas, models
const mongoose = require("mongoose");

// Schema
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  handle: String,
  about: String,
});

// Make a model based on the above schema
const User = mongoose.model("User", UserSchema);

// Make the model available elsewhere
module.exports = { User };
