const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
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

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userData) => {
    if (userData && userData._id) {
      connectedUsers.set(socket.id, userData);
      console.log(`User ${userData.name} joined with socket ID: ${socket.id}`);
      io.emit('onlineUsers', connectedUsers.size);
    }
  });

  socket.on('newPost', (postData) => {
    console.log('New post created:', postData._id);
    socket.broadcast.emit('postCreated', postData);
  });

  socket.on('likePost', (data) => {
    console.log('Post liked:', data.postId);
    socket.broadcast.emit('postLiked', data);
  });

  socket.on('newComment', (data) => {
    console.log('New comment on post:', data.postId);
    socket.broadcast.emit('commentAdded', data);
  });

  socket.on('deletePost', (data) => {
    console.log('Post deleted:', data.postId);
    socket.broadcast.emit('postDeleted', data);
  });

  socket.on('deleteComment', (data) => {
    console.log('Comment deleted:', data.commentId);
    socket.broadcast.emit('commentDeleted', data);
  });

  socket.on('profileUpdated', (userData) => {
    console.log('Profile updated:', userData._id);
    socket.broadcast.emit('userProfileUpdated', userData);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', {
      postId: data.postId,
      user: data.user,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.name} disconnected`);
      connectedUsers.delete(socket.id);
      io.emit('onlineUsers', connectedUsers.size);
    } else {
      console.log('User disconnected:', socket.id);
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = { app, io };