'use client';

import React from 'react';
import { useOtpTimer } from '@/features/auth/hooks/useOtpTimer';

interface ResendTimerProps {
  onResend: () => void;
  initialSeconds?: number;
  disabled?: boolean;
}

const ResendTimer: React.FC<ResendTimerProps> = ({
  onResend,
  initialSeconds = 20,
  disabled = false
}) => {
  const { timeLeft, isActive, startTimer } = useOtpTimer(initialSeconds);

  return (
    <div className="mt-4">
      {isActive ? (
        <button
          type="button"
          disabled={true}
          className="text-indigo-600 text-sm italic"
          aria-disabled={true}
        >
          Resend in {timeLeft}s
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            onResend();
            startTimer(); // Restart the timer
          }}
          disabled={disabled}
          className={`text-indigo-600 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
        >
          Resend Code
        </button>
      )}
    </div>
  );
};

export default ResendTimer;