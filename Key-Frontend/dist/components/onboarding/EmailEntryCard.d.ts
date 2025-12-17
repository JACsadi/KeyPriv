import React from 'react';
type EmailEntryCardProps = {
    logo?: React.ReactNode;
    onNext: (email: string) => void;
    onSsoRedirect: (email: string) => void;
};
declare const EmailEntryCard: React.FC<EmailEntryCardProps>;
export default EmailEntryCard;
