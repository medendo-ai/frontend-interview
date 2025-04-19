import { useState, useEffect, useRef } from 'react';

/**
 * Options for the summarizer
 */
export interface SummarizeOptions {
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

/**
 * Creates a web worker for summarization tasks
 * @returns Worker instance
 */
function createSummarizerWorker(): Worker {
  const workerCode = `
    // Summarizer Worker
    self.onmessage = async (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'load':
          // Simulate model loading in this simplified version
          setTimeout(() => {
            self.postMessage({ type: 'status', status: 'ready' });
          }, 500);
          break;
          
        case 'summarize':
          try {
            // Simulate summarization process
            self.postMessage({ type: 'generating', isGenerating: true });
            
            // Add a delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate a simple summary by truncating
            const summary = 'Summary: ' + payload.text.substring(0, 100) + 
              (payload.text.length > 100 ? '...' : '');
            
            self.postMessage({
              type: 'result',
              summary,
              isGenerating: false
            });
          } catch (error) {
            self.postMessage({ 
              type: 'error', 
              error: error.message || 'Unknown error during summarization', 
              isGenerating: false 
            });
          }
          break;
          
        default:
          self.postMessage({ 
            type: 'error', 
            error: 'Unknown command', 
            isGenerating: false 
          });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

/**
 * Custom hook for text summarization using a web worker
 * @param modelName The name of the model to use (for future implementation)
 * @returns Object containing summarization state and functions
 */
export const useSummarizer = (modelName: string = 'Xenova/distilbart-cnn-6-6') => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref for worker to avoid recreating it on re-renders
  const workerRef = useRef<Worker | null>(null);

  // Create and initialize the worker
  useEffect(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = createSummarizerWorker();

        // Set up message handling
        workerRef.current.onmessage = (event) => {
          const {
            type,
            status: workerStatus,
            error: workerError,
            isGenerating: generatingStatus,
          } = event.data;

          switch (type) {
            case 'status':
              setStatus(workerStatus);
              if (workerStatus === 'error') {
                setError(workerError || 'Unknown model loading error');
              } else if (workerStatus === 'ready') {
                setError(null);
              }
              break;

            case 'generating':
              setIsGenerating(generatingStatus);
              break;

            case 'result':
              setIsGenerating(false);
              break;

            case 'error':
              setError(workerError || 'Unknown error during operation');
              setIsGenerating(false);
              break;
          }
        };

        // Handle worker errors
        workerRef.current.onerror = () => {
          setStatus('error');
          setError('Worker encountered an error');
          setIsGenerating(false);
        };

        // Initialize the model
        workerRef.current.postMessage({
          type: 'load',
          payload: { modelName },
        });
      } catch (err) {
        setStatus('error');
        setError('Failed to initialize worker');
      }
    }

    // Clean up on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [modelName]);

  /**
   * Generate a summary from the provided text
   */
  const summarize = async (text: string, options: SummarizeOptions = {}) => {
    // Input validation
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Please provide text to summarize');
    }

    // Check if model is ready
    if (status !== 'ready' || !workerRef.current) {
      throw new Error('Summarization model is not ready yet. Please wait.');
    }

    if (error) {
      throw new Error(`Summarizer error: ${error}`);
    }

    // Set generating state
    setIsGenerating(true);

    // Create a promise that resolves when the worker sends back a result
    return new Promise<string>((resolve, reject) => {
      if (!workerRef.current) {
        setIsGenerating(false);
        reject(new Error('Worker not available'));
        return;
      }

      // Message handler specific to this summarization request
      const messageHandler = (event: MessageEvent) => {
        const { type, summary, error } = event.data;

        if (type === 'result') {
          workerRef.current?.removeEventListener('message', messageHandler);
          resolve(summary);
        } else if (type === 'error') {
          workerRef.current?.removeEventListener('message', messageHandler);
          reject(new Error(error));
        }
      };

      // Add temporary message handler for this request
      workerRef.current.addEventListener('message', messageHandler);

      // Send the task to the worker
      workerRef.current.postMessage({
        type: 'summarize',
        payload: {
          text: trimmedText,
          options: {
            max_length: 100,
            min_length: 30,
            do_sample: false,
            ...options,
          },
        },
      });
    }).finally(() => {
      // Ensure isGenerating is reset even if there's an error
      setIsGenerating(false);
    });
  };

  return {
    status,
    isGenerating,
    error,
    summarize,
  };
};
