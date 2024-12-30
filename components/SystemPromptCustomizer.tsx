import * as React from 'react';
import { useState } from 'react';
import { chatModePrompt } from '../prompts/chatMode';
import { noteModePrompt } from '../prompts/noteMode';

interface SystemPromptCustomizerProps {
    mode: 'chat' | 'generate';
    onCustomPromptChange: (prompt: string | null) => void;
}

export const SystemPromptCustomizer: React.FC<SystemPromptCustomizerProps> = ({
    mode,
    onCustomPromptChange,
}) => {
    const defaultPrompt = mode === 'chat' ? chatModePrompt : noteModePrompt;
    const [isExpanded, setIsExpanded] = useState(false);
    const [customPrompt, setCustomPrompt] = useState(defaultPrompt);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            onCustomPromptChange(null); // Reset to default when collapsing
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCustomPrompt(e.target.value);
        onCustomPromptChange(e.target.value);
    };

    return (
        <div className="system-prompt-customizer">
            <button 
                className="system-prompt-toggle"
                onClick={handleToggle}
                title="Customize system prompt for this chat"
            >
                {isExpanded ? '🔽 Hide System Prompt' : '▶️ Customize System Prompt'}
            </button>
            {isExpanded && (
                <div className="system-prompt-editor">
                    <textarea
                        value={customPrompt}
                        onChange={handlePromptChange}
                        placeholder="Enter custom system prompt..."
                        rows={5}
                    />
                    <div className="system-prompt-actions">
                        <button 
                            onClick={() => {
                                setCustomPrompt(defaultPrompt);
                                onCustomPromptChange(defaultPrompt);
                            }}
                            className="reset-prompt-button"
                        >
                            Reset to Default
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}; 