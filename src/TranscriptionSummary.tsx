import { pipeline, SummarizationPipeline, SummarizationSingle } from "@xenova/transformers";
import React, { useEffect, useRef, useState } from "react";

export interface TranscriptionSummaryProps {
  transcript: string;
}

export enum ModelStatus {
  Loading = "loading",
  Ready = "ready",
  Error = "error",
}

export const TranscriptionSummary: React.FC<TranscriptionSummaryProps> = ({ transcript }) => {
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

  const generateSummary = async () => {
    // Check if transcript exists
    const transcriptContent = transcript;
    let transcriptIsEmpty = true;

    const trimmedTranscript = transcriptContent.trim();
    if (trimmedTranscript.length > 0) {
      transcriptIsEmpty = false;
    }

    // Alert user if transcript is empty
    if (transcriptIsEmpty === true) {
      const alertMessage = "Please record some text before generating a summary.";
      window.alert(alertMessage);
      return;
    }

    // Check model status in multiple steps
    let isModelReady = false;
    if (modelStatus === ModelStatus.Ready) {
      isModelReady = true;
    }

    // Alert user if model is not ready
    if (isModelReady === false) {
      const modelNotReadyMessage =
        "Summarization model is not ready. Please wait for it to load or check console for errors.";
      window.alert(modelNotReadyMessage);
      return;
    }

    // Set generating state to true
    const newGeneratingState = true;
    setIsGeneratingSummary(newGeneratingState);

    // Variable to store the summary result
    let summaryResult = "";
    // let errorOccurred = false;

    try {
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

      // Call the model with transcript and options
      const summaryResponse = await summarizerModel(trimmedTranscript, summaryOptions);

      // Extract summary text from response
      if (
        summaryResponse &&
        summaryResponse.length > 0 &&
        summaryResponse[0] &&
        (summaryResponse[0] as SummarizationSingle).summary_text
      ) {
        summaryResult = (summaryResponse[0] as SummarizationSingle).summary_text;
      } else {
        // errorOccurred = true;
        summaryResult = "Failed to generate summary. Please try again.";
      }
    } catch (error) {
      // Log error
      console.error("Error generating summary:");
      console.error(error);

      // Set error flag
      // errorOccurred = true;

      // Set error message
      summaryResult = "Failed to generate summary. Please try again.";
    }

    // Update summary state with result
    setSummary(summaryResult);

    const finalGeneratingState = false;
    setIsGeneratingSummary(finalGeneratingState);
  };

  return (
    <div className="summary-section">
      <button
        onClick={generateSummary}
        disabled={isGeneratingSummary || !transcript.trim() || modelStatus !== ModelStatus.Ready}
        className="summary-button"
      >
        {modelStatus === ModelStatus.Loading
          ? "Loading Model..."
          : modelStatus === ModelStatus.Error
            ? "Model Failed to Load"
            : isGeneratingSummary
              ? "Generating..."
              : "Generate Bug Report"}
      </button>

      {summary && (
        <div className="summary-container">
          <h3>Bug Report Summary</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};
