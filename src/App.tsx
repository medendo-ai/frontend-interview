import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { env } from '@xenova/transformers';
import { LANGUAGES } from './constants/languages';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSummarizer } from './hooks/useSummarizer';

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 4;

const App: React.FC = () => {
  // State management
  const [summary, setSummary] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [languageLabel, setLanguageLabel] = useState('English');

  // Refs for DOM elements
  const summaryButtonRef = useRef<HTMLButtonElement>(null);

  // Use the speech recognition hook
  const { isRecording, transcript, interimText, toggleRecording, clearTranscript } =
    useSpeechRecognition(currentLanguage);

  // Use the summarizer hook
  const { status: modelStatus, isGenerating, error: summarizerError, summarize } = useSummarizer();

  // Update statistics whenever transcript changes
  useEffect(() => {
    // Calculate statistics at once to avoid redundant re-renders
    setCharacterCount(transcript.length);
    setWordCount(transcript.split(/\s+/).filter(Boolean).length);
    setSentenceCount(transcript.split(/[.!?]+/).filter(Boolean).length);
    setLastUpdated(Date.now());
  }, [transcript, currentLanguage]);

  // Add keyboard shortcut for toggle recording (Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.ctrlKey) {
        toggleRecording();
        e.preventDefault(); // Prevent scrolling
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleRecording]);

  // Update button class when generating state changes
  useEffect(() => {
    if (!summaryButtonRef.current) return;

    // Toggle the processing class based on isGenerating state
    if (isGenerating) {
      summaryButtonRef.current.classList.add('processing');
    } else {
      summaryButtonRef.current.classList.remove('processing');
    }
  }, [isGenerating]);

  // Generate a summary from the transcript
  const handleGenerateSummary = useCallback(async () => {
    try {
      // Validate input
      if (!transcript.trim()) {
        window.alert('Please record some text before generating a summary.');
        return;
      }

      // Generate summary using the hook
      const result = await summarize(transcript);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);

      // Better error reporting
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate summary. Please try again.';

      window.alert(errorMessage);
    }
  }, [transcript, summarize]);

  // Handle language change
  const handleLanguageChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedLanguageCode = event.target.value;
      const selectedLanguage = LANGUAGES.find((lang) => lang.code === selectedLanguageCode);

      if (!selectedLanguage) return;

      // Update language state
      setCurrentLanguage(selectedLanguage.code);
      setLanguageLabel(selectedLanguage.label);
      setLastUpdated(Date.now());

      // Stop recording if active when changing language
      if (isRecording) {
        toggleRecording();
      }

      // Clear the transcript when changing language
      clearTranscript();
    },
    [isRecording, toggleRecording, clearTranscript],
  );

  // Determine button text based on current state
  const buttonText =
    modelStatus === 'loading'
      ? 'Loading Model...'
      : modelStatus === 'error'
        ? 'Model Failed to Load'
        : isGenerating
          ? 'Generating...'
          : 'Generate Bug Report';

  return (
    <div className="App bug-theme">
      <div className="spider top-left"></div>
      <div className="spider top-right"></div>
      <div className="caterpillar"></div>

      <header className="App-header">
        <h1>Buggy Speech-to-Text</h1>

        <div className="control-panel">
          <button
            onClick={toggleRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <div className="language-selector">
            <label htmlFor="language-dropdown">Language: </label>
            <select
              id="language-dropdown"
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="language-dropdown"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="stats-panel">
          <p>Characters: {characterCount}</p>
          <p>Words: {wordCount}</p>
          <p>Sentences: {sentenceCount}</p>
          <p>Recording time: {isRecording ? 'Active' : 'Inactive'}</p>
          <p>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
        </div>
      </header>

      <main className="transcription-panel">
        <h2>Bug Transcription</h2>
        <div className="transcript-container">
          {transcript || (
            <span className="placeholder">Your buggy transcription will appear here...</span>
          )}
          {interimText && <span className="interim-text"> {interimText}</span>}
        </div>

        <div className="summary-section">
          {/* Visual indicator for generating state */}
          {isGenerating && <div className="generating-indicator">Generating summary...</div>}

          <button
            ref={summaryButtonRef}
            onClick={handleGenerateSummary}
            disabled={isGenerating || !transcript.trim() || modelStatus !== 'ready'}
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
      </main>

      <div className="ladybug"></div>
      <div className="beetle bottom-right"></div>

      <div className="status-footer">
        Status: {isRecording ? 'recording' : 'ready'} | isGenerating:{' '}
        {isGenerating ? 'true' : 'false'} | isRecording: {isRecording ? 'true' : 'false'}
      </div>
    </div>
  );
};

export default App;
