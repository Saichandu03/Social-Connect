import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileEditModal from './ProfileEditModal';
import './Profile.css';
import { MdEdit } from "react-icons/md";
import { ZapIcon } from 'lucide-react';


const ProfileSidebar = ({ isOpenModel, setIsOpenModel }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="profile-sidebar">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={`https://socialconnect-sn5j.onrender.com${user.avatar}`} alt={user.name}  style={{maxWidth : 100, maxHeight : 100, borderRadius : "50%"}} />
              ) : (
                <div className="avatar-placeholder large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button 
              className="edit-avatar-btn"
              onClick={() => { setIsOpenModel(true); }}
              title="Edit profile"
            >
              <MdEdit style={{fontSize : "1rem", color :"black"}}/>
            </button>
          </div>
          
          <div className="profile-info">
            <h3>{user.name}</h3>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-details">
          {user.bio && (
            <div className="profile-field">
              <label>Bio</label>
              <p>{user.bio}</p>
            </div>
          )}
          
          {user.position && (
            <div className="profile-field">
              <label>Position</label>
              <p>{user.position}</p>
            </div>
          )}
          
          {user.company && (
            <div className="profile-field">
              <label>Company</label>
              <p>{user.company}</p>
            </div>
          )}
          
          {user.location && (
            <div className="profile-field">
              <label>Location</label>
              <p>{user.location}</p>
            </div>
          )}
          
          {user.website && (
            <div className="profile-field">
              <label>Website</label>
              <a 
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-link"
              >
                {user.website}
              </a>
            </div>
          )}
        </div>

        {/* <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{user.posts?.length || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{user.followers?.length || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{user.following?.length || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div> */}

        <button 
          className="edit-profile-btn"
          onClick={() => { setIsOpenModel(true); }}
        >
          Edit Profile
        </button>
      </div>

      {isOpenModel && (
        <ProfileEditModal 
          onClose={() => { setIsOpenModel(false); }}
        />
      )}
    </div>
  );
};

export default ProfileSidebar;

