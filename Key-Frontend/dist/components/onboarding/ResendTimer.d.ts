import React from 'react';
interface ResendTimerProps {
    onResend: () => void;
    initialSeconds?: number;
    disabled?: boolean;
}
declare const ResendTimer: React.FC<ResendTimerProps>;
export default ResendTimer;
