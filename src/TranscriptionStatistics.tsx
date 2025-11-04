import React from "react";

export interface TranscriptStatistics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
}

export interface TranscriptionStatisticsProps {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  isRecording: boolean;
  lastUpdated: number;
}

export const TranscriptionStatistics: React.FC<TranscriptionStatisticsProps> = ({
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
      <p>Recording time: {isRecording ? "Active" : "Inactive"}</p>
      <p>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
    </div>
  );
};

// Helper function to calculate statistics from transcript
export const calculateTranscriptStatistics = (transcript: string): TranscriptStatistics => {
  const characterCount = transcript.length;
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const sentenceCount = transcript.split(/[.!?]+/).filter(Boolean).length;

  return {
    characterCount,
    wordCount,
    sentenceCount,
  };
};
