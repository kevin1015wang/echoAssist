import React from 'react';
import { Feedback, Scenario } from '../types';
import { Button } from './Button';

interface FeedbackDisplayProps {
  feedback: Feedback;
  scenario: Scenario;
  onBackToSelection: () => void;
}

const renderStars = (score: number) => {
  const numStars = Math.max(0, Math.min(5, Math.round(score / 20)));
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`w-6 h-6 ${i < numStars ? 'text-yellow-400' : 'text-slate-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.46a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118l-3.387-2.461a1 1 0 00-1.175 0l-3.387 2.461c-.784.57-1.838-.197-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.28 9.399c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    );
  }
  return <div className="flex">{stars}</div>;
};

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, scenario, onBackToSelection }) => {
  const feedbackItems = [
    { label: "Response Time Perception", value: feedback.response_time_perception },
    { label: "Tone Assessment", value: feedback.tone_assessment },
    { label: "Prioritization & Info Gathering", value: feedback.prioritization_and_info_gathering },
    { label: "Problem Resolution Approach", value: feedback.problem_resolution_approach },
  ];
  
  // A simple score calculation if not directly provided, or use feedback.score
  const score = typeof (feedback as any).score === 'number' ? (feedback as any).score : (feedback as any).score?.score || 75;


  return (
    <div className="p-6 bg-slate-50 flex flex-col items-center justify-center h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-3">Scenario Complete!</h2>
      <p className="text-slate-600 mb-1">Scenario: <strong>{scenario.title}</strong></p>
      <p className="text-slate-600 mb-4">Caller: {scenario.callerPersona} ({scenario.level})</p>

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mb-6">
        <h3 className="text-xl font-semibold text-sky-700 mb-1 text-center">Your Performance Score</h3>
        <div className="flex justify-center my-3">{renderStars(score)}</div>
        <p className="text-5xl font-bold text-slate-700 text-center mb-4">{score}<span className="text-2xl text-slate-500">/100</span></p>
        
        <h4 className="text-lg font-semibold text-slate-700 mt-6 mb-2">Overall Comment:</h4>
        <p className="text-slate-600 italic mb-4">"{feedback.overall_comment}"</p>
        
        <hr className="my-4"/>

        <h4 className="text-lg font-semibold text-slate-700 mb-3">Detailed Feedback:</h4>
        <ul className="space-y-3">
          {feedbackItems.map(item => (
            <li key={item.label}>
              <span className="font-medium text-slate-600">{item.label}:</span>
              <p className="text-sm text-slate-500 pl-2">{item.value}</p>
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={onBackToSelection} variant="primary" size="large">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
        Try Another Scenario
      </Button>
    </div>
  );
};
