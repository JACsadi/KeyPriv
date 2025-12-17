'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const EmailEntryCard_1 = require("../components/onboarding/EmailEntryCard");
function Home() {
    const [email, setEmail] = (0, react_1.useState)('');
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EmailEntryCard_1.default onSsoRedirect={(email) => {
            console.log('SSO redirect for:', email);
        }} onNext={(email) => {
            window.location.href = `/onboarding/otp?email=${encodeURIComponent(email)}`;
        }}/>
    </div>);
}
//# sourceMappingURL=page.js.map