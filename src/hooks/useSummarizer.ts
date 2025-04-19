import { useState, useRef, useEffect } from 'react';
import { pipeline } from '@xenova/transformers';

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
 * @param modelName The name of the model to use for summarization
 * @returns Object containing summarization state and functions
 */
export const useSummarizer = (modelName: string = 'Xenova/distilbart-cnn-6-6') => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isGenerating, setIsGenerating] = useState(false);
  const summarizerRef = useRef<any>(null);

  // Load the summarization model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Using a small summarization model that can run in browser
        summarizerRef.current = await pipeline('summarization', modelName);
        setStatus('ready');
        console.log('Summarization model loaded successfully');
      } catch (error) {
        console.error('Error loading summarization model:', error);
        setStatus('error');
      }
    };

    loadModel();
  }, [modelName]); // Only reload if the model name changes

  /**
   * Generate a summary from the provided text
   * @param text The text to summarize
   * @param options Options for the summarizer
   * @returns The summary text
   */
  const summarize = async (text: string, options: SummarizeOptions = {}) => {
    // Check if text exists and is not empty
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Please provide text to summarize');
    }

    // Check if model is ready
    if (status !== 'ready') {
      throw new Error(
        'Summarization model is not ready. Please wait for it to load or check console for errors.',
      );
    }

    // Set generating state to true
    setIsGenerating(true);

    try {
      // Default options
      const summaryOptions = {
        max_length: 100,
        min_length: 30,
        do_sample: false,
        ...options,
      };

      // Call the model with text and options
      const summaryResponse = await summarizerRef.current(trimmedText, summaryOptions);

      // Extract summary text from response
      if (
        summaryResponse &&
        summaryResponse.length > 0 &&
        summaryResponse[0] &&
        summaryResponse[0].summary_text
      ) {
        return summaryResponse[0].summary_text;
      } else {
        throw new Error('Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    status,
    isGenerating,
    summarize,
  };
};
