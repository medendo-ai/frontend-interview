import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { pipeline, env } from '@xenova/transformers';

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
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summarizerRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prevTranscript => prevTranscript + finalTranscript);
      }
      
      if (interimTranscript) {
        setInterimText(interimTranscript);
        
        // Clear any existing timeout
        if (interimTimeoutRef.current) {
          clearTimeout(interimTimeoutRef.current);
        }
        
        // Set a new timeout to clear the interim text after 2 seconds
        interimTimeoutRef.current = setTimeout(() => {
          setInterimText('');
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    // Load the summarization model
    const loadModel = async () => {
      try {
        // Using a small summarization model that can run in browser
        // Xenova/distilbart-cnn-6-6 is a smaller version of BART fine-tuned for summarization
        summarizerRef.current = await pipeline(
          'summarization',
          'Xenova/distilbart-cnn-6-6'
        );
        setModelStatus('ready');
        console.log('Summarization model loaded successfully');
      } catch (error) {
        console.error('Error loading summarization model:', error);
        setModelStatus('error');
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
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      // Clear interim text when stopping recording
      setInterimText('');
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    } else {
      setTranscript('');
      setInterimText('');
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      alert('Please record some text before generating a summary.');
      return;
    }

    if (modelStatus !== 'ready') {
      alert('Summarization model is not ready. Please wait for it to load or check console for errors.');
      return;
    }

    setIsGeneratingSummary(true);
    
    try {
      // Use the loaded model to generate a summary
      const result = await summarizerRef.current(transcript, {
        max_length: 100,
        min_length: 30,
        do_sample: false
      });
      
      setSummary(result[0].summary_text);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="App bug-theme">
      <div className="spider top-left"></div>
      <div className="spider top-right"></div>
      <div className="caterpillar"></div>
      <header className="App-header">
        <h1>Buggy Speech-to-Text</h1>
        <button 
          onClick={toggleRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </header>
      <main className="transcription-panel">
        <h2>Bug Transcription</h2>
        <div className="transcript-container">
          {transcript || <span className="placeholder">Your buggy transcription will appear here...</span>}
          {interimText && <span className="interim-text"> {interimText}</span>}
        </div>
        
        <div className="summary-section">
          <button 
            onClick={generateSummary} 
            disabled={isGeneratingSummary || !transcript.trim() || modelStatus !== 'ready'}
            className="summary-button"
          >
            {modelStatus === 'loading' ? 'Loading Model...' : 
              modelStatus === 'error' ? 'Model Failed to Load' :
              isGeneratingSummary ? 'Generating...' : 'Generate Bug Report'}
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