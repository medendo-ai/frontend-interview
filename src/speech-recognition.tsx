import { useEffect, useRef, useState } from "react";

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
  onerror: (event: ErrorEvent) => void;
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

interface UseSpeechRecognitionProps {
  language?: string;
}

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  transcript: string;
  interimText: string;
  toggleRecording: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = ({
  language = "en-US",
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check browser compatibility for the thing
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
      return;
    }

    // Magic happens here
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    // This makes it show words as they're spoken
    recognition.interimResults = true;
    recognition.lang = language;

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

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Clear timeout on cleanup
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    };
  }, [language]);

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

  const clearTranscript = () => {
    setTranscript("");
    setInterimText("");
  };

  return {
    isRecording,
    transcript,
    interimText,
    toggleRecording,
    clearTranscript,
    isSupported,
  };
};