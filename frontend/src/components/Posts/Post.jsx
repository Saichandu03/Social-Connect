import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { socketService } from '../../services/socketService';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';
import { FaTrashAlt } from "react-icons/fa";
import { FaCommentAlt } from "react-icons/fa";


import './Posts.css';

const Post = ({ post, onPostUpdate, onPostDelete, isOpenModel }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();

  // Check if current user has liked the post
  React.useEffect(() => {
    if (post.likes && user) {
      const userLike = post.likes.find(like => like.user._id === user._id || like.user === user._id);
      setIsLiked(!!userLike);
    }
  }, [post.likes, user]);

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await postService.toggleLike(post._id, user._id);
      
      // Update local state
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(response.post.likesCount);
      
      // Emit to socket for real-time updates
      socketService.emitLikePost({
        postId: post._id,
        userId: user._id,
        isLiked: newIsLiked,
        likesCount: response.post.likesCount
      });
      
      // Update parent component
      if (onPostUpdate) {
        onPostUpdate(response.post);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const deletePromise = postService.deletePost(post._id, user._id);

    toast.promise(
      deletePromise,
      {
        loading: 'Deleting post...',
        success: <b>Post deleted successfully!</b>,
        error: (err) => <b>{err.message}</b>,
      }
    );

    try {
      await deletePromise;
      
      // Emit to socket for real-time updates
      socketService.emitDeletePost({
        postId: post._id,
        userId: user._id
      });
      
      // Notify parent component
      if (onPostDelete) {
        onPostDelete(post._id);
      }
    } catch (error) {
      // Error is already handled by toast.promise
    }
  };

  const handleCommentAdded = (updatedPost) => {
    setCommentsCount(updatedPost.commentsCount);
    if (onPostUpdate) {
      onPostUpdate(updatedPost);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  // Check if current user is the post owner
  const isPostOwner = user._id === post.user._id;

  return (
    <div className="post-container" style={{ marginBottom: '20px' }}>
      <div className="post-header">
        <div className="post-user-info">
          <div className="user-avatar">
            {post.user.avatar ? (
              <img src={`https://socialconnect-sn5j.onrender.com${post.user.avatar}`} alt={post.user.name}/>
            ) : (
              <div className="avatar-placeholder">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <h4>{post.user.name}</h4>
            <p>{formatDate(post.createdAt)}</p>
          </div>
        </div>
        
        {isPostOwner && (
          <div className="post-actions-menu">
            <button 
              className="delete-post-btn"
              onClick={handleDelete}
              title="Delete post"
            >
              <FaTrashAlt style={{ fontSize: '1.2rem' }} />
            </button>
          </div>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.image && (
          <div className="post-image">
            <img src={`https://socialconnect-sn5j.onrender.com${post.image}`} alt="Post content"  />
          </div>
        )}
      </div>

      <div className="post-stats">
        <div className="stats-left">
          {likesCount > 0 && (
            <span className="likes-count">
              ❤️ {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>
        <div className="stats-right">
          {commentsCount > 0 && (
            <span 
              className="comments-count"
              onClick={() => setShowComments(!showComments)}
            >
              {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLoading}
        >
          <span className="action-icon">❤️</span>
          <span className="action-text">Like</span>
        </button>
        
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <span className="action-icon"><FaCommentAlt style={{fontSize : "1rem"}}/></span>
          <span className="action-text">Comment</span>
        </button>
      </div>

      {/* Only show comments if modal is not open */}
      {showComments && !isOpenModel && (
        <CommentSection 
          post={post}
          onCommentAdded={handleCommentAdded}
          isOpenModel={isOpenModel}
        />
      )}
    </div>
  );
};

export default Post;

