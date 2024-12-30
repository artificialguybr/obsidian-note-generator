import * as React from 'react';
import { useState } from 'react';
import { CopyButtonProps } from '../types/interfaces';

export const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button 
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy message'}
            aria-label={copied ? 'Copied!' : 'Copy message'}
        >
            {copied ? '✓' : '📋'}
        </button>
    );
}; 