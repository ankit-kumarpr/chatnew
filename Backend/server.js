require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const port = process.env.PORT || 5500;
const server = http.createServer(app);

// Setup Socket.IO with proper CORS
const io = new Server(server, {
  cors: {
    origin: "https://chatnew-7ut1.onrender.com/api", // frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`✅ User joined group: ${groupId}`);
  });

 socket.on("sendMessage", async ({ groupId, userId, content, fileUrl }) => {
  console.log("gorup id",groupId,userId);
  try {
    if (!userId || !groupId) {
      throw new Error("Missing groupId or userId");
    }

    const newMessage = new Message({
      group: groupId,
      sender: userId,
      content,
      file: fileUrl || null,
    });

    await newMessage.save();

    // Populate sender before emitting
    const populatedMessage = await newMessage.populate("sender", "name role");

    io.to(groupId).emit("receiveMessage", populatedMessage);
  } catch (error) {
    console.error("❌ Error saving message:", error.message);
  }
});


  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`🚀 Backend running at ${port}`);
});
