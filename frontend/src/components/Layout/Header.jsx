import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';
import { LuLogOut } from "react-icons/lu";
import { FaSearch } from "react-icons/fa";



const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <h1>SocialConnect</h1>
          </div>
        </div>

        <div className="header-center">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people, posts..."
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <FaSearch />
              </button>
            </div>
          </form>
        </div>

        <div className="header-right">
          <div className="user-menu">
            <div className="user-info">
              <div className="user-avatar small">
                {user.avatar ? (
                  <img src={`http://localhost:5000${user.avatar}`} alt={user.name} crossOrigin="anonymous"
/>
                ) : (
                  <div className="avatar-placeholder small">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
            
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LuLogOut style={{fontSize : "1.5rem"}}/>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

