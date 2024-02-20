// Import the configured items from the server file:
var { app, PORT } = require("./server");

// Import the database connector
const { databaseConnector } = require('./database')

// Run the server
app.listen(PORT, async () => {
  await databaseConnector();
  console.log(`
  ExpressJS Social Gaming API is now running!
  `);
});
