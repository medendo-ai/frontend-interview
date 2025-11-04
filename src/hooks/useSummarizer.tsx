import { pipeline, SummarizationPipeline, SummarizationSingle } from "@xenova/transformers";
import { useEffect, useRef, useState } from "react";

export enum ModelStatus {
  Loading = "loading",
  Ready = "ready",
  Error = "error",
}

const SUMMARY_RESULT_ERROR = "Failed to generate summary. Please try again.";

interface UseSummarizerReturn {
  summary: string;
  isGeneratingSummary: boolean;
  modelStatus: ModelStatus;
  generateSummary: (transcript: string) => Promise<void>;
  clearSummary: () => void;
}

export const useSummarizer = (): UseSummarizerReturn => {
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(ModelStatus.Loading);

  const summarizerRef = useRef<SummarizationPipeline>(null);

  useEffect(() => {
    // Load the summarization model
    const loadModel = async () => {
      try {
        // Using a small summarization model that can run in browser
        // Xenova/distilbart-cnn-6-6 is a smaller version of BART fine-tuned for summarization
        summarizerRef.current = await pipeline("summarization", "Xenova/distilbart-cnn-6-6");
        setModelStatus(ModelStatus.Ready);
        console.log("Summarization model loaded successfully");
      } catch (error) {
        console.error("Error loading summarization model:", error);
        setModelStatus(ModelStatus.Error);
      }
    };

    loadModel();
  }, []);

  const generateSummary = async (transcript: string) => {
    const trimmedTranscript = transcript.trim();
    if (trimmedTranscript.length === 0) {
      const alertMessage = "Please record some text before generating a summary.";
      window.alert(alertMessage);
      return;
    }

    // Alert user if model is not ready
    if (modelStatus !== ModelStatus.Ready) {
      const modelNotReadyMessage =
        "Summarization model is not ready. Please wait for it to load or check console for errors.";
      window.alert(modelNotReadyMessage);
      return;
    }

    setIsGeneratingSummary(true);

    try {
      // Slight hack for the loading state. Yield to the event loop to allow React to re-render
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get the model from ref
      const summarizerModel = summarizerRef.current;
      if (!summarizerModel) {
        throw new Error("Summarization model is not loaded.");
      }

      // Create options object
      const summaryOptions = {
        max_length: 100,
        min_length: 30,
        do_sample: false,
      };

      const summaryResponse = await summarizerModel(trimmedTranscript, summaryOptions);
      const summaryResult =
        (summaryResponse?.[0] as SummarizationSingle)?.summary_text ?? SUMMARY_RESULT_ERROR;

      // Update summary state with result
      setSummary(summaryResult);
    } catch (error) {
      // Log error
      console.error("Error generating summary:", error);

      // Set error message
      setSummary(SUMMARY_RESULT_ERROR);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const clearSummary = () => {
    setSummary("");
  };

  return {
    summary,
    isGeneratingSummary,
    modelStatus,
    generateSummary,
    clearSummary,
  };
};
