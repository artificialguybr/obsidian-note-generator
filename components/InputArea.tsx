import * as React from 'react';
import { InputAreaProps } from '../types/interfaces';
import { SystemPromptCustomizer } from './SystemPromptCustomizer';

export const InputArea: React.FC<InputAreaProps> = ({
    input,
    setInput,
    isGenerating,
    mode,
    selectedContextNotes,
    onSend,
    onClearChat,
    onOpenNoteSelection,
    onCustomPromptChange,
}) => {
    return (
        <div className="input-area">
            <div className="input-wrapper">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === 'chat' 
                        ? "Ask about your notes..." 
                        : "Describe the note you want to generate..."}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    disabled={isGenerating}
                />
                <button
                    className={`note-context-button ${selectedContextNotes.length > 0 ? 'active' : ''}`}
                    onClick={onOpenNoteSelection}
                    title={mode === 'chat' ? "Select notes for context" : "Select notes to use as context for generation"}
                >
                    {selectedContextNotes.length > 0 ? `${selectedContextNotes.length} notes selected` : 'Add Context'}
                </button>
                <button 
                    className="clear-button"
                    onClick={onClearChat}
                    title="Clear chat history"
                >
                    🗑️
                </button>
                <button 
                    className="send-button"
                    onClick={onSend}
                    disabled={isGenerating || !input.trim()}
                >
                    {isGenerating ? '⏳' : mode === 'chat' ? '💬 Send' : '📝 Generate'}
                </button>
            </div>
            {isGenerating && (
                <div className="generating-indicator">
                    {mode === 'chat' ? 'Processing your question...' : 'Generating your note...'}
                </div>
            )}
            <SystemPromptCustomizer
                mode={mode}
                onCustomPromptChange={onCustomPromptChange}
            />
        </div>
    );
}; 