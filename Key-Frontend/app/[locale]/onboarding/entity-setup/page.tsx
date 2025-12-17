import React from 'react';

const EntitySetupPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 mt-10 border rounded-2xl shadow bg-white text-center">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-bold">DO</span>
          </div>
        </div>
        
        <h1 className="text-xl font-semibold mb-2">Entity Setup</h1>
        <p className="text-gray-600 mb-6">Entity setup page coming soon in the next iteration.</p>
        
        <button 
          onClick={() => window.history.back()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default EntitySetupPage;