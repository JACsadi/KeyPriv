'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const EntitySetupClient = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3">
            <span className="text-white font-bold text-xl">DO</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Entity Setup</h1>
        <p className="text-gray-600 mb-8">Entity setup page coming soon in the next iteration.</p>
        
        <button 
          onClick={() => router.back()}
          className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] shadow-indigo-500/30 transition-all duration-200"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default EntitySetupClient;
