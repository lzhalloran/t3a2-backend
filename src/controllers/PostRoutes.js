// Import Express for the router
const express = require("express");
// Create an Express router instance
const router = express.Router();

// Import the models
const { User } = require("../models/UserModel");
const { Post } = require("../models/PostModel");

// Import express validator for standard validation
const { body, validationResult } = require("express-validator");

// Import the controller functions
const {
  verifyJWTHeader,
  verifyJWTUserID,
  handleErrors,
} = require("./UserFunctions");
const {
  createPost,
  updatePost,
  deletePost,
  verifyUserIsAuthor,
  verifyUserIsAuthorByPostID,
  getPost,
  getPostByAuthor,
  getPostByGameCategory,
} = require("./PostFunctions");

// Create a new post
router.post(
  "/",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyUserIsAuthor,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    let newPost = await createPost(request.body);

    response.json({
      post: newPost,
    });
  }
);

// Update a post by postID (JWT must be author)
router.patch(
  "/:postID",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyUserIsAuthorByPostID,
  handleErrors,
  async (request, response) => {
    // If validation failed, return a response with code 400
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    let postData = {
      postID: request.params.postID,
      updatedData: request.body,
    };
    let updatedPost = await updatePost(postData);

    response.json({
      post: updatedPost,
    });
  }
);

// Delete a post by postID (JWT must be author)
router.delete(
  "/:postID",
  verifyJWTHeader,
  verifyJWTUserID,
  verifyUserIsAuthorByPostID,
  handleErrors,
  async (request, response) => {
    response.json(await deletePost(request.params.postID));
  }
);

// Get a post by ID
router.get("/:postID", handleErrors, async (request, response) => {
  response.json(await getPost(request.params.postID));
});

// Get posts by username/author
router.get("/author/:username", handleErrors, async (request, response) => {
  response.json(await getPostByAuthor(request.params.username));
});

// Get posts by game category
router.get(
  "/category/:gameCategory",
  handleErrors,
  async (request, response) => {
    response.json(await getPostByGameCategory(request.params.gameCategory));
  }
);

// Export the router so it can be used elsewhere
module.exports = router;
