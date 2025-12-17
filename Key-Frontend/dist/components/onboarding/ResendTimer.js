'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const useOtpTimer_1 = require("../../lib/hooks/useOtpTimer");
const ResendTimer = ({ onResend, initialSeconds = 20, disabled = false }) => {
    const { timeLeft, isActive, startTimer } = (0, useOtpTimer_1.useOtpTimer)(initialSeconds);
    return (<div className="mt-4">
      {isActive ? (<button type="button" disabled={true} className="text-indigo-600 text-sm italic" aria-disabled={true}>
          Resend in {timeLeft}s
        </button>) : (<button type="button" onClick={() => {
                onResend();
                startTimer();
            }} disabled={disabled} className={`text-indigo-600 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}>
          Resend Code
        </button>)}
    </div>);
};
exports.default = ResendTimer;
//# sourceMappingURL=ResendTimer.js.map