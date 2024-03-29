// Import mongoose to handle schemas, models
const mongoose = require("mongoose");

// Schema
const PostSchema = new mongoose.Schema({
  title: String,
  author: String,
  image: String,
  textArea: String,
  gameCategory: String,
  time: { type: Date, default: Date.now },
});

// A model based on the above schema
const Post = mongoose.model("Post", PostSchema);

// Make the model available elsewhere
module.exports = { Post };