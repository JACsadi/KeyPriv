"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.createTenant = createTenant;
async function sendOtp(email) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`OTP sent to: ${email}`);
    return;
}
async function verifyOtp(_email, otp) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otp === "123456") {
        return {
            success: true
        };
    }
    else if (otp) {
        return { success: false };
    }
    else {
        return { success: false };
    }
}
async function createTenant(_email, orgName) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const normalizedOrgName = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return {
        tenant_domain: `${normalizedOrgName}.onkeypriv.com`
    };
}
//# sourceMappingURL=otp.js.map