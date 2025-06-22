import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';

interface ControlsHeaderProps {
  status: string;
  isDialing: boolean;
  voiceOutputEnabled: boolean;
  onToggleVoiceOutput: () => void;
  isSpeechSynthesisSupported: boolean;
}

export const ControlsHeader: React.FC<ControlsHeaderProps> = ({
  status,
  isDialing,
  voiceOutputEnabled,
  onToggleVoiceOutput,
  isSpeechSynthesisSupported
}) => {
  return (
    <div className="p-3 bg-slate-700 text-white text-center font-semibold text-sm rounded-t-lg flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        {isDialing && <LoadingSpinner size="small" color="white" className="mr-2"/>}
        <span>{status}</span>
      </div>
      {isSpeechSynthesisSupported && (
        <Button
          onClick={onToggleVoiceOutput}
          variant="ghost"
          size="small"
          className="text-white hover:bg-slate-600 p-1"
          aria-label={voiceOutputEnabled ? "Disable voice output" : "Enable voice output"}
        >
          {voiceOutputEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
};