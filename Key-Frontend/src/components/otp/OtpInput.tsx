'use client';

import React, { useRef, useEffect, useState } from 'react';

interface OtpInputProps {
  length?: number;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  value?: string;
  disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  onChange,
  onComplete,
  value: propsValue = '',
  disabled = false
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize values from props if provided
  useEffect(() => {
    if (propsValue) {
      const newValues = propsValue.split('').slice(0, length);
      const filledValues = [...newValues, ...Array(length - newValues.length).fill('')];
      setValues(filledValues);
    } else {
      setValues(Array(length).fill(''));
    }
  }, [propsValue, length]);

  // Initialize array to ensure we have the right number of refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits

    if (value.length > 1) {
      // If user pastes multiple digits, try to distribute them
      const pastedValues = value.substring(0, length - index).split('');
      const newValues = [...values];

      for (let i = 0; i < pastedValues.length && index + i < length; i++) {
        newValues[index + i] = pastedValues[i];
      }

      setValues(newValues);

      // Focus the last filled input or the next available one
      const nextFocusIndex = Math.min(index + pastedValues.length, length - 1);
      if (inputRefs.current[nextFocusIndex]) {
        inputRefs.current[nextFocusIndex]?.focus();
      }
    } else {
      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);

      // Notify parent of change
      onChange(newValues.join(''));

      // Move to next input if there's a value
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text on focus for better UX
    setTimeout(() => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]?.select();
      }
    }, 0);
  };

  const setRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }

  // Check if OTP is complete
  useEffect(() => {
    const otpValue = values.join('');
    if (otpValue.length === length) {
      onComplete(otpValue);
    }
  }, [values, length, onComplete]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center space-x-2 mb-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={values.join('')}
          onChange={() => {}} // Controlled component
          className="opacity-0 absolute w-0 h-0 overflow-hidden"
          aria-label="OTP Input"
          aria-describedby="otp-description"
        />
        <span id="otp-description" className="sr-only">Enter 6-digit verification code</span>

        {values.map((value, index) => (
          <input
            key={index}
            ref={setRef(index)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className="w-12 h-12 border border-gray-300 rounded-xl text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Digit ${index + 1} of 6`}
          />
        ))}
      </div>

      {/* Visual representation of OTP */}
      <div className="flex space-x-1 mb-4">
        {values.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 bg-gray-300 rounded-full"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
};

export default OtpInput;