import React from 'react';

interface TranscriptPanelProps {
  transcript: string;
  interimText: string;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcript, interimText }) => {
  return (
    <div className="transcript-container">
      {transcript || (
        <span className="placeholder">Your buggy transcription will appear here...</span>
      )}
      {interimText && <span className="interim-text"> {interimText}</span>}
    </div>
  );
};

export default TranscriptPanel;
