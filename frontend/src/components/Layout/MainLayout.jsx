import React from 'react';
import Header from './Header';
import ProfileSidebar from '../Profile/ProfileSidebar';
import Feed from '../Posts/Feed';
import './Layout.css';

const MainLayout = () => {
  const [isOpenModel, setIsOpenModel] = React.useState(false);
  return (
    <div className="main-layout">
      <Header />
      
      <div className="layout-content">
        <aside className="sidebar-left">
          <ProfileSidebar 
            isOpenModel={isOpenModel} 
            setIsOpenModel={setIsOpenModel}
          />
        </aside>
        
        <main className="main-content">
          <Feed 
            isOpenModel={isOpenModel} 
            setIsOpenModel={setIsOpenModel}
          />
        </main>
        
        {/* <aside className="sidebar-right">
          <div className="suggestions-card">
            <h3>Suggestions</h3>
            <p>Connect with more people to see their posts here!</p>
          </div>
          
          <div className="trending-card">
            <h3>Trending</h3>
            <div className="trending-item">
              <span className="trending-tag">#Technology</span>
              <span className="trending-count">1.2k posts</span>
            </div>
            <div className="trending-item">
              <span className="trending-tag">#Career</span>
              <span className="trending-count">856 posts</span>
            </div>
            <div className="trending-item">
              <span className="trending-tag">#Innovation</span>
              <span className="trending-count">642 posts</span>
            </div>
          </div>
        </aside> */}
      </div>
    </div>
  );
};

export default MainLayout;

