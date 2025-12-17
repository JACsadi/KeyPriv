'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const framer_motion_1 = require("framer-motion");
const OtpInput_1 = require("../otp/OtpInput");
const ResendTimer_1 = require("./ResendTimer");
const otp_1 = require("../../lib/api/otp");
const Card2OTP = () => {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const [otp, setOtp] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [apiError, setApiError] = (0, react_1.useState)(null);
    const [email, setEmail] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const emailParam = searchParams.get('email');
        const extractedEmail = emailParam ? decodeURIComponent(emailParam) : null;
        if (!extractedEmail) {
            router.push('/');
            return;
        }
        setEmail(extractedEmail);
        sendOtpCode(extractedEmail);
    }, [searchParams, router]);
    const sendOtpCode = async (email) => {
        try {
            await (0, otp_1.sendOtp)(email);
        }
        catch (err) {
            setApiError('Failed to send verification code. Please try again.');
            console.error('Error sending OTP:', err);
        }
    };
    const handleOtpComplete = async (value) => {
        setOtp(value);
    };
    const handleNextClick = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }
        setIsLoading(true);
        setError(null);
        setApiError(null);
        try {
            const response = await (0, otp_1.verifyOtp)(email, otp);
            if (response.success) {
                router.push(`/onboarding/org-setup?email=${encodeURIComponent(email)}`);
            }
            else {
                setError('Verification failed. Please try again.');
            }
        }
        catch (err) {
            setError(err.message || 'Failed to verify code. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleResendCode = async () => {
        try {
            await (0, otp_1.sendOtp)(email);
            setApiError(null);
        }
        catch (err) {
            setApiError('Failed to resend verification code. Please try again.');
            console.error('Error resending OTP:', err);
        }
    };
    const canSubmit = otp.length === 6 && !isLoading;
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md mx-auto p-6 mt-10 border rounded-2xl shadow bg-white">
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-bold">DO</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-2">Verify Your Email</h1>
        <p className="text-gray-600 text-sm">
          We sent a 6-digit verification code to:
        </p>
        <p className="font-medium text-gray-800">{email}</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Verification Code
        </label>
        
        <OtpInput_1.default length={6} value={otp} onChange={setOtp} onComplete={handleOtpComplete} disabled={isLoading}/>
        
        {error && (<div className="text-red-600 text-sm mt-2" role="alert">
            {error}
          </div>)}
        
        {apiError && (<div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mt-2" role="alert">
            {apiError}
          </div>)}
      </div>

      <ResendTimer_1.default onResend={handleResendCode} initialSeconds={20} disabled={isLoading}/>

      <button onClick={handleNextClick} disabled={!canSubmit} className={`bg-indigo-600 text-white px-4 py-3 rounded-xl w-full mt-6 ${canSubmit ? 'hover:bg-indigo-700' : 'opacity-60 cursor-not-allowed'}`}>
        {isLoading ? 'Processing…' : 'Next →'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        This verification is powered by keypriv.com
      </p>
    </framer_motion_1.motion.div>);
};
exports.default = Card2OTP;
//# sourceMappingURL=Card2OTP.js.map