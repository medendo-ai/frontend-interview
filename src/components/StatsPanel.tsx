import React from 'react';

interface StatsPanelProps {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  isRecording: boolean;
  lastUpdated: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  characterCount,
  wordCount,
  sentenceCount,
  isRecording,
  lastUpdated,
}) => {
  return (
    <div className="stats-panel">
      <p>Characters: {characterCount}</p>
      <p>Words: {wordCount}</p>
      <p>Sentences: {sentenceCount}</p>
      <p>Recording time: {isRecording ? 'Active' : 'Inactive'}</p>
      <p>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
    </div>
  );
};

export default StatsPanel;
