import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { socketService } from '../../services/socketService';
import toast from 'react-hot-toast';
import './Posts.css';

const CreatePost = ({ onPostCreated, isOpenModel, setIsOpenModel }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const { user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size should be less than 10MB');
        return;
      }
      
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please write something to share');
      return;
    }

    setIsLoading(true);

    const createPostPromise = postService.createPost(content.trim(), user._id, image);

    toast.promise(
      createPostPromise,
      {
        loading: 'Creating post...',
        success: <b>Post created successfully!</b>,
        error: (err) => <b>{err.message}</b>,
      }
    );

    try {
      const response = await createPostPromise;
      
      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Emit to socket for real-time updates
      socketService.emitNewPost(response.post);
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(response.post);
      }
    } catch (error) {
      // Error is already handled by toast.promise
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>Share your thoughts...</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        {!isOpenModel && (
          <div className="content-input" style={{zIndex:0}}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows="3"
              maxLength="2000"
            />
            <div className="character-count">
              {content.length}/2000
            </div>
          </div>
        )}

        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button 
              type="button" 
              className="remove-image"
              onClick={removeImage}
            >
              ×
            </button>
          </div>
        )}

        <div className="post-actions">
          <div className="action-buttons">
            <button 
            style={{border : "1px solid black", borderRadius : "5rem"}}
              type="button" 
              className="action-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            className="post-button"
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

