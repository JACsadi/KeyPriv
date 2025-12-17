import React from 'react';
interface OtpInputProps {
    length?: number;
    onChange: (value: string) => void;
    onComplete: (value: string) => void;
    value?: string;
    disabled?: boolean;
}
declare const OtpInput: React.FC<OtpInputProps>;
export default OtpInput;
