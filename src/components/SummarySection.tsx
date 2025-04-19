import React, { RefObject } from 'react';

interface SummarySectionProps {
  summary: string;
  isGenerating: boolean;
  buttonText: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onGenerateSummary: () => void;
  isButtonDisabled: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  summary,
  isGenerating,
  buttonText,
  buttonRef,
  onGenerateSummary,
  isButtonDisabled,
}) => {
  return (
    <div className="summary-section">
      {/* Visual indicator for generating state */}
      {isGenerating && <div className="generating-indicator">Generating summary...</div>}

      <button
        ref={buttonRef}
        onClick={onGenerateSummary}
        disabled={isButtonDisabled}
        className={`summary-button ${isGenerating ? 'processing' : ''}`}
        aria-label="Generate Bug Report Summary"
      >
        {buttonText}
      </button>

      {summary && (
        <div className="summary-container">
          <h3>Bug Report Summary</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default SummarySection;
