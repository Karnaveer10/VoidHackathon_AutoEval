const { Server } = require("socket.io");
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // your frontend port
      methods: ["GET", "POST"],
      credentials: true,               // important if you use cookies
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

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
