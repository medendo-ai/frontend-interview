// Summarizer Worker
// This worker runs in a separate thread to prevent UI blocking

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'load':
      // Simulate model loading in this simplified version
      // In a real implementation, you would load a model here
      setTimeout(() => {
        self.postMessage({ type: 'status', status: 'ready' });
      }, 500);
      break;

    case 'summarize':
      try {
        // Signal that we're generating
        self.postMessage({ type: 'generating', isGenerating: true });

        // Add a delay to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // In a real implementation, you would use a summarization model
        // For now, we'll just return a simple summary
        const summary = `Summary: ${payload.text.substring(0, 100)}${
          payload.text.length > 100 ? '...' : ''
        }`;

        // Return the result
        self.postMessage({
          type: 'result',
          summary,
          isGenerating: false,
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error.message || 'Unknown error during summarization',
          isGenerating: false,
        });
      }
      break;

    default:
      self.postMessage({
        type: 'error',
        error: 'Unknown command',
        isGenerating: false,
      });
  }
};
