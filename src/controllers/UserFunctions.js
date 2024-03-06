// Require corresponding model to create relevant functionality
const { User } = require("../models/UserModel");

// Needed for environment variables
const dotenv = require("dotenv");
dotenv.config();

// ------ Encryption and Decryption functions -------

const crypto = require("crypto");
let encAlgorithm = "aes-256-cbc";
let encPrivateKey = crypto.scryptSync(process.env.ENC_KEY, "SpecialSalt", 32);
let encIV = crypto.scryptSync(process.env.ENC_IV, "SpecialSalt", 16);
let cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV);
let decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV);

// Encrypt a plaintext string
function encryptString(plainText) {
  cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV);
  return cipher.update(plainText, "utf8", "hex") + cipher.final("hex");
}

// Decrypt an encrypted string
function decryptString(encryptedText) {
  decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV);
  return decipher.update(encryptedText, "hex", "utf8") + decipher.final("utf8");
}

// Decrypt an encrypted string representing a JSON object
function decryptObject(encryptedJSON) {
  return JSON.parse(decryptString(encryptedJSON));
}

// ------ Hashing and Salting functions ------

const bcrypt = require("bcrypt");
const saltRounds = 10;

// Hash an unhashed string
async function hashString(unhashedString) {
  let salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(unhashedString, salt);
}

// Check hashed data against unhashed data
async function validateHashedData(unhashedData, hashedData) {
  return await bcrypt.compare(unhashedData, hashedData);
}

// ------ JWT functions ------

const jwt = require("jsonwebtoken");

// Generate a JSON Web Token (JWT) given payload object
// JWT based on object expires in 7 days
function generateJWT(payloadObject) {
  return jwt.sign(payloadObject, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Generate a JWT for User data
async function generateUserJWT(userData) {
  // Encrypt payload from plaintext to prevent viewing outside of app.
  let encryptedUserData = encryptString(JSON.stringify(userData));
  return generateJWT({ data: encryptedUserData });
}

// Check the given UserJWT is still valid, if so renew.
// Otherwise, send an Error that we need to sign in.
async function verifyUserJWT(userJWT) {
  // Verify that the JWT is still valid.
  let userJwtVerified = "";
  try {
    userJwtVerified = jwt.verify(userJWT, process.env.JWT_SECRET, {
      complete: true,
    });
  } catch {
    throw new Error("JWT not verified!");
  }
  // Decrypt the encrypted payload.
  let decryptedJwtPayload = decryptString(userJwtVerified.payload.data);
  // Parse the decrypted data into an object.
  let userData = JSON.parse(decryptedJwtPayload);
  // Find the user mentioned in the JWT.
  let targetUser = await User.findById(userData.userID).exec();
  // If the JWT data matches the stored data...
  if (
    targetUser.password == userData.password &&
    targetUser.email == userData.email
  ) {
    // User details are valid, make a fresh JWT to extend their token's valid time
    return generateJWT({ data: userJwtVerified.payload.data });
  } else {
    // Otherwise, user details are invalid and they don't get a new token.
    // When a frontend receives this error, it should redirect to a sign-in page.
    throw new Error({ message: "Invalid user token." });
  }
}

// ------ Database functions ------

// Create / register a new user
async function createUser(userData) {
  userData.hashedPassword = await hashString(userData.password);

  let newUser = new User({
    email: userData.email,
    password: userData.hashedPassword,
    username: userData.username,
    about: userData.about,
    name: userData.name,
  });

  return await newUser.save();
}

// Read / Retrieve  user, by ID
async function getUserByID(userID) {
  return await User.findById(userID);
}

// Read all users
async function getUsers(){
  return await User.find();
}

// Update user with new data
async function updateUser(userData) {
  userData.updatedData.password = await hashString(
    userData.updatedData.password
  );
  return await User.findByIdAndUpdate(userData.userID, userData.updatedData, {
    returnDocument: "after",
  }).exec();
}

// Update user with new partial data
async function partialUpdateUser(userData) {
  jwtUser = await getUserByID(userData.userID);
  // if(userData.updatedData.password) {
  //   userData.updatedData.password = await hashString(
  //     userData.updatedData.password
  //   );
  // } else {
  //   userData.updatedData.password = jwtUser.password;
  // }
  userData.updatedData.password = userData.updatedData.password ? await hashString(userData.updatedData.password) : jwtUser.password;
  userData.updatedData.name = userData.updatedData.name ? userData.updatedData.name : jwtUser.name;
  userData.updatedData.about = userData.updatedData.about ? userData.updatedData.about : jwtUser.about;
  userData.updatedData.username = jwtUser.username;
  userData.updatedData.email = jwtUser.email;

  
  return await User.findByIdAndUpdate(userData.userID, userData.updatedData, {
    returnDocument: "after",
  }).exec();
}

// Delete user by ID
async function deleteUser(userID) {
  return await User.findByIdAndDelete(userID).exec();
}

async function addFollow(userID, follow) {
  let user = await User.findById(userID);
  user.follows.push(follow.toString());
  let updatedUser = await user.save();
}

async function removeFollow(userID, follow) {
  let user = await User.findById(userID);
  user.follows.pull(follow.toString());
  let updatedUser = await user.save();
}

async function viewFollows(userID) {
  let user = await User.findById(userID);
  return user.follows;
}

// ------ Middleware functions ------

// Ensure the given JWT from Headers is valid, provide
// a refreshed JWT to keep the JWT valid for longer
const verifyJWTHeader = async (request, response, next) => {
  try {
    let rawJWTHeader = request.headers.jwt;

    let refreshedJWT = await verifyUserJWT(rawJWTHeader);

    request.headers.jwt = refreshedJWT;
    next();
  } catch (error) {
    next(error);
  }
};

// Retrieve the userID from verified JWT, add to header
const verifyJWTUserID = async (request, response, next) => {
  let userJWTVerified = jwt.verify(
    request.headers.jwt,
    process.env.JWT_SECRET,
    { complete: true }
  );
  let decryptedJWTPayload = decryptString(userJWTVerified.payload.data);
  let userData = JSON.parse(decryptedJWTPayload);

  request.headers.userID = userData.userID;
  next();
};

// Validate user email uniqueness
const uniqueEmailCheck = async (request, response, next) => {
  let isEmailinUse = await User.exists({ email: request.body.email }).exec();
  if (isEmailinUse) {
    next(new Error("An account with this email address already exists."));
  } else {
    next();
  }
};

// Validate username uniqueness
const uniqueUsernameCheck = async (request, response, next) => {
  let isUsernameinUse = await User.exists({
    username: request.body.username,
  }).exec();
  if (isUsernameinUse) {
    next(new Error("An account with this username already exists."));
  } else {
    next();
  }
};

// General middleware to handle errors
const handleErrors = async (error, request, response, next) => {
  if (error) {
    response.status(500).json({
      error: error.message,
    });
  } else {
    next();
  }
};

// ------ Exports ------

module.exports = {
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
  getUsers,
  updateUser,
  partialUpdateUser,
  deleteUser,
  verifyJWTHeader,
  verifyJWTUserID,
  uniqueEmailCheck,
  uniqueUsernameCheck,
  handleErrors,
  addFollow,
  removeFollow,
  viewFollows,
};
