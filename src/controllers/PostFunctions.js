// Require corresponding model to create relevant functionality
const { Post } = require("../models/PostModel");
const { User } = require("../models/UserModel");

// ------ Database functions ------

// Create a new post
async function createPost(postData) {
  let newPost = new Post(postData);
  return await newPost.save();
}

// Update a post with new (partial) data
async function updatePost(postData) {
  let updatedPost = await Post.findByIdAndUpdate(
    postData.postID,
    postData.updatedData,
    {
      returnDocument: "after",
    }
  ).exec();
  return updatedPost;
}

// Delete a post by ID
async function deletePost(postID) {
  return await Post.findByIdAndDelete(postID).exec();
}

// Get posts by Author
async function getPostByAuthor(username) {
  return await Post.find({ author: username }).exec();
}

// Get posts by Game Category
async function getPostByGameCategory(category) {
  return await Post.find({ gameCategory: category }).exec();
}

// Get post by id
async function getPost(postID) {
  return await Post.findById(postID);
}

// ------ Middleware ------

// Verify the JWT username matches the post author in body
const verifyUserIsAuthor = async (request, response, next) => {
  let user = await User.findById(request.headers.userID);
  let userIsAuthor = user.username === request.body.author;
  if (userIsAuthor) {
    next();
  } else {
    next(new Error("JWT User and post author must match"));
  }
};

// Verify the JWT username matches the post author by postID
const verifyUserIsAuthorByPostID = async (request, response, next) => {
  let user = await User.findById(request.headers.userID);
  let post = await Post.findById(request.params.postID);

  let userIsAuthor = user.username === post.author;
  if (userIsAuthor) {
    next();
  } else {
    next(new Error("JWT User and post author must match"));
  }
};

// ------ Exports ------

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getPostByAuthor,
  getPostByGameCategory,
  verifyUserIsAuthor,
  verifyUserIsAuthorByPostID,
};
