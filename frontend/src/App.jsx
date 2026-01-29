import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { api } from './api';
import './App.css';

function App() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(null);

  // Load conversations and credits on mount or when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadCredits();
      // Always start with a new conversation UI
      startNewConversation();
    }
  }, [isAuthenticated]);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId && currentConversationId !== 'virtual_new' && isAuthenticated) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId, isAuthenticated]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadCredits = async () => {
    try {
      const data = await api.getCredits();
      setCredits(data);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId('virtual_new');
    setCurrentConversation({
      id: 'virtual_new',
      title: 'New Conversation',
      messages: [],
      created_at: new Date().toISOString()
    });
  };

  const handleNewConversation = () => {
    startNewConversation();
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await api.deleteConversation(id);

      // Update list
      const updatedConversations = conversations.filter(c => c.id !== id);
      setConversations(updatedConversations);

      // If deleted conversation was selected, reset to new
      if (currentConversationId === id) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSendMessage = async (content) => {
    setIsLoading(true);
    let activeConversationId = currentConversationId;

    try {
      // If virtual, create real conversation first
      if (activeConversationId === 'virtual_new') {
        const newConv = await api.createConversation();
        activeConversationId = newConv.id;

        // Update state to real conversation
        setCurrentConversationId(activeConversationId);
        setConversations(prev => [
          { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
          ...prev,
        ]);

        // We'll update currentConversation with messages below
      }

      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };

      // Update current conversation with user message
      // Note: activeConversationId might have just changed from virtual to real
      setCurrentConversation((prev) => ({
        ...prev,
        id: activeConversationId,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      await api.sendMessageStream(activeConversationId, content, (eventType, event) => {
        switch (eventType) {
          case 'stage1_start':
            setCurrentConversation((prev) => {
              // Ensure we are updating the correct conversation context
              if (!prev || prev.id !== activeConversationId && prev.id !== 'virtual_new') return prev;

              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage1 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage1 = event.data;
              lastMsg.loading.stage1 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage2_start':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage2 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage2 = event.data;
              lastMsg.metadata = event.metadata;
              lastMsg.loading.stage2 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage3_start':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage3 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage3 = event.data;
              lastMsg.loading.stage3 = false;
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            // Reload conversations to get updated title
            loadConversations();
            break;

          case 'complete':
            // Stream complete, reload conversations list and credits
            loadConversations();
            loadCredits();
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setIsLoading(false);
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2), // Remove user and assistant placeholder
      }));
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        credits={credits}
        user={user}
        onLogout={logout}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
