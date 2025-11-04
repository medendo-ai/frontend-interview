import { env } from "@xenova/transformers";
import React, { useEffect, useState } from "react";
import "./App.css";
import { findLanguageByCode, LanguageSelector } from "./components/Language";
import {
  calculateTranscriptStatistics,
  TranscriptionStatistics,
} from "./components/TranscriptionStatistics";
import { TranscriptionSummary } from "./components/TranscriptionSummary";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 1;

const App: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [currentLanguage, setCurrentLanguage] = useState("en-US");

  // Use the speech recognition hook
  const { isRecording, transcript, interimText, toggleRecording, clearTranscript } =
    useSpeechRecognition({ language: currentLanguage });

  // Calculate statistics from transcript
  const transcriptStats = calculateTranscriptStatistics(transcript);

  useEffect(() => {
    setLastUpdated(Date.now());
  }, [transcript]);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      // TODO: Consider adding more keyboard shortcuts
      if (e.code === "Space" && e.ctrlKey) {
        toggleRecording();
      }
    });

    window.addEventListener("beforeunload", () => {
      console.log("Saving transcript to local storage...");
      localStorage.setItem("savedTranscript", transcript);
    });
  }, [currentLanguage, toggleRecording, transcript]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get the selected language code from the dropdown
    const selectedLanguageCode = event.target.value;
    const selectedLanguage = findLanguageByCode(selectedLanguageCode);

    if (!selectedLanguage) {
      console.error("Selected language not found:", selectedLanguageCode);
      return;
    }

    setCurrentLanguage(selectedLanguage.code);
    setLastUpdated(Date.now());
    clearTranscript();
    if (isRecording) {
      toggleRecording();
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
