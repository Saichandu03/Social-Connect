import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { socketService } from '../../services/socketService';
import toast from 'react-hot-toast';
import './Posts.css';

const CommentSection = ({ post, onCommentAdded, isOpenModel }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const { user } = useAuth();

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await postService.addComment(post._id, newComment.trim(), user._id);
      
      // Reset form
      setNewComment('');
      
      // Emit to socket for real-time updates
      socketService.emitNewComment({
        postId: post._id,
        comment: response.post.comments[response.post.comments.length - 1],
        commentsCount: response.post.commentsCount
      });
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(response.post);
      }
      
      toast.success('Comment added!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    // Check if user can delete this comment (comment owner or post owner)
    const canDelete = user._id === commentUserId || user._id === post.user._id;
    
    if (!canDelete) {
      toast.error('You can only delete your own comments');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await postService.deleteComment(post._id, commentId, user._id);
      
      // Emit to socket for real-time updates
      socketService.emitDeleteComment({
        postId: post._id,
        commentId,
        commentsCount: response.post.commentsCount
      });
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(response.post);
      }
      
      toast.success('Comment deleted!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTyping = (e) => {
    setNewComment(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketService.emitTyping({
        postId: post._id,
        user: user,
        isTyping: true
      });
    }
    
    // Clear typing indicator after 2 seconds of no typing
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socketService.emitTyping({
        postId: post._id,
        user: user,
        isTyping: false
      });
    }, 2000);
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
      }
    }
  };

  if (isOpenModel) return null; // Hide comments if modal is open

  return (
    <div className="comment-section">
      {/* Add comment form */}
      <form onSubmit={handleCommentSubmit} className="comment-form">
        <div className="comment-input-container">
          <div className="comment-avatar">
            {user.avatar ? (
              <img src={`http://localhost:5000${user.avatar}`} alt={user.name}  style={{maxWidth : 40, maxHeight : 40, borderRadius : "50%", objectFit : "cover"}}/>
            ) : (
              <div className="avatar-placeholder small">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="comment-input-wrapper">
            <input
              type="text"
              value={newComment}
              onChange={handleTyping}
              placeholder="Write a comment..."
              className="comment-input"
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              className="comment-submit-btn"
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="comments-list">
        {post.comments && post.comments.map((comment) => {
          // Check if current user can delete this comment
          const canDeleteComment = user._id === comment.user._id || user._id === post.user._id;
          
          return (
            <div key={comment._id} className="comment-item">
              <div className="comment-avatar">
                {comment.user.avatar ? (
                  <img src={`http://localhost:5000${comment.user.avatar}`} alt={comment.user.name} style={{maxWidth : 40, maxHeight : 40, borderRadius : "50%", objectFit : "cover"}}/>
                ) : (
                  <div className="avatar-placeholder small">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="comment-content">
                <div className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user.name}</span>
                    <span className="comment-time">{formatCommentDate(comment.createdAt)}</span>
                    {canDeleteComment && (
                      <button 
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(comment._id, comment.user._id)}
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSection;

