import React, { useState, useEffect } from 'react';
import { postService } from '../../services/postService';
import { socketService } from '../../services/socketService';
import Post from './Post';
import CreatePost from './CreatePost';
import toast from 'react-hot-toast';
import './Posts.css';

const Feed = ({ isOpenModel, setIsOpenModel }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
    setupSocketListeners();
    
    return () => {
      // Cleanup socket listeners
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('postCreated');
        socket.off('postLiked');
        socket.off('commentAdded');
        socket.off('postDeleted');
        socket.off('commentDeleted');
      }
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await postService.getAllPosts();
      setPosts(fetchedPosts);
      setError(null);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Listen for new posts
    socket.on('postCreated', (newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
      toast.success('New post added!');
    });

    // Listen for post likes
    socket.on('postLiked', (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, likesCount: data.likesCount }
            : post
        )
      );
    });

    // Listen for new comments
    socket.on('commentAdded', (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, commentsCount: data.commentsCount, comments: [...(post.comments || []), data.comment] }
            : post
        )
      );
      toast.success('New comment added!');
    });

    // Listen for post deletions
    socket.on('postDeleted', (data) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== data.postId));
      toast.success('Post deleted!');
    });

    // Listen for comment deletions
    socket.on('commentDeleted', (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, commentsCount: data.commentsCount }
            : post
        )
      );
    });
  };

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="feed-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="error-container">
          <p>Error loading posts: {error}</p>
          <button onClick={fetchPosts} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <CreatePost onPostCreated={handlePostCreated}
        isOpenModel={isOpenModel}
        setIsOpenModel={setIsOpenModel}
      />
      
      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <h3>No posts yet</h3>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <Post 
              key={post._id} 
              post={post}
              onPostUpdate={handlePostUpdate}
              onPostDelete={handlePostDelete}
              isOpenModel={isOpenModel}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;

