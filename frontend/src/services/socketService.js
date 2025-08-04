import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  establishConnection(user) {
    if (!this.socket) {
      const SOCKET_URL = 'https://socialconnect-sn5j.onrender.com/';
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        forceNew: true,
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupConnectionHandlers(user);
    }

    return this.socket;
  }

  setupConnectionHandlers(user) {
    this.socket.on('connect', () => {
      console.log('🔗 Successfully connected to the server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (user) {
        this.socket.emit('join', user);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Connection failed:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection failed:', error);
    });
  }

  terminateConnection() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  getSocketInstance() {
    return this.socket;
  }

  checkConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }

  broadcastNewPost(postData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('newPost', postData);
    }
  }

  broadcastPostLike(likeData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('likePost', likeData);
    }
  }

  broadcastNewComment(commentData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('newComment', commentData);
    }
  }

  broadcastPostDeletion(deletionData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('deletePost', deletionData);
    }
  }

  broadcastCommentDeletion(deletionData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('deleteComment', deletionData);
    }
  }

  broadcastProfileUpdate(userData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('profileUpdated', userData);
    }
  }

  broadcastTypingStatus(typingData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', typingData);
    }
  }

  subscribeToEvent(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  unsubscribeFromEvent(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();

