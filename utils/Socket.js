// socket.js
const { Server } = require("socket.io");
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",  // ✅ your React app URL
      credentials: true,                // ✅ allow cookies & auth
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a room
    socket.on("joinRoom", (roomId) => {
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      socket.join(roomId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo };
