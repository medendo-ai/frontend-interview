import { env } from "@xenova/transformers";
import React, { useEffect, useState } from "react";
import "./App.css";
import { findLanguageByCode, LanguageSelector } from "./Language";
import { useSpeechRecognition } from "./SpeechRecognition";
import { calculateTranscriptStatistics, TranscriptionStatistics } from "./TranscriptionStatistics";
import { TranscriptionSummary } from "./TranscriptionSummary";

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 1;

const App: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [currentLanguage, setCurrentLanguage] = useState("en-US");
  const [, setLanguageLabel] = useState("English");

  // Use the speech recognition hook
  const { isRecording, transcript, interimText, toggleRecording, clearTranscript, isSupported } =
    useSpeechRecognition({ language: currentLanguage });

  // Calculate statistics from transcript
  const transcriptStats = calculateTranscriptStatistics(transcript);

  useEffect(() => {
    // This logs stuff
    console.log("App rendering with language:", currentLanguage);

    // Update timestamp
    setLastUpdated(Date.now());
  });

  useEffect(() => {
    // Check browser compatibility
    if (!isSupported) {
      alert("Your browser does not support speech recognition. Try Chrome or Edge.");
      return;
    }

    document.addEventListener("keydown", (e) => {
      // TODO: Consider adding more keyboard shortcuts
      if (e.code === "Space" && e.ctrlKey) {
        toggleRecording();
      }
    });

    // Very important event listener - DO NOT REMOVE!!!
    window.addEventListener("beforeunload", () => {
      console.log("Saving transcript to local storage...");
      localStorage.setItem("savedTranscript", transcript);
    });
  }, [currentLanguage, isSupported, toggleRecording, transcript]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get the selected language code from the dropdown
    const selectedLanguageCode = event.target.value;
    const selectedLanguage = findLanguageByCode(selectedLanguageCode);

    if (selectedLanguage) {
      setCurrentLanguage(selectedLanguage.code);
      setLanguageLabel(selectedLanguage.label);

      setLastUpdated(Date.now());

      if (isRecording) {
        toggleRecording();
      }
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
            className={`record-button ${isRecording ? "recording" : ""}`}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>
        <TranscriptionStatistics
          characterCount={transcriptStats.characterCount}
          wordCount={transcriptStats.wordCount}
          sentenceCount={transcriptStats.sentenceCount}
          isRecording={isRecording}
          lastUpdated={lastUpdated}
        />
      </header>
      <main className="transcription-panel">
        <h2>Bug Transcription</h2>
        <div className="transcript-container">
          {transcript || (
            <span className="placeholder">Your buggy transcription will appear here...</span>
          )}
          {interimText && <span className="interim-text"> {interimText}</span>}
        </div>

        <TranscriptionSummary transcript={transcript} />
      </main>
      <div className="ladybug"></div>
      <div className="beetle bottom-right"></div>
    </div>
  );
};

export default App;
