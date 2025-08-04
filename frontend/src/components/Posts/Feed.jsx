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
    loadAllPosts();
    setupRealtimeListeners();
    
    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const loadAllPosts = async () => {
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

  const setupRealtimeListeners = () => {
    const socket = socketService.getSocketInstance();
    if (!socket) return;

    const handleNewPost = (newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
      toast.success('New post appeared!');
    };

    const handlePostLike = (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, likesCount: data.likesCount }
            : post
        )
      );
    };

    const handleNewComment = (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, commentsCount: data.commentsCount, comments: [...(post.comments || []), data.comment] }
            : post
        )
      );
      toast.success('New comment added!');
    };

    const handlePostDeletion = (data) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== data.postId));
      toast.info('A post was removed');
    };

    const handleCommentDeletion = (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, commentsCount: data.commentsCount, comments: post.comments?.filter(comment => comment._id !== data.commentId) || [] }
            : post
        )
      );
    };

    socketService.subscribeToEvent('postCreated', handleNewPost);
    socketService.subscribeToEvent('postLiked', handlePostLike);
    socketService.subscribeToEvent('commentAdded', handleNewComment);
    socketService.subscribeToEvent('postDeleted', handlePostDeletion);
    socketService.subscribeToEvent('commentDeleted', handleCommentDeletion);
  };

  const cleanupSocketListeners = () => {
    const socket = socketService.getSocketInstance();
    if (socket) {
      socket.off('postCreated');
      socket.off('postLiked');
      socket.off('commentAdded');
      socket.off('postDeleted');
      socket.off('commentDeleted');
    }
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
          <button onClick={loadAllPosts} className="retry-button">
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

