"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOtpTimer = void 0;
const react_1 = require("react");
const useOtpTimer = (initialSeconds = 20) => {
    const [timeLeft, setTimeLeft] = (0, react_1.useState)(initialSeconds);
    const [isActive, setIsActive] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [isActive, timeLeft]);
    const startTimer = (0, react_1.useCallback)((seconds = initialSeconds) => {
        setTimeLeft(seconds);
        setIsActive(true);
    }, [initialSeconds]);
    const formatTime = (0, react_1.useCallback)((seconds) => {
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
exports.useOtpTimer = useOtpTimer;
//# sourceMappingURL=useOtpTimer.js.map