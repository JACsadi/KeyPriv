export declare const useOtpTimer: (initialSeconds?: number) => {
    timeLeft: number;
    isActive: boolean;
    startTimer: (seconds?: number) => void;
    formatTime: (seconds: number) => string;
    isCompleted: boolean;
};
