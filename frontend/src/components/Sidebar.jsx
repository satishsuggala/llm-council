import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  credits,
  user,
  onLogout,
  isCollapsed,
  onToggle,
}) {
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="header-top">
          <button className="toggle-btn" onClick={onToggle} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          {!isCollapsed && <h1>LLM Council</h1>}
        </div>
        <button
          className="new-conversation-btn"
          onClick={onNewConversation}
          title="New Conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {!isCollapsed && <span>New Conversation</span>}
        </button>
      </div>

      {!isCollapsed && (
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''
                  }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="conversation-content">
                  <div className="conversation-title">
                    {conv.title || 'New Conversation'}
                  </div>
                  <div className="conversation-meta">
                    {conv.message_count} messages
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  title="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isCollapsed && <div className="collapsed-spacer"></div>}

      {credits && (
        <div className="credits-display" title={isCollapsed ? `$${(credits.total_credits - credits.total_usage).toFixed(2)} remaining` : undefined}>
          {!isCollapsed ? (
            <>
              <div className="credits-label">OpenRouter Credits</div>
              <div className="credits-value">
                ${(credits.total_credits - credits.total_usage).toFixed(2)} remaining
              </div>
              <div className="credits-total">
                of ${credits.total_credits} total
              </div>
            </>
          ) : (
            <div className="credits-icon" title={`$${(credits.total_credits - credits.total_usage).toFixed(2)} remaining`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="user-profile">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="user-avatar" title={isCollapsed ? user.name : undefined} />
          ) : (
            <div className="user-avatar-placeholder" title={isCollapsed ? user.name : undefined}>
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name" title={user.name}>{user.name}</div>
              <div className="user-email" title={user.email}>{user.email}</div>
            </div>
          )}
          <button className="logout-btn" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
