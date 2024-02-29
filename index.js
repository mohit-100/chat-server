const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./router/uRoute"); 
const messageRoute = require("./router/messageRoute")
const socket = require("socket.io");
const path = require('path')
// Import userRoutes at the top
// const authRoutes = require("./routes/auth");
// const messageRoutes = require("./routes/messages");

const app = express();
require("dotenv").config();

app.use(cors({
  origin:["http://localhost:3000"],
  methods:["POST","GET"],
  credentials:true
}));
app.use(express.json());

// Import the userRoutes before connecting to MongoDB

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

// app.use("/api/messages", messageRoutes);

app.use("/api/auth", userRoutes); // assuming userRoutes handles authentication
app.use("/api/messages", messageRoute); // assuming messageRoute handles messages



const __dirname1 = path.resolve(__dirname, '..'); // Assuming your server file is in the 'server' directory

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "client", "build")));
  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'client', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("API is Running Successfully");
  });
}


  //--------------------Deployment----------------- 
 const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.message);
    }
  });

  // Correct the handling of the 'typing' event
  socket.on("typing", ({ to, from }) => {
    const sendUserSocket = onlineUsers.get(to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("typing", { from });
    }
  });

});
  