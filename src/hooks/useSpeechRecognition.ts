import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for speech recognition functionality
 * @param language - The language code to use for speech recognition
 * @returns Object containing transcript, interim text, recording state, and functions to control recording
 */
export const useSpeechRecognition = (language: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');

  // Refs to store the speech recognition instance and the timeout for interim text
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition with the specified language
  useEffect(() => {
    // Check browser compatibility
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Your browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition =
      ((window as any).SpeechRecognition as typeof window.SpeechRecognition) ||
      ((window as any).webkitSpeechRecognition as typeof window.webkitSpeechRecognition);
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    // Handle speech recognition results
    recognition.onresult = (event: Event) => {
      const speechEvent = event as any;
      let interimTranscript = '';
      let finalTranscript = '';

      // Process results
      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
        const transcript = speechEvent.results[i][0].transcript;
        if (speechEvent.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcript with final results
      if (finalTranscript) {
        setTranscript((prevTranscript) => prevTranscript + finalTranscript);
      }

      // Handle interim text with timeout
      if (interimTranscript) {
        setInterimText(interimTranscript);

        if (interimTimeoutRef.current) {
          clearTimeout(interimTimeoutRef.current);
        }

        interimTimeoutRef.current = setTimeout(() => {
          setInterimText('');
        }, 2000);
      }
    };

    // Handle errors
    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error', event.error);
    };

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    };
  }, [language]); // Re-initialize when language changes

  // Save transcript to localStorage before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('savedTranscript', transcript);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [transcript]);

  // Function to toggle recording state
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
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
  }, [isRecording]);

  // Clear the transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimText('');
  }, []);

  return {
    isRecording,
    transcript,
    interimText,
    toggleRecording,
    clearTranscript,
  };
};
