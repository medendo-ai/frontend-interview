import { useState, useRef, useEffect, useCallback } from 'react';

// Add missing onend property to SpeechRecognition interface
declare global {
  interface SpeechRecognition {
    onend?: (event: Event) => void;
  }
}

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

  // Log state changes for debugging
  useEffect(() => {
    console.log('[useSpeechRecognition] isRecording changed:', isRecording);
  }, [isRecording]);

  // Initialize speech recognition with the specified language
  useEffect(() => {
    console.log('[useSpeechRecognition] Initializing with language:', language);

    // Check browser compatibility
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('[useSpeechRecognition] Browser does not support speech recognition');
      return;
    }

    // Initialize speech recognition
    try {
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
          console.log('[useSpeechRecognition] Final transcript:', finalTranscript);
          setTranscript((prevTranscript) => prevTranscript + finalTranscript);
        }

        // Handle interim text with timeout
        if (interimTranscript) {
          console.log('[useSpeechRecognition] Interim transcript:', interimTranscript);
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
        console.error('[useSpeechRecognition] Error:', event.error);
      };

      // Listen for end event
      recognition.onend = () => {
        // If recognition ends but isRecording is still true, we need to update the state
        if (isRecording) {
          console.log('[useSpeechRecognition] Recognition ended unexpectedly, updating state');
          setIsRecording(false);
        }
      };

      console.log('[useSpeechRecognition] Initialized successfully');
    } catch (error) {
      console.error('[useSpeechRecognition] Error initializing:', error);
    }

    // Cleanup function
    return () => {
      console.log('[useSpeechRecognition] Cleaning up');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('[useSpeechRecognition] Error stopping recognition:', error);
        }
      }

      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    };
  }, [language, isRecording]); // Re-initialize when language changes

  // Save transcript to localStorage before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[useSpeechRecognition] Saving transcript to localStorage');
      localStorage.setItem('savedTranscript', transcript);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [transcript]);

  // Function to toggle recording state
  const toggleRecording = useCallback(() => {
    console.log('[useSpeechRecognition] Toggle recording from', isRecording, 'to', !isRecording);

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          console.log('[useSpeechRecognition] Stopping recognition');
          recognitionRef.current.stop();
        } catch (error) {
          console.error('[useSpeechRecognition] Error stopping recognition:', error);
        }
      }
      setInterimText('');
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    } else {
      setTranscript('');
      setInterimText('');
      if (recognitionRef.current) {
        try {
          console.log('[useSpeechRecognition] Starting recognition');
          recognitionRef.current.start();
        } catch (error) {
          console.error('[useSpeechRecognition] Error starting recognition:', error);
          return; // Don't update isRecording state if starting fails
        }
      }
    }

    setIsRecording(!isRecording);
  }, [isRecording]);

  // Clear the transcript
  const clearTranscript = useCallback(() => {
    console.log('[useSpeechRecognition] Clearing transcript');
    setTranscript('');
    setInterimText('');
  }, []);

  // Load transcript from localStorage on mount
  useEffect(() => {
    const savedTranscript = localStorage.getItem('savedTranscript');
    if (savedTranscript) {
      console.log('[useSpeechRecognition] Loading saved transcript from localStorage');
      setTranscript(savedTranscript);
    }
  }, []);

  return {
    isRecording,
    transcript,
    interimText,
    toggleRecording,
    clearTranscript,
  };
};
