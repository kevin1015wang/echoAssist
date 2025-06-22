import React from 'react';
import { Scenario } from '../types';
import { GENERAL_CALL_CENTER_TIPS, GENERAL_CALL_CENTER_TIPS_TITLE } from '../constants';

interface GuidancePanelProps {
  scenario: Scenario | null; // Pass the current scenario for context if needed
}

export const GuidancePanel: React.FC<GuidancePanelProps> = ({ scenario }) => {
  // Can customize tips based on scenario.level or scenario.callerPersona if needed in the future
  // For now, using general tips.
  const title = scenario ? `Tips for: ${scenario.title}` : GENERAL_CALL_CENTER_TIPS_TITLE;
  const points = [...GENERAL_CALL_CENTER_TIPS];

  if (scenario) {
    points.unshift(`Caller Persona: ${scenario.callerPersona}`);
    points.unshift(`Caller Emotion: ${scenario.level}`);
  }


  if (points.length === 0) return null;

  return (
    <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-700 rounded-md shadow">
       <div className="flex">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-sky-500">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-md font-semibold text-sky-800">{title}</h3>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
