import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect(user) {
    if (!this.socket) {
      const SOCKET_URL = 'https://socialconnect-sn5j.onrender.com/';
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        
        // Join with user data
        if (user) {
          this.socket.emit('join', user);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.isConnected = false;
      });
    }

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Emit new post
  emitNewPost(postData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('newPost', postData);
    }
  }

  // Emit post like
  emitLikePost(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('likePost', data);
    }
  }

  // Emit new comment
  emitNewComment(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('newComment', data);
    }
  }

  // Emit post deletion
  emitDeletePost(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('deletePost', data);
    }
  }

  // Emit comment deletion
  emitDeleteComment(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('deleteComment', data);
    }
  }

  // Emit profile update
  emitProfileUpdate(userData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('profileUpdated', userData);
    }
  }

  // Emit typing indicator
  emitTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data);
    }
  }

  // Listen for events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();

