import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import MemoryModal from './components/MemoryModal';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsError, setModelsError] = useState(null);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // Load conversations and credits
  useEffect(() => {
    const loadData = async () => {
      try {
        const convs = await api.listConversations();
        setConversations(convs);

        if (convs.length > 0 && !currentConversationId) {
          // Select the first conversation if none selected
          // But actually we might want to start with a new conversation or select the most recent
          // Let's just load the most recent one if available
          handleSelectConversation(convs[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }

      try {
        const creds = await api.getCredits();
        setCredits(creds);
      } catch (err) {
        console.error('Failed to load credits:', err);
      }

      await loadModels();
    };

    loadData();
  }, []);

  const loadModels = async () => {
    try {
      const models = await api.listModels();
      setAvailableModels(models);
      setModelsError(null);
    } catch (err) {
      console.error('Failed to load models:', err);
      setModelsError('Unable to load council models.');
      setAvailableModels([]);
    }
  };

  const handleSelectConversation = async (id) => {
    setCurrentConversationId(id);
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setCurrentConversation(newConv);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setCurrentConversation(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (content, models) => {
    if (!currentConversationId) return;

    setIsLoading(true);

    // Create a temporary message for optimistic UI
    const tempUserMsg = { role: 'user', content };
    const tempAssistantMsg = {
      role: 'assistant',
      content: '',
      loading: { stage1: true, stage2: false, stage3: false } // Initial state
    };

    setCurrentConversation(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMsg, tempAssistantMsg]
    }));

    try {
      await api.sendMessageStream(currentConversationId, content, (type, event) => {
        setCurrentConversation(prev => {
          const messages = [...(prev?.messages || [])];
          const lastMsgIndex = messages.length - 1;
          const lastMsg = { ...messages[lastMsgIndex] };

          // Ensure we are modifying the assistant message
          if (lastMsg.role !== 'assistant') return prev;

          if (type === 'stage1_start') {
            lastMsg.loading = { stage1: true, stage2: false, stage3: false };
          } else if (type === 'stage1_complete') {
            lastMsg.loading = { stage1: false, stage2: true, stage3: false };
            lastMsg.stage1 = event.data;
          } else if (type === 'stage2_start') {
            lastMsg.loading = { stage1: false, stage2: true, stage3: false };
          } else if (type === 'stage2_complete') {
            lastMsg.loading = { stage1: false, stage2: false, stage3: true };
            lastMsg.stage2 = event.data;
            lastMsg.metadata = { ...lastMsg.metadata, ...event.metadata };
          } else if (type === 'stage3_start') {
            lastMsg.loading = { stage1: false, stage2: false, stage3: true };
          } else if (type === 'stage3_complete') {
            lastMsg.loading = { stage1: false, stage2: false, stage3: false };
            lastMsg.stage3 = event.data;
          } else if (type === 'title_complete') {
            // Update conversation title in list
            setConversations(convs => convs.map(c =>
              c.id === currentConversationId ? { ...c, title: event.data.title } : c
            ));
            return { ...prev, title: event.data.title, messages: messages }; // Also update current conv title
          } else if (type === 'complete') {
            lastMsg.loading = null;
          } else if (type === 'error') {
            console.error("Stream error:", event.message);
            lastMsg.error = event.message;
            lastMsg.loading = null;
          }

          messages[lastMsgIndex] = lastMsg;
          return { ...prev, messages };
        });

        // Refresh credits on completion
        if (type === 'complete') {
          api.getCredits().then(setCredits);
        }
      }, models);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove the temporary assistant message or show error
    } finally {
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
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        availableModels={availableModels}
        modelsError={modelsError}
      />
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
}

export default App;
