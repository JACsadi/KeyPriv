'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const OtpInput = ({ length = 6, onChange, onComplete, value: propsValue = '', disabled = false }) => {
    const [values, setValues] = (0, react_1.useState)(Array(length).fill(''));
    const inputRefs = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (propsValue) {
            const newValues = propsValue.split('').slice(0, length);
            const filledValues = [...newValues, ...Array(length - newValues.length).fill('')];
            setValues(filledValues);
        }
        else {
            setValues(Array(length).fill(''));
        }
    }, [propsValue, length]);
    (0, react_1.useEffect)(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);
    const handleChange = (index, e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length > 1) {
            const pastedValues = value.substring(0, length - index).split('');
            const newValues = [...values];
            for (let i = 0; i < pastedValues.length && index + i < length; i++) {
                newValues[index + i] = pastedValues[i];
            }
            setValues(newValues);
            const nextFocusIndex = Math.min(index + pastedValues.length, length - 1);
            if (inputRefs.current[nextFocusIndex]) {
                inputRefs.current[nextFocusIndex]?.focus();
            }
        }
        else {
            const newValues = [...values];
            newValues[index] = value;
            setValues(newValues);
            onChange(newValues.join(''));
            if (value && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };
    const handleFocus = (index) => {
        setTimeout(() => {
            if (inputRefs.current[index]) {
                inputRefs.current[index]?.select();
            }
        }, 0);
    };
    const setRef = (index) => (el) => {
        inputRefs.current[index] = el;
    };
    (0, react_1.useEffect)(() => {
        const otpValue = values.join('');
        if (otpValue.length === length) {
            onComplete(otpValue);
        }
    }, [values, length, onComplete]);
    return (<div className="flex flex-col items-center">
      <div className="flex items-center justify-center space-x-2 mb-3">
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={values.join('')} onChange={() => { }} className="opacity-0 absolute w-0 h-0 overflow-hidden" aria-label="OTP Input" aria-describedby="otp-description"/>
        <span id="otp-description" className="sr-only">Enter 6-digit verification code</span>

        {values.map((value, index) => (<input key={index} ref={setRef(index)} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={value} onChange={(e) => handleChange(index, e)} onKeyDown={(e) => handleKeyDown(index, e)} onFocus={() => handleFocus(index)} disabled={disabled} className="w-12 h-12 border border-gray-300 rounded-xl text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Digit ${index + 1} of 6`}/>))}
      </div>

      
      <div className="flex space-x-1 mb-4">
        {values.map((_, index) => (<div key={index} className="w-2 h-2 bg-gray-300 rounded-full" aria-hidden="true"/>))}
      </div>
    </div>);
};
exports.default = OtpInput;
//# sourceMappingURL=OtpInput.js.map