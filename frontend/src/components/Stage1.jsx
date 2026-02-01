import { useState } from 'react';
import MarkdownTable from './MarkdownTable';
import CostDisplay from './CostDisplay';
import './Stage1.css';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  const currentResponse = responses[activeTab];

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Individual Responses</h3>

      <div className="tabs">
        {responses.map((resp, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            <span>{resp.model.split('/')[1] || resp.model}</span>
            {resp.usage?.cost !== undefined && (
              <span className="tab-cost-badge">
                ${Number(resp.usage.cost).toFixed(5)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="model-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div className="model-name">{currentResponse.model}</div>
          <CostDisplay cost={currentResponse.usage?.cost} />
        </div>
        <div className="response-text markdown-content">
          <MarkdownTable content={responses[activeTab].response} />
        </div>
      </div>
    </div>
  );
}
