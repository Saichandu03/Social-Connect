import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class PostService {
  // Create new post
  async createPost(content, userId, image = null) {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', userId);
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  }

  // Get all posts (feed)
  async getAllPosts() {
    try {
      const response = await api.get('/posts');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  }

  // Get posts by user
  async getUserPosts(userId) {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }

  // Get single post
  async getPost(postId) {
    try {
      const response = await api.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch post');
    }
  }

  // Delete post
  async deletePost(postId, userId) {
    try {
      const response = await api.delete(`/posts/${postId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  }

  // Like/Unlike post
  async toggleLike(postId, userId) {
    try {
      const response = await api.post(`/posts/${postId}/like`, {
        userId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  }

  // Add comment to post
  async addComment(postId, text, userId) {
    try {
      const response = await api.post(`/posts/${postId}/comment`, {
        text,
        userId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  // Delete comment
  async deleteComment(postId, commentId, userId) {
    try {
      const response = await api.delete(`/posts/${postId}/comment/${commentId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete comment');
    }
  }
}

export const postService = new PostService();

