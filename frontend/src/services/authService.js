import axios from 'axios';

const API_URL = 'https://socialconnect-sn5j.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/users/login', {
        email,
        password
      });

      if (response.data.user) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error('Login failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Register user
  async register(name, email, password) {
    try {
      const response = await api.post('/users/register', {
        name,
        email,
        password
      });

      if (response.data.user) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error('Registration failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('user');
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  // Update stored user data
  updateStoredUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      
      if (response.data.user) {
        // Update localStorage
        this.updateStoredUser(response.data.user);
        return response.data.user;
      }

      throw new Error('Profile update failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  }

  // Upload avatar
  async uploadAvatar(userId, file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Avatar upload failed');
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }
}

export const authService = new AuthService();

