const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://social-connect-blush.vercel.app"
];

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-app';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Database connection established successfully'))
.catch(err => console.error('Database connection failed:', err));

const connectedUsers = new Map();

const handleSocketConnection = (socket) => {
  console.log('New user connected:', socket.id);

  const handleUserJoin = (userData) => {
    if (userData && userData._id) {
      connectedUsers.set(socket.id, userData);
      console.log(`${userData.name} joined the chat with socket ID: ${socket.id}`);
      io.emit('onlineUsers', connectedUsers.size);
    }
  };

  const handleNewPost = (postData) => {
    console.log('Broadcasting new post:', postData._id);
    socket.broadcast.emit('postCreated', postData);
  };

  const handlePostLike = (data) => {
    console.log('Broadcasting post like:', data.postId);
    socket.broadcast.emit('postLiked', data);
  };

  const handleNewComment = (data) => {
    console.log('Broadcasting new comment on post:', data.postId);
    socket.broadcast.emit('commentAdded', data);
  };

  const handlePostDeletion = (data) => {
    console.log('Broadcasting post deletion:', data.postId);
    socket.broadcast.emit('postDeleted', data);
  };

  const handleCommentDeletion = (data) => {
    console.log('Broadcasting comment deletion:', data.commentId);
    socket.broadcast.emit('commentDeleted', data);
  };

  const handleProfileUpdate = (userData) => {
    console.log('Broadcasting profile update for user:', userData._id);
    socket.broadcast.emit('userProfileUpdated', userData);
  };

  const handleTypingIndicator = (data) => {
    socket.broadcast.emit('userTyping', {
      postId: data.postId,
      user: data.user,
      isTyping: data.isTyping
    });
  };

  const handleDisconnection = () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`${userData.name} has left the chat`);
      connectedUsers.delete(socket.id);
      io.emit('onlineUsers', connectedUsers.size);
    } else {
      console.log('Unknown user disconnected:', socket.id);
    }
  };

  const handleSocketError = (error) => {
    console.error('Socket communication error:', error);
  };

  socket.on('join', handleUserJoin);
  socket.on('newPost', handleNewPost);
  socket.on('likePost', handlePostLike);
  socket.on('newComment', handleNewComment);
  socket.on('deletePost', handlePostDeletion);
  socket.on('deleteComment', handleCommentDeletion);
  socket.on('profileUpdated', handleProfileUpdate);
  socket.on('typing', handleTypingIndicator);
  socket.on('disconnect', handleDisconnection);
  socket.on('error', handleSocketError);
};

io.on('connection', handleSocketConnection);

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

const getHealthStatus = (req, res) => {
  res.json({
    message: 'Server is running smoothly!',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
};

app.get('/api/health', getHealthStatus);

const handleGlobalError = (error, req, res, next) => {
  console.error('Application error occurred:', error);
  res.status(500).json({
    message: 'Something went wrong on our end!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

const handleNotFound = (req, res) => {
  res.status(404).json({ message: 'The requested route was not found' });
};

app.use(handleGlobalError);
app.use('*', handleNotFound);

const PORT = process.env.PORT || 5000;

const startServer = () => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔌 Socket.IO is ready for real-time connections`);
  });
};

const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  server.close(() => {
    console.log('Server has been shut down successfully');
    mongoose.connection.close();
  });
};

process.on('SIGTERM', gracefulShutdown);

startServer();

module.exports = { app, io };