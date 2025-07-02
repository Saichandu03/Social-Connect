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

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["*"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', (userData) => {
    if (userData && userData._id) {
      connectedUsers.set(socket.id, userData);
      console.log(`User ${userData.name} joined with socket ID: ${socket.id}`);
      
      // Notify all clients about online users count
      io.emit('onlineUsers', connectedUsers.size);
    }
  });

  // Handle new post
  socket.on('newPost', (postData) => {
    console.log('New post created:', postData._id);
    // Broadcast new post to all connected clients
    socket.broadcast.emit('postCreated', postData);
  });

  // Handle post like
  socket.on('likePost', (data) => {
    console.log('Post liked:', data.postId);
    // Broadcast like update to all connected clients
    socket.broadcast.emit('postLiked', data);
  });

  // Handle new comment
  socket.on('newComment', (data) => {
    console.log('New comment on post:', data.postId);
    // Broadcast new comment to all connected clients
    socket.broadcast.emit('commentAdded', data);
  });

  // Handle post deletion
  socket.on('deletePost', (data) => {
    console.log('Post deleted:', data.postId);
    // Broadcast post deletion to all connected clients
    socket.broadcast.emit('postDeleted', data);
  });

  // Handle comment deletion
  socket.on('deleteComment', (data) => {
    console.log('Comment deleted:', data.commentId);
    // Broadcast comment deletion to all connected clients
    socket.broadcast.emit('commentDeleted', data);
  });

  // Handle user profile update
  socket.on('profileUpdated', (userData) => {
    console.log('Profile updated:', userData._id);
    // Broadcast profile update to all connected clients
    socket.broadcast.emit('userProfileUpdated', userData);
  });

  // Handle typing indicator for comments
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', {
      postId: data.postId,
      user: data.user,
      isTyping: data.isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.name} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Notify all clients about online users count
      io.emit('onlineUsers', connectedUsers.size);
    } else {
      console.log('User disconnected:', socket.id);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = { app, io };

