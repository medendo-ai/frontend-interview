import { useState, useEffect, useCallback } from 'react';
import { useWorker } from './useWorker';

/**
 * Options for the summarizer
 */
export interface SummarizeOptions {
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

interface SummarizerHookResult {
  summary: string;
  isLoading: boolean;
  isGenerating: boolean;
  isReady: boolean;
  error: string | null;
  generateSummary: (text: string) => void;
  status: 'loading' | 'ready' | 'error';
  summarize: (text: string) => Promise<string>;
}

export function useSummarizer(): SummarizerHookResult {
  // State to track the summary process
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Handler for worker messages
  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, status, summary, error, isGenerating } = event.data;

    console.log('Worker message:', event.data);

    switch (type) {
      case 'status':
        if (status === 'ready') {
          setIsLoading(false);
          setIsReady(true);
          setStatus('ready');
        } else if (status === 'error') {
          setStatus('error');
        }
        break;

      case 'generating':
        setIsGenerating(isGenerating);
        break;

      case 'result':
        setSummary(summary);
        setIsGenerating(false);
        break;

      case 'error':
        setError(error || 'Unknown error occurred');
        setIsGenerating(false);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }, []);

  // Create worker with the message handler
  const worker = useWorker('summarizer-worker', handleWorkerMessage);

  // Initialize the worker
  useEffect(() => {
    if (!worker) return;

    try {
      // Initialize the worker
      worker.postMessage({ type: 'load' });
    } catch (err) {
      setError('Failed to initialize summarizer');
      setIsLoading(false);
      setStatus('error');
    }
  }, [worker]);

  // Function to generate summary - used internally
  const generateSummary = useCallback(
    (text: string) => {
      if (!worker || !isReady) {
        setError('Summarizer not ready');
        return;
      }

      setError(null);
      setIsGenerating(true);

      try {
        worker.postMessage({
          type: 'summarize',
          payload: { text },
        });
      } catch (err) {
        setError('Failed to generate summary');
        setIsGenerating(false);
      }
    },
    [worker, isReady],
  );

  // Function to generate summary that returns a promise - used by App.tsx
  const summarize = useCallback(
    async (text: string): Promise<string> => {
      if (!worker || !isReady) {
        throw new Error('Summarizer not ready');
      }

      setError(null);
      setIsGenerating(true);

      return new Promise<string>((resolve, reject) => {
        try {
          // Add a one-time message handler for this specific request
          const messageHandler = (event: MessageEvent) => {
            const { type, summary, error } = event.data;

            if (type === 'result') {
              worker.removeEventListener('message', messageHandler);
              resolve(summary);
              setIsGenerating(false);
            } else if (type === 'error') {
              worker.removeEventListener('message', messageHandler);
              reject(new Error(error || 'Unknown error'));
              setIsGenerating(false);
            }
          };

          // Add the message handler
          worker.addEventListener('message', messageHandler);

          // Send the request
          worker.postMessage({
            type: 'summarize',
            payload: { text },
          });
        } catch (err) {
          setIsGenerating(false);
          reject(err instanceof Error ? err : new Error('Failed to generate summary'));
        }
      });
    },
    [worker, isReady],
  );

  return {
    summary,
    isLoading,
    isGenerating,
    isReady,
    error,
    generateSummary,
    status,
    summarize,
  };
}
