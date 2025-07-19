import React, { useState, useEffect } from 'react';

const ProgressIndicator = ({ isVisible, onComplete }) => {
  const [progress, setProgress] = useState({
    isProcessing: false,
    currentStep: '',
    totalPlans: 0,
    processedPlans: 0,
    percentage: 0,
    errors: []
  });

  useEffect(() => {
    if (!isVisible) return;

    const pollProgress = async () => {
      try {
        const response = await fetch('/api/dashboard/progress');
        const data = await response.json();
        setProgress(data);

        // If processing is complete, notify parent
        if (!data.isProcessing && data.percentage === 100) {
          if (onComplete) onComplete();
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Poll every 1 second while visible
    const interval = setInterval(pollProgress, 1000);
    
    // Initial poll
    pollProgress();

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible || !progress.isProcessing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Loading Dashboard Data
          </h3>
          
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-4 w-full">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {progress.percentage}% Complete
            </div>
          </div>

          <div className="text-sm text-gray-700 mb-2">
            {progress.currentStep}
          </div>

          {progress.totalPlans > 0 && (
            <div className="text-xs text-gray-500 mb-4">
              Processing plan {progress.processedPlans} of {progress.totalPlans}
            </div>
          )}

          {progress.errors.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-800 mb-1">
                Warnings ({progress.errors.length})
              </div>
              <div className="text-xs text-yellow-700 max-h-20 overflow-y-auto">
                {progress.errors.slice(-3).map((error, index) => (
                  <div key={index} className="mb-1">{error}</div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            This may take several minutes due to Planning Center API rate limits...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
