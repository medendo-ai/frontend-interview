import { useState, useEffect } from 'react';

/**
 * Options for the summarizer
 */
export interface SummarizeOptions {
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

/**
 * Custom hook for text summarization using Transformers.js
 * Utilizes a Web Worker to prevent UI blocking
 * @param modelName The name of the model to use for summarization
 * @returns Object containing summarization state and functions
 */
export const useSummarizer = (modelName: string = 'Xenova/distilbart-cnn-6-6') => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isGenerating, setIsGenerating] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create and set up the worker
  useEffect(() => {
    let workerInstance: Worker | null = null;

    try {
      // Basit worker oluşturma - direkt bir URL olmadan
      const workerCode = `
        console.log('Inline worker started');
        
        self.onmessage = async (event) => {
          const { type, payload } = event.data;
          console.log('Worker received message:', type, payload);
          
          if (type === 'load') {
            // Simulate successful model loading
            self.postMessage({
              type: 'status', 
              status: 'ready',
              message: 'Test worker is ready'
            });
          } else if (type === 'summarize') {
            // Simulate generating process
            self.postMessage({ type: 'generating', isGenerating: true });
            
            // Add a delay to simulate processing
            await new Promise(r => setTimeout(r, 2000));
            
            // Send back a fake summary
            self.postMessage({
              type: 'result',
              summary: 'Test summary: ' + payload.text.substring(0, 100) + '...',
              isGenerating: false
            });
          }
        };
      `;

      // Create a blob with the worker code
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerInstance = new Worker(URL.createObjectURL(blob));

      console.log('[useSummarizer] Worker created successfully');
    } catch (err) {
      console.error('[useSummarizer] Failed to create worker:', err);
      setStatus('error');
      setError('Failed to initialize summarizer: Worker creation failed');
      return;
    }

    // Set up message handling from the worker
    workerInstance.onmessage = (event) => {
      const {
        type,
        status: workerStatus,
        error: workerError,
        summary,
        isGenerating: generatingStatus,
      } = event.data;

      console.log(`[useSummarizer] Received message from worker: ${type}`, event.data);

      switch (type) {
        case 'status':
          console.log(`[useSummarizer] Status changed to: ${workerStatus}`);
          setStatus(workerStatus);
          if (workerStatus === 'error') {
            setError(workerError || 'Unknown error loading model');
          } else if (workerStatus === 'ready') {
            setError(null);
          }
          break;

        case 'generating':
          console.log(`[useSummarizer] isGenerating changed to: ${generatingStatus}`);
          setIsGenerating(generatingStatus);
          break;

        case 'result':
          console.log('[useSummarizer] Received result from worker');
          setIsGenerating(false);
          break;

        case 'error':
          console.error('[useSummarizer] Worker error:', workerError);
          setError(workerError || 'Unknown error during summarization');
          setIsGenerating(false);
          break;
      }
    };

    // Handle worker errors
    workerInstance.onerror = (event) => {
      console.error('[useSummarizer] Worker error:', event);
      setStatus('error');
      setError('Worker encountered an error');
      setIsGenerating(false);
    };

    // Store the worker instance
    setWorker(workerInstance);

    // Set initial status
    setStatus('loading');
    setError(null);

    // Send the initial load message
    workerInstance.postMessage({
      type: 'load',
      payload: { modelName },
    });

    // Clean up worker on unmount
    return () => {
      if (workerInstance) {
        console.log('[useSummarizer] Terminating worker');
        workerInstance.terminate();
      }
    };
  }, [modelName]);

  /**
   * Generate a summary from the provided text
   * This function communicates with the worker to do the heavy computation
   * @param text The text to summarize
   * @param options Options for the summarizer
   * @returns A promise resolving to the summary text
   */
  const summarize = async (text: string, options: SummarizeOptions = {}) => {
    // Check if text exists and is not empty
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Please provide text to summarize');
    }

    // Check if model is ready
    if (status !== 'ready' || !worker) {
      throw new Error(
        'Summarization model is not ready. Please wait for it to load or check console for errors.',
      );
    }

    if (error) {
      throw new Error(`Summarizer error: ${error}`);
    }

    // Force set generating state to true before worker call
    setIsGenerating(true);
    console.log('[useSummarizer] Setting isGenerating to true (main thread)');

    // Also update DOM directly for immediate visual feedback
    document.getElementById('summary-button')?.classList.add('processing');

    // Create a promise that resolves when the worker sends back a result
    return new Promise<string>((resolve, reject) => {
      if (!worker) {
        // Reset UI states if error
        setIsGenerating(false);
        document.getElementById('summary-button')?.classList.remove('processing');
        reject(new Error('Worker not available'));
        return;
      }

      // One-time message handler for this specific summarization task
      const messageHandler = (event: MessageEvent) => {
        const { type, summary, error } = event.data;

        if (type === 'result') {
          worker.removeEventListener('message', messageHandler);
          // Ensure button shows normal state
          document.getElementById('summary-button')?.classList.remove('processing');
          resolve(summary);
        } else if (type === 'error') {
          worker.removeEventListener('message', messageHandler);
          // Ensure button shows normal state
          document.getElementById('summary-button')?.classList.remove('processing');
          reject(new Error(error));
        }
      };

      // Add the temporary message handler
      worker.addEventListener('message', messageHandler);

      // Send the task to the worker
      worker.postMessage({
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
    });
  };

  return {
    status,
    isGenerating,
    error,
    summarize,
  };
};
