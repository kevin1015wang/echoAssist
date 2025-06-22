import React from 'react';

interface DisclaimerProps {
  appName?: string;
  emergencyNotice?: boolean;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ 
  appName = "Training Simulator", 
  emergencyNotice = true 
}) => {
  return (
    <div className="bg-sky-600 text-white p-3 text-center sticky top-0 z-50 shadow-md">
      <p className="font-semibold text-sm sm:text-base">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 inline-block mr-2 align-text-bottom">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <strong>{appName.toUpperCase()}</strong>
      </p>
      {emergencyNotice && (
        <p className="text-xs sm:text-sm">
          <strong>IMPORTANT: This is for practice ONLY. DO NOT use for real emergencies.</strong>
        </p>
      )}
       <p className="text-xs sm:text-sm">
          This application uses AI and speech services for training purposes.
        </p>
    </div>
  );
};
