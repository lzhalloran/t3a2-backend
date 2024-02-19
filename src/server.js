// Import .env data for server configuration
const dotenv = require("dotenv");
dotenv.config();

// Import Express and create an express app instance
const express = require("express");
const app = express();
// Use .env data or assign default values
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

// Configure some basic Helmet setings on the server instance
const helmet = require("helmet");
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
    },
  })
);

// Configure some basic CORS settings on the server instance.
// Any front-end that should be allowed to interact with this API
// Should be listed in the origins array for CORS configuration.
// "https://deployedApp.com" is a placeholder
const cors = require("cors");
var corsOptions = {
  origin: ["http://localhost:5000", "https://deployedApp.com"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Configure API-friendly request data formatting
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Mongoose Database, depending on environment
const mongoose = require('mongoose');
var databaseURL = "";
switch (process.env.NODE_ENV.toLowerCase()){
    case "test":
        databaseURL = "mongodb://localhost:27017/T3A2API-test";
        break;
    case "development":
        databaseURL = "mongodb://localhost:27017/T3A2API-dev";
        break;
    case "production":
        databaseURL = process.env.DATABASE_URL;
        break;
    default:
        console.error("Incorrect JS environment specified, database not connected");
        break;
}
// Import database connection functionality
const {databaseConnector} = require('./database');
// Attempt connection to the database
databaseConnector(databaseURL).then(() => {
    console.log(`  Database connected successfully!
    `);
}).catch(error => {
    console.log(`
    Some error occurred while connecting to the database! Error Details:
    ${error}
    `)
});
// A route that returns useful database connection details.
// More details here: 
// https://mongoosejs.com/docs/api/connection.html
app.get("/databaseHealth", (request, response) => {
    let databaseState = mongoose.connection.readyState;
    let databaseName = mongoose.connection.name;
    let databaseModels = mongoose.connection.modelNames();
    let databaseHost = mongoose.connection.host;

    response.json({
        readyState: databaseState,
        dbName: databaseName,
        dbModels: databaseModels,
        dbHost: databaseHost
    });
});

// A temporary route to test initial server is functioning.
// This path is the server API's "homepage".
app.get("/", (request, response) => {
  response.json({
    message: "Welcome to T3A2 API!",
  });
});

// Keep this route at the end, before exports.
// A 404 route should only trigger if no preceding routes or middleware was run.
app.get("*", (request, response) => {
  response.status(404).json({
    message: "No route with that path found!",
    attemptedPath: request.path,
  });
});

// Exports needed to run the server.
module.exports = {
  HOST,
  PORT,
  app,
};
