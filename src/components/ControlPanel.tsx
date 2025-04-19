import React from 'react';
import { LANGUAGES } from '../constants/languages';

interface ControlPanelProps {
  isRecording: boolean;
  toggleRecording: () => void;
  currentLanguage: string;
  onLanguageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRecording,
  toggleRecording,
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="control-panel">
      <button
        onClick={toggleRecording}
        className={`record-button ${isRecording ? 'recording' : ''}`}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      <div className="language-selector">
        <label htmlFor="language-dropdown">Language: </label>
        <select
          id="language-dropdown"
          value={currentLanguage}
          onChange={onLanguageChange}
          className="language-dropdown"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ControlPanel;
