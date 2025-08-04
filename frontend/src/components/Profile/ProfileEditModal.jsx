import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';
import toast from 'react-hot-toast';
import './Profile.css';

const ProfileEditModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    position: user.position || '',
    company: user.company || '',
    location: user.location || '',
    website: user.website || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profile data
      const updatePromise = authService.updateProfile(user._id, formData);
      
      toast.promise(
        updatePromise,
        {
          loading: 'Updating profile...',
          success: <b>Profile updated successfully!</b>,
          error: (err) => <b>{err.message}</b>,
        }
      );

      const updatedUser = await updatePromise;

      // Upload avatar if selected
      if (avatarFile) {
        const avatarPromise = authService.uploadAvatar(user._id, avatarFile);
        
        toast.promise(
          avatarPromise,
          {
            loading: 'Uploading avatar...',
            success: <b>Avatar updated!</b>,
            error: (err) => <b>{err.message}</b>,
          }
        );

        const avatarResponse = await avatarPromise;
        updatedUser.avatar = avatarResponse.avatar;
      }

      // Update user context
      updateUser(updatedUser);

      // Emit profile update to socket
      socketService.broadcastProfileUpdate(updatedUser);

      onClose();
    } catch (error) {
      // Errors are already handled by toast.promise
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{marginTop: "60px"}}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="avatar-section">
            <div className="current-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" />
              ) : user.avatar ? (
                <img src={`https://socialconnect-sn5j.onrender.com${user.avatar}`} alt={user.name}  style={{maxWidth : 100, maxHeight : 100}}/>
              ) : (
                <div className="avatar-placeholder large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button 
              type="button"
              className="change-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g. Tech Corp"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. New York, NY"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                maxLength="500"
                placeholder="Tell us about yourself..."
              />
              <div className="character-count">
                {formData.bio.length}/500
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;

