import React, { useState } from 'react';
import { Button } from './Button';
import { Scenario, ScenarioLevel, CallerPersona } from '../types';

interface ScenarioSelectionScreenProps {
  scenarios: Scenario[];
  onScenarioSelect: (scenario: Scenario) => void;
}

export const ScenarioSelectionScreen: React.FC<ScenarioSelectionScreenProps> = ({ scenarios, onScenarioSelect }) => {
  const [selectedLevel, setSelectedLevel] = useState<ScenarioLevel | 'all'>('all');
  const [selectedPersona, setSelectedPersona] = useState<CallerPersona | 'all'>('all');

  const filteredScenarios = scenarios.filter(scenario => 
    (selectedLevel === 'all' || scenario.level === selectedLevel) &&
    (selectedPersona === 'all' || scenario.callerPersona === selectedPersona)
  );

  return (
    <div className="flex flex-col items-center justify-start h-full p-6 text-center overflow-y-auto">
      <img src="https://picsum.photos/seed/callcenter/128/128" alt="Call Center Icon" className="w-24 h-24 mb-4 rounded-full shadow-lg" />
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Call Center Training</h1>
      <p className="text-slate-600 mb-6 max-w-md">
        Select a scenario to practice your customer service skills with an AI caller.
      </p>

      <div className="mb-6 flex flex-wrap justify-center gap-4 items-center">
        <div>
          <label htmlFor="levelFilter" className="block text-sm font-medium text-slate-700 mr-2">Caller Emotion:</label>
          <select 
            id="levelFilter"
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value as ScenarioLevel | 'all')}
            className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="all">All Emotions</option>
            {Object.values(ScenarioLevel).map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="personaFilter" className="block text-sm font-medium text-slate-700 mr-2">Caller Persona:</label>
          <select 
            id="personaFilter"
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value as CallerPersona | 'all')}
            className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="all">All Personas</option>
            {Object.values(CallerPersona).map(persona => <option key={persona} value={persona}>{persona}</option>)}
          </select>
        </div>
      </div>

      {filteredScenarios.length === 0 && (
        <p className="text-slate-500">No scenarios match your filter criteria.</p>
      )}

      <div className="space-y-4 w-full max-w-lg">
        {filteredScenarios.map((scenario) => (
          <div key={scenario.id} className="p-4 border border-slate-200 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-sky-700 mb-1">{scenario.title}</h2>
            <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Emotion:</span> {scenario.level}</p>
            <p className="text-sm text-slate-600 mb-2"><span className="font-medium">Persona:</span> {scenario.callerPersona}</p>
            <p className="text-sm text-slate-500 mb-3">{scenario.description}</p>
            <Button onClick={() => onScenarioSelect(scenario)} variant="primary" size="medium" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Start Scenario: {scenario.title.substring(0,20)}{scenario.title.length > 20 ? '...' : ''}
            </Button>
          </div>
        ))}
      </div>
       <p className="text-xs text-slate-500 mt-8">
        Interactions are simulated by AI for training purposes.
      </p>
    </div>
  );
};