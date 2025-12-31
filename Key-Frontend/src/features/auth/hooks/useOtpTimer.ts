import { useState, useEffect, useCallback } from 'react';

export const useOtpTimer = (initialSeconds: number = 20) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startTimer = useCallback((seconds: number = initialSeconds) => {
    setTimeLeft(seconds);
    setIsActive(true);
  }, [initialSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, []);

  return {
    timeLeft,
    isActive,
    startTimer,
    formatTime,
    isCompleted: timeLeft === 0 && !isActive
  };
};