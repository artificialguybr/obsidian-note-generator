import { App, TFile } from 'obsidian';
import NoteGeneratorPlugin from '../main';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatViewProps {
    plugin: NoteGeneratorPlugin;
}

export interface ChatHistory {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

export interface NoteSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (selectedNotes: string[]) => void;
    files: TFile[];
    selectedPaths?: string[];
}

export interface CopyButtonProps {
    content: string;
}

export interface ChatHistoryPillsProps {
    histories: ChatHistory[];
    currentId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}

export interface MessageContentProps {
    content: string;
    plugin: NoteGeneratorPlugin;
}

export interface InputAreaProps {
    input: string;
    setInput: (value: string) => void;
    isGenerating: boolean;
    mode: 'chat' | 'generate';
    selectedContextNotes: string[];
    onSend: () => void;
    onClearChat: () => void;
    onOpenNoteSelection: () => void;
    onCustomPromptChange: (prompt: string | null) => void;
} 