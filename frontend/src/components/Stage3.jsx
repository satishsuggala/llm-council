import { useState, useRef, useEffect } from 'react';
import MarkdownTable from './MarkdownTable';
import CostDisplay from './CostDisplay';
import './Stage3.css';

export default function Stage3({ finalResponse, stage1Results, stage2Results }) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCostDetails, setShowCostDetails] = useState(false);
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

  // Calculate total costs
  const getCost = (item) => item?.usage?.cost || 0;

  const stage1Total = (stage1Results || []).reduce((sum, item) => sum + getCost(item), 0);
  const stage2Total = (stage2Results || []).reduce((sum, item) => sum + getCost(item), 0);
  const stage3Cost = getCost(finalResponse);
  const totalCost = stage1Total + stage2Total + stage3Cost;

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

          <div className="usage-stats" onClick={() => setShowCostDetails(!showCostDetails)} style={{ cursor: 'pointer' }}>
            <span className="usage-cost" title="Click for details">
              ${totalCost.toFixed(6)} {showCostDetails ? '▲' : '▼'}
            </span>
            {finalResponse.usage && (
              <span className="usage-tokens" title="Prompt / Completion / Total (Chairman only)">
                {finalResponse.usage.prompt_tokens} → {finalResponse.usage.completion_tokens}
              </span>
            )}
          </div>

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

        {showCostDetails && (
          <div className="cost-breakdown">
            <h4>Cost Breakdown</h4>
            <table className="cost-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Model</th>
                  <th className="text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {/* Stage 1 */}
                <tr className="stage-header"><td colSpan="3">Stage 1: Individual Responses</td></tr>
                {(stage1Results || []).map((res, i) => (
                  <tr key={`s1-${i}`}>
                    <td></td>
                    <td>{res.model.split('/')[1] || res.model}</td>
                    <td className="text-right"><CostDisplay cost={res.usage?.cost} /></td>
                  </tr>
                ))}

                {/* Stage 2 */}
                <tr className="stage-header"><td colSpan="3">Stage 2: Peer Rankings</td></tr>
                {(stage2Results || []).map((res, i) => (
                  <tr key={`s2-${i}`}>
                    <td></td>
                    <td>{res.model.split('/')[1] || res.model}</td>
                    <td className="text-right"><CostDisplay cost={res.usage?.cost} /></td>
                  </tr>
                ))}

                {/* Stage 3 */}
                <tr className="stage-header"><td colSpan="3">Stage 3: Synthesis</td></tr>
                <tr>
                  <td></td>
                  <td>{finalResponse.model.split('/')[1] || finalResponse.model} (Chairman)</td>
                  <td className="text-right"><CostDisplay cost={finalResponse.usage?.cost} /></td>
                </tr>

                {/* Total */}
                <tr className="total-row">
                  <td colSpan="2"><strong>Total Session Cost</strong></td>
                  <td className="text-right"><strong>${totalCost.toFixed(6)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="final-text markdown-content" ref={contentRef}>
          <MarkdownTable content={finalResponse.response} />
        </div>
      </div>
    </div>
  );
}
