import { useState, useRef, useEffect } from 'react';
import MarkdownTable from './MarkdownTable';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!finalResponse) {
    return null;
  }

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(finalResponse.response);
      showFeedback();
      setShowDropdown(false);
    } catch (err) {
      console.error('Failed to copy markdown: ', err);
    }
  };

  const handleCopyRichText = async () => {
    try {
      if (!contentRef.current) return;

      const html = contentRef.current.innerHTML;
      const text = contentRef.current.innerText;

      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      });

      await navigator.clipboard.write([clipboardItem]);
      showFeedback();
      setShowDropdown(false);
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
    }
  };

  const showFeedback = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Stage 3: Final Council Answer</h3>
      <div className="final-response">
        <div className="response-header">
          <div className="chairman-label">
            Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
          </div>

          {finalResponse.usage && (
            <div className="usage-stats">
              <span className="usage-cost" title="Total Cost">
                ${(finalResponse.usage.cost || 0).toFixed(6)}
              </span>
              <span className="usage-tokens" title="Prompt / Completion / Total">
                {finalResponse.usage.prompt_tokens} → {finalResponse.usage.completion_tokens} (Σ {finalResponse.usage.total_tokens})
              </span>
            </div>
          )}

          <div className="copy-dropdown-container" ref={dropdownRef}>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Copy options"
            >
              {copied ? 'Copied!' : 'Copy ▼'}
            </button>

            {showDropdown && (
              <div className="copy-dropdown-menu">
                <button onClick={handleCopyMarkdown}>Copy Markdown</button>
                <button onClick={handleCopyRichText}>Copy Rich Text</button>
              </div>
            )}
          </div>
        </div>
        <div className="final-text markdown-content" ref={contentRef}>
          <MarkdownTable content={finalResponse.response} />
        </div>
      </div>
    </div>
  );
}
