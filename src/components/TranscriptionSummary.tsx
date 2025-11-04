import React from "react";
import { ModelStatus, useSummarizer } from "../hooks/useSummarizer";

export interface TranscriptionSummaryProps {
  transcript: string;
}

export { ModelStatus } from "../hooks/useSummarizer";

export const TranscriptionSummary: React.FC<TranscriptionSummaryProps> = ({ transcript }) => {
  const { summary, isGeneratingSummary, modelStatus, generateSummary, clearSummary } =
    useSummarizer();

  const handleGenerateSummary = () => {
    generateSummary(transcript);
  };

  return (
    <div className="summary-section">
      <button
        onClick={handleGenerateSummary}
        disabled={isGeneratingSummary || !transcript.trim() || modelStatus !== ModelStatus.Ready}
        className="summary-button"
      >
        {modelStatus === ModelStatus.Loading
          ? "Loading Model..."
          : modelStatus === ModelStatus.Error
            ? "Model Failed to Load"
            : isGeneratingSummary
              ? "Generating..."
              : "Generate Transcription Report"}
      </button>

      {summary && (
        <div className="summary-container">
          <h3>Bug Report Summary</h3>
          <p>{summary}</p>
          <button onClick={clearSummary} className="clear-summary-button">
            Clear Summary
          </button>
        </div>
      )}
    </div>
  );
};
