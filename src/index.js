// Import the configured items from the server file:
var { app, PORT } = require("./server");

// Import the database connector
const { databaseConnector } = require("./database");

// Imports for Socket.io
const { Server } = require("socket.io");

// Run the server
const expressServer = app.listen(PORT, async () => {
  await databaseConnector();
  console.log(`
  ExpressJS Social Gaming API is now running!
  `);
});

// ------ SocketIO for chat functionality ------
const io = new Server(expressServer, {
  cors: {
    origin: [
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://convokers.netlify.app",
    ],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected, socket: " + socket.id);

  socket.on("joinRoom", (data) => {
    const room = getRoom(data.names);
    socket.join(room.names[0] + " " + room.names[1]);
    //socket.join("test");
  });

  socket.on("sendMessage", (data) => {
    const room = getRoom(data.names);
    socket.to(room.names[0] + " " + room.names[1]).emit("receiveMessage", data);
    //socket.to("test").emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected, socket: " + socket.id);
  });
});

let rooms = [];

const getRoom = (names) => {
  for (let room of rooms) {
    if (room.names.every((r) => names.includes(r))) {
      return room;
    }
  }
  let newRoom = {
    names: names,
  };
  rooms.push(newRoom);
  return newRoom;
};