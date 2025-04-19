import React, { useState, useEffect } from 'react';
import './App.css';
import { env } from '@xenova/transformers';
import { LANGUAGES } from './constants/languages';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSummarizer } from './hooks/useSummarizer';

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 1;

const App: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [languageLabel, setLanguageLabel] = useState('English');

  // Use the speech recognition hook
  const { isRecording, transcript, interimText, toggleRecording, clearTranscript } = useSpeechRecognition(currentLanguage);

  // Use the summarizer hook
  const { status: modelStatus, isGenerating, summarize } = useSummarizer();

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

  const generateSummary = async () => {
    try {
      // Check if transcript exists
      if (!transcript.trim()) {
        window.alert('Please record some text before generating a summary.');
        return;
      }

      // Generate summary using the hook
      const result = await summarize(transcript);
      setSummary(result);

    } catch (error) {
      console.error('Error in generateSummary:', error);
      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert('Failed to generate summary. Please try again.');
      }
    }
  };

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
          <button
            onClick={generateSummary}
            disabled={isGenerating || !transcript.trim() || modelStatus !== 'ready'}
            className="summary-button"
          >
            {modelStatus === 'loading'
              ? 'Loading Model...'
              : modelStatus === 'error'
                ? 'Model Failed to Load'
                : isGenerating
                  ? 'Generating...'
                  : 'Generate Bug Report'}
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
