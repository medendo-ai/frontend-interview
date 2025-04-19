import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { env } from '@xenova/transformers';
import { LANGUAGES } from './constants/languages';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSummarizer } from './hooks/useSummarizer';

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 4;

const App: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [languageLabel, setLanguageLabel] = useState('English');

  // Use the speech recognition hook
  const { isRecording, transcript, interimText, toggleRecording, clearTranscript } =
    useSpeechRecognition(currentLanguage);

  // Use the summarizer hook
  const { status: modelStatus, isGenerating, error: summarizerError, summarize } = useSummarizer();

  // Monitor generating state changes
  useEffect(() => {
    console.log('[App] isGenerating state changed to:', isGenerating);

    // Additional UI updates on state change
    const button = document.getElementById('summary-button');
    if (button) {
      if (isGenerating) {
        button.classList.add('processing');
        button.setAttribute('data-state', 'generating');
      } else {
        button.classList.remove('processing');
        button.setAttribute('data-state', 'ready');
      }
    }
  }, [isGenerating]);

  useEffect(() => {
    // This logs stuff
    console.log('App rendering with language:', currentLanguage);

    setCharacterCount(transcript.length);
    // The next line calculates words
    setWordCount(transcript.split(/\s+/).filter(Boolean).length);
    setSentenceCount(transcript.split(/[.!?]+/).filter(Boolean).length);
    // Update timestamp
    setLastUpdated(Date.now());
  }, [transcript, currentLanguage]);

  useEffect(() => {
    // Add keyboard shortcut for toggle recording
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.ctrlKey) {
        toggleRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleRecording]);

  // Memoize the generateSummary function
  const generateSummary = useCallback(async () => {
    try {
      // Check if transcript exists
      if (!transcript.trim()) {
        window.alert('Please record some text before generating a summary.');
        return;
      }

      console.log('[App] Starting summary generation, current isGenerating:', isGenerating);

      // Visual indicator for UI to show processing has started
      document.getElementById('summary-button')?.classList.add('processing');
      document.getElementById('summary-button')?.setAttribute('data-state', 'generating');

      // Generate summary using the hook
      const result = await summarize(transcript);
      console.log('[App] Summary generation complete, isGenerating should be false now');

      // Ensure UI element shows processing is complete
      setTimeout(() => {
        document.getElementById('summary-button')?.classList.remove('processing');
        document.getElementById('summary-button')?.setAttribute('data-state', 'ready');
      }, 10);

      setSummary(result);
    } catch (error) {
      console.error('Error in generateSummary:', error);
      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert('Failed to generate summary. Please try again.');
      }

      // Make sure processing state is cleared even on error
      document.getElementById('summary-button')?.classList.remove('processing');
      document.getElementById('summary-button')?.setAttribute('data-state', 'ready');
    }
  }, [transcript, summarize, isGenerating]);

  // Direct DOM approach for button text to ensure it's always in sync
  useEffect(() => {
    const updateButtonText = () => {
      const button = document.getElementById('summary-button');
      if (!button) return;

      if (modelStatus === 'loading') {
        button.textContent = 'Loading Model...';
      } else if (modelStatus === 'error') {
        button.textContent = 'Model Failed to Load';
      } else if (button.getAttribute('data-state') === 'generating' || isGenerating) {
        button.textContent = 'Generating...';
      } else {
        button.textContent = 'Generate Bug Report';
      }
    };

    updateButtonText();

    // Run this function periodically to ensure the button text is always correct
    const intervalId = setInterval(updateButtonText, 100);
    return () => clearInterval(intervalId);
  }, [modelStatus, isGenerating]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get the selected language code from the dropdown
    const selectedLanguageCode = event.target.value;
    const selectedLanguage = LANGUAGES.find((lang) => lang.code === selectedLanguageCode);

    if (selectedLanguage) {
      setCurrentLanguage(selectedLanguage.code);
      setLanguageLabel(selectedLanguage.label);

      setLastUpdated(Date.now());

      // Stop recording if active when changing language
      if (isRecording) {
        toggleRecording();
      }

      // Clear the transcript when changing language
      clearTranscript();
    }
  };

  // Determine button text outside of JSX
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
      {/* Debug status (only visible during development) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            background: 'rgba(0,0,0,0.8)',
            color: 'lime',
            padding: '5px',
            fontSize: '12px',
            zIndex: 9999,
          }}
        >
          Status: {modelStatus} | isGenerating: {isGenerating ? 'true' : 'false'} | isRecording:{' '}
          {isRecording ? 'true' : 'false'}
        </div>
      )}

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
          {isGenerating && (
            <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
              Generating Summary...
            </div>
          )}

          <button
            id="summary-button"
            onClick={generateSummary}
            disabled={isGenerating || !transcript.trim() || modelStatus !== 'ready'}
            className={`summary-button ${isGenerating ? 'processing' : ''}`}
            data-state={isGenerating ? 'generating' : 'ready'}
            aria-label="Generate Bug Report Summary"
          >
            {/* Button text will be directly manipulated by DOM for reliability */}
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
    </div>
  );
};

export default App;
