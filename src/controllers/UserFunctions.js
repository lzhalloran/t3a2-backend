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
  let userJwtVerified = jwt.verify(userJWT, process.env.JWT_SECRET, {
    complete: true,
  });
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
    handle: userData.handle,
    about: userData.about,
  });

  return await newUser.save();
}

// Read / Retrieve  user, by ID
async function getUserByID(userID) {
  return await User.findById(userID);
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

// Delete user by ID
async function deleteUser(userID) {
  return await User.findByIdAndDelete(userID).exec();
}

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
  updateUser,
  deleteUser,
};
