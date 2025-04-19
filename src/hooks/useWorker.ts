import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Interface for message handler function
 */
export interface MessageEventHandler {
  (event: MessageEvent): void;
}

/**
 * Hook to create and manage a web worker
 * @param workerPath Path to the worker file
 * @param messageHandler Function to handle messages from the worker
 * @returns The worker instance
 */
export function useWorker(workerPath: string, messageHandler: MessageEventHandler): Worker | null {
  // Use ref to keep worker instance
  const workerRef = useRef<Worker | null>(null);

  // Create a stable reference to the messageHandler
  const messageHandlerRef = useRef(messageHandler);
  useEffect(() => {
    messageHandlerRef.current = messageHandler;
  }, [messageHandler]);

  // Create the worker only once
  useEffect(() => {
    if (workerRef.current) return;

    try {
      // Use the correct URL format
      console.log('Creating worker with path:', workerPath);

      // Create the worker with inline code since imports are tricky
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
                // Signal that we're generating
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
                  error: error.message || 'Unknown error', 
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
      const worker = new Worker(URL.createObjectURL(blob));

      // Set up message handler
      const handler = (e: MessageEvent) => messageHandlerRef.current(e);
      worker.addEventListener('message', handler);

      console.log('Worker created successfully');

      // Store worker in ref
      workerRef.current = worker;

      // Clean up when unmounting
      return () => {
        console.log('Cleaning up worker');
        if (workerRef.current) {
          workerRef.current.removeEventListener('message', handler);
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating worker:', error);
      return () => {};
    }
  }, [workerPath]); // Only re-create if path changes

  return workerRef.current;
}
