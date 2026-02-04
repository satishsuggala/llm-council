import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
  availableModels = [],
  modelsError = null,
}) {
  const [input, setInput] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const initializedConversationId = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (!conversation?.id || availableModels.length === 0) {
      return;
    }

    if (conversation.messages?.length !== 0) {
      return;
    }

    if (initializedConversationId.current !== conversation.id) {
      setSelectedModels(availableModels);
      initializedConversationId.current = conversation.id;
    }
  }, [conversation?.id, availableModels]);

  const toggleModel = (model) => {
    setSelectedModels((prev) => (
      prev.includes(model)
        ? prev.filter((item) => item !== model)
        : [...prev, model]
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasModelSelection = availableModels.length === 0 || selectedModels.length > 0;
    if (input.trim() && !isLoading && hasModelSelection) {
      const modelsPayload = availableModels.length > 0 ? selectedModels : undefined;
      onSendMessage(input, modelsPayload);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">LLM Council</div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {conversation.messages.length === 0 && (
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="model-selector">
            <div className="model-selector-header">
              <div className="model-selector-title">Council members</div>
              <div className="model-selector-help">
                Choose which models to consult for this question.
              </div>
            </div>

            {availableModels.length === 0 && !modelsError && (
              <div className="model-selector-note">Loading available models...</div>
            )}

            {modelsError && (
              <div className="model-selector-warning">
                {modelsError} Sending will use the default council.
              </div>
            )}

            {availableModels.length > 0 && (
              <div className="model-selector-grid">
                {availableModels.map((model) => {
                  const shortName = model.split('/')[1] || model;
                  const isSelected = selectedModels.includes(model);
                  return (
                    <label
                      key={model}
                      className={`model-option ${isSelected ? 'is-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleModel(model)}
                        disabled={isLoading}
                      />
                      <span className="model-option-text">
                        <span className="model-option-name">{shortName}</span>
                        <span className="model-option-id">{model}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {availableModels.length > 0 && selectedModels.length === 0 && (
              <div className="model-selector-warning">
                Select at least one model to continue.
              </div>
            )}
          </div>

          <div className="input-row">
            <textarea
              className="message-input"
              placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
            />
            <button
              type="submit"
              className="send-button"
              disabled={
                !input.trim()
                || isLoading
                || (availableModels.length > 0 && selectedModels.length === 0)
              }
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
