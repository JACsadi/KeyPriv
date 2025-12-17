"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubdomainValidation = useSubdomainValidation;
const react_1 = require("react");
const useDebounce_1 = require("./useDebounce");
const subdomain_1 = require("../utils/subdomain");
const reservedSubdomains_1 = require("../constants/reservedSubdomains");
const tenant_1 = require("../api/tenant");
function useSubdomainValidation(orgName) {
    const [validationState, setValidationState] = (0, react_1.useState)({
        normalizedSubdomain: '',
        fullSubdomain: '',
        availability: 'idle',
        isReserved: false,
        error: null,
    });
    const debouncedOrgName = (0, useDebounce_1.useDebounce)(orgName, 400);
    (0, react_1.useEffect)(() => {
        if (!orgName.trim()) {
            setValidationState({
                normalizedSubdomain: '',
                fullSubdomain: '',
                availability: 'idle',
                isReserved: false,
                error: null,
            });
            return;
        }
        const normalized = (0, subdomain_1.normalizeSubdomain)(orgName);
        if (!normalized) {
            setValidationState(prev => ({
                ...prev,
                normalizedSubdomain: '',
                fullSubdomain: '',
                error: 'Invalid organization name format',
            }));
            return;
        }
        const isReserved = (0, subdomain_1.isReservedSubdomain)(normalized, reservedSubdomains_1.RESERVED_SUBDOMAINS);
        const fullSubdomain = (0, subdomain_1.formatSubdomain)(normalized);
        setValidationState(prev => ({
            ...prev,
            normalizedSubdomain: normalized,
            fullSubdomain,
            isReserved,
            error: isReserved ? 'Reserved subdomain' : null,
        }));
        if (!isReserved && normalized) {
            setValidationState(prev => ({
                ...prev,
                availability: 'checking',
            }));
            const checkAvailability = async () => {
                try {
                    const result = await (0, tenant_1.checkSubdomainAvailability)(normalized);
                    setValidationState(prev => ({
                        ...prev,
                        availability: result.available ? 'available' : 'unavailable',
                        error: result.available ? null : 'Subdomain already in use',
                    }));
                }
                catch (error) {
                    setValidationState(prev => ({
                        ...prev,
                        availability: 'unavailable',
                        error: 'Failed to check subdomain availability',
                    }));
                }
            };
            const timer = setTimeout(checkAvailability, 100);
            return () => clearTimeout(timer);
        }
    }, [debouncedOrgName]);
    return validationState;
}
//# sourceMappingURL=useSubdomainValidation.js.map