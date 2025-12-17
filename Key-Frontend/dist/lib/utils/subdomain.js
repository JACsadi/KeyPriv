"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSubdomain = normalizeSubdomain;
exports.isReservedSubdomain = isReservedSubdomain;
exports.formatSubdomain = formatSubdomain;
function normalizeSubdomain(orgName) {
    return orgName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
function isReservedSubdomain(subdomain, reservedWords) {
    const cleanSubdomain = subdomain.toLowerCase().trim();
    return reservedWords.some(word => cleanSubdomain.startsWith(word));
}
function formatSubdomain(subdomain) {
    return `${subdomain}.onkeypriv.com`;
}
//# sourceMappingURL=subdomain.js.map