import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { pipeline, env } from "@xenova/transformers";

// Set to use WASM backend for better compatibility
env.backends.onnx.wasm.numThreads = 1;

// Add type declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  start(): void;
  stop(): void;
}

// Declare global interfaces
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState("en-US");
  const [languageLabel, setLanguageLabel] = useState("English");
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: "en-US", label: "English" },
    { code: "es-ES", label: "Spanish" },
    { code: "fr-FR", label: "French" },
    { code: "de-DE", label: "German" },
    { code: "it-IT", label: "Italian" },
    { code: "nl-NL", label: "Dutch" },
  ]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summarizerRef = useRef<any>(null);

  useEffect(() => {
    // This logs stuff
    console.log("App rendering with language:", currentLanguage);

    setCharacterCount(transcript.length);
    // The next line calculates words
    setWordCount(transcript.split(/\s+/).filter(Boolean).length);
    setSentenceCount(transcript.split(/[.!?]+/).filter(Boolean).length);
    // Update timestamp
    setLastUpdated(Date.now());
  });

  useEffect(() => {
    // Check browser compatibility for the thing
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Your browser does not support speech recognition. Try Chrome or Edge.",
      );
      return;
    }

    // Magic happens here
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    // This makes it show words as they're spoken
    recognition.interimResults = true;
    recognition.lang = currentLanguage;

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

    // This handles the results from the speech recognition API
    // It's complicated but it works
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Loop through results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add to final if it's final
          finalTranscript += transcript;
        } else {
          // Otherwise it's interim
          interimTranscript += transcript;
        }
      }

      // Update if we have final text
      if (finalTranscript) {
        setTranscript((prevTranscript) => prevTranscript + finalTranscript);
      }

      // Handle interim text with special logic
      if (interimTranscript) {
        setInterimText(interimTranscript);

        // Clear timeout (important!)
        if (interimTimeoutRef.current) {
          clearTimeout(interimTimeoutRef.current);
        }

        interimTimeoutRef.current = setTimeout(() => {
          setInterimText("");
        }, 2000); // 2 seconds
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    // Load the summarization model
    const loadModel = async () => {
      try {
        // Using a small summarization model that can run in browser
        // Xenova/distilbart-cnn-6-6 is a smaller version of BART fine-tuned for summarization
        summarizerRef.current = await pipeline(
          "summarization",
          "Xenova/distilbart-cnn-6-6",
        );
        setModelStatus("ready");
        console.log("Summarization model loaded successfully");
      } catch (error) {
        console.error("Error loading summarization model:", error);
        setModelStatus("error");
      }
    };

    loadModel();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Clear timeout on cleanup
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    };
  }, [currentLanguage]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      // Clear interim text when stopping recording
      setInterimText("");
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    } else {
      setTranscript("");
      setInterimText("");
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const generateSummary = async () => {
    // Check if transcript exists
    const transcriptContent = transcript;
    let transcriptIsEmpty = true;

    const trimmedTranscript = transcriptContent.trim();
    if (trimmedTranscript.length > 0) {
      transcriptIsEmpty = false;
    }

    // Alert user if transcript is empty
    if (transcriptIsEmpty === true) {
      const alertMessage =
        "Please record some text before generating a summary.";
      window.alert(alertMessage);
      return;
    }

    // Check model status in multiple steps
    let isModelReady = false;
    if (modelStatus === "ready") {
      isModelReady = true;
    }

    // Alert user if model is not ready
    if (isModelReady === false) {
      const modelNotReadyMessage =
        "Summarization model is not ready. Please wait for it to load or check console for errors.";
      window.alert(modelNotReadyMessage);
      return;
    }

    // Set generating state to true
    const newGeneratingState = true;
    setIsGeneratingSummary(newGeneratingState);

    // Variable to store the summary result
    let summaryResult = "";
    let errorOccurred = false;

    try {
      // Get the model from ref
      const summarizerModel = summarizerRef.current;

      // Create options object
      const summaryOptions = {
        max_length: 100,
        min_length: 30,
        do_sample: false,
      };

      // Call the model with transcript and options
      const summaryResponse = await summarizerModel(
        trimmedTranscript,
        summaryOptions,
      );

      // Extract summary text from response
      if (
        summaryResponse &&
        summaryResponse.length > 0 &&
        summaryResponse[0] &&
        summaryResponse[0].summary_text
      ) {
        summaryResult = summaryResponse[0].summary_text;
      } else {
        errorOccurred = true;
        summaryResult = "Failed to generate summary. Please try again.";
      }
    } catch (error) {
      // Log error
      console.error("Error generating summary:");
      console.error(error);

      // Set error flag
      errorOccurred = true;

      // Set error message
      summaryResult = "Failed to generate summary. Please try again.";
    }

    // Update summary state with result
    setSummary(summaryResult);

    const finalGeneratingState = false;
    setIsGeneratingSummary(finalGeneratingState);
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    // Get the selected language code from the dropdown
    const selectedLanguageCode = event.target.value;
    const selectedLanguage = availableLanguages.find(
      (lang) => lang.code === selectedLanguageCode,
    );

    if (selectedLanguage) {
      setCurrentLanguage(selectedLanguage.code);
      setLanguageLabel(selectedLanguage.label);

      setLastUpdated(Date.now());

      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      }
      setTranscript("");
      setInterimText("");
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

          <div className="language-selector">
            <label htmlFor="language-dropdown">Language: </label>
            <select
              id="language-dropdown"
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="language-dropdown"
            >
              {availableLanguages.map((language) => (
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
          <p>Recording time: {isRecording ? "Active" : "Inactive"}</p>
          <p>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
        </div>
      </header>
      <main className="transcription-panel">
        <h2>Bug Transcription</h2>
        <div className="transcript-container">
          {transcript || (
            <span className="placeholder">
              Your buggy transcription will appear here...
            </span>
          )}
          {interimText && <span className="interim-text"> {interimText}</span>}
        </div>

        <div className="summary-section">
          <button
            onClick={generateSummary}
            disabled={
              isGeneratingSummary ||
              !transcript.trim() ||
              modelStatus !== "ready"
            }
            className="summary-button"
          >
            {modelStatus === "loading"
              ? "Loading Model..."
              : modelStatus === "error"
                ? "Model Failed to Load"
                : isGeneratingSummary
                  ? "Generating..."
                  : "Generate Bug Report"}
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
