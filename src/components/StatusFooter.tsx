import React from 'react';

interface StatusFooterProps {
  isRecording: boolean;
  isGenerating: boolean;
}

const StatusFooter: React.FC<StatusFooterProps> = ({ isRecording, isGenerating }) => {
  return (
    <div className="status-footer">
      Status: {isRecording ? 'recording' : 'ready'} | isGenerating:{' '}
      {isGenerating ? 'true' : 'false'} | isRecording: {isRecording ? 'true' : 'false'}
    </div>
  );
};

export default StatusFooter;
