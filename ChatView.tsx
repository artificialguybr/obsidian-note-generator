import * as React from 'react';
import { useState, useRef } from 'react';
import { TFile } from 'obsidian';
import NoteGeneratorPlugin, { NOTE_GENERATOR_VIEW } from './main';
import { GeminiService } from './services/GeminiService';
import { ChatMessage, ChatViewProps } from './types/interfaces';
import { NoteSelectionModal } from './components/NoteSelectionModal';
import { ChatHistoryPills } from './components/ChatHistoryPills';
import { MessageContent } from './components/MessageContent';
import { InputArea } from './components/InputArea';
import { useChatHistory } from './hooks/useChatHistory';

export const ChatView: React.FC<ChatViewProps> = ({ plugin }) => {
    const [generateMessages, setGenerateMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [mode, setMode] = useState<'chat' | 'generate'>('chat');
    const [showExplanation, setShowExplanation] = useState(true);
    const [isNoteSelectionOpen, setIsNoteSelectionOpen] = useState(false);
    const [selectedContextNotes, setSelectedContextNotes] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [customSystemPrompt, setCustomSystemPrompt] = useState<string | null>(null);
    const geminiService = new GeminiService(plugin.settings);

    const {
        chatHistories,
        currentChatId,
        currentMessages,
        createNewChat,
        switchToChat,
        updateCurrentChat,
        deleteChat
    } = useChatHistory();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [currentMessages, generateMessages]);

    // Create new chat if none exists
    React.useEffect(() => {
        if (mode === 'chat' && !currentChatId && chatHistories.length === 0) {
            createNewChat();
        }
    }, [mode, currentChatId, chatHistories.length]);

    const getCurrentNoteContent = async (): Promise<string | null> => {
        const activeFile = plugin.app.workspace.getActiveFile();
        if (activeFile && activeFile.extension === 'md') {
            return await plugin.app.vault.read(activeFile);
        }
        return null;
    };

    const getAllNotes = async (): Promise<string[]> => {
        const files = plugin.app.vault.getFiles();
        const markdownFiles = files.filter(file => file.extension === 'md');
        const notes: string[] = [];
        
        for (const file of markdownFiles) {
            const content = await plugin.app.vault.read(file);
            notes.push(`${file.basename}: ${content}`);
        }
        
        return notes;
    };

    const handleNoteSelectionApply = async (selectedNotes: string[]) => {
        setSelectedContextNotes(selectedNotes);
    };

    const sanitizeFileName = (fileName: string): string => {
        // Remove invalid characters: * " \ / < > : | ?
        let sanitized = fileName
            .replace(/[\*"\\/<>:|?]/g, '')  // Remove invalid chars
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .trim();                        // Remove leading/trailing spaces

        // If the name is empty after sanitization, use a default name
        if (!sanitized) {
            sanitized = 'New Note';
        }

        return sanitized;
    };

    const createUniqueFileName = async (baseFileName: string): Promise<string> => {
        let counter = 1;
        let sanitizedBase = sanitizeFileName(baseFileName);
        let fileName = `${sanitizedBase}.md`;
        
        while (plugin.app.vault.getAbstractFileByPath(fileName)) {
            fileName = `${sanitizedBase} ${counter}.md`;
            counter++;
        }
        
        return fileName;
    };

    const attachLinkHandlers = () => {
        // Handle internal links ([[Link]])
        const noteLinks = document.querySelectorAll('.message-content a.internal-link');
        noteLinks.forEach(link => {
            if (!link.hasAttribute('data-listener-attached')) {
                link.setAttribute('data-listener-attached', 'true');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = (link as HTMLAnchorElement).getAttribute('href');
                    if (href) {
                        const file = plugin.app.vault.getAbstractFileByPath(href + '.md');
                        if (file instanceof TFile) {
                            plugin.app.workspace.getLeaf(false).openFile(file);
                        }
                    }
                });
            }
        });

        // Handle tags (#tag)
        const tagLinks = document.querySelectorAll('.message-content a.tag');
        tagLinks.forEach(link => {
            if (!link.hasAttribute('data-listener-attached')) {
                link.setAttribute('data-listener-attached', 'true');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tag = (link as HTMLAnchorElement).getAttribute('href')?.replace('#', '');
                    if (tag) {
                        // Open the search view with the tag
                        const searchLeaf = plugin.app.workspace.getLeavesOfType('search')[0] || 
                                         plugin.app.workspace.getRightLeaf(false);
                        
                        searchLeaf.setViewState({
                            type: 'search',
                            state: { query: `tag:#${tag}` }
                        });

                        plugin.app.workspace.revealLeaf(searchLeaf);
                    }
                });
            }
        });
    };

    // Add effect to handle links whenever messages change
    React.useEffect(() => {
        attachLinkHandlers();
    }, [currentMessages, generateMessages]);

    const handleSend = async () => {
        if (!input.trim() || isGenerating) return;

        setShowExplanation(false);
        console.log('Starting note generation process...');

        const userMessage: ChatMessage = {
            role: 'user',
            content: input
        };

        const messages = mode === 'chat' ? currentMessages : generateMessages;
        const setMessages = mode === 'chat' ? updateCurrentChat : setGenerateMessages;

        setMessages([...messages, userMessage]);
        setInput('');
        setIsGenerating(true);

        try {
            let response: string;
            
            if (mode === 'chat') {
                let context = '';
                if (selectedContextNotes.length > 0) {
                    const selectedNotesContent = await Promise.all(
                        selectedContextNotes.map(async (path) => {
                            const file = plugin.app.vault.getAbstractFileByPath(path);
                            if (file instanceof TFile) {
                                const content = await plugin.app.vault.read(file);
                                return `${file.basename}: ${content}`;
                            }
                            return '';
                        })
                    );
                    context = selectedNotesContent.join('\n\n');
                } else {
                    const currentNote = await getCurrentNoteContent();
                    if (!currentNote) {
                        throw new Error('No active note or selected notes found');
                    }
                    context = currentNote;
                }
                response = await geminiService.chat(input, context);
            } else {
                console.log('Getting all notes...');
                const notes = await getAllNotes();
                let selectedNotesContent: string[] = [];
                
                if (selectedContextNotes.length > 0) {
                    console.log('Processing selected context notes...');
                    selectedNotesContent = await Promise.all(
                        selectedContextNotes.map(async (path) => {
                            const file = plugin.app.vault.getAbstractFileByPath(path);
                            if (file instanceof TFile) {
                                const content = await plugin.app.vault.read(file);
                                return `${file.basename}: ${content}`;
                            }
                            return '';
                        })
                    );
                    console.log('Context notes processed successfully');
                }
                
                console.log('Calling geminiService.generateNote...');
                const { title, content } = await geminiService.generateNote(
                    input, 
                    notes,
                    selectedContextNotes.length > 0 ? selectedNotesContent : undefined
                );
                console.log('Note generated successfully');
                
                console.log('Creating new file...');
                const fileName = await createUniqueFileName(title);
                await plugin.app.vault.create(fileName, content);
                console.log('File created successfully');

                response = `Note created: [[${fileName.replace('.md', '')}]]\n\n${content}`;
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response
            };

            setMessages([...messages, userMessage, assistantMessage]);
            console.log('Process completed successfully');
        } catch (error) {
            console.error('Error in handleSend:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Sorry, there was an error. Please try again.'
            };
            setMessages([...messages, userMessage, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        const leaves = plugin.app.workspace.getLeavesOfType(NOTE_GENERATOR_VIEW);
        if (leaves.length > 0) {
            leaves[0].detach();
        }
    };

    const handleModeChange = (newMode: 'chat' | 'generate') => {
        setMode(newMode);
        setInput('');
        if (newMode === 'chat' && !currentChatId) {
            createNewChat();
        }
    };

    const handleClearChat = () => {
        if (mode === 'chat') {
            updateCurrentChat([]);
        } else {
            setGenerateMessages([]);
        }
        setShowExplanation(true);
    };

    const handleCustomPromptChange = (prompt: string | null) => {
        setCustomSystemPrompt(prompt);
        if (prompt !== null) {
            geminiService.setCustomSystemPrompt(prompt);
        } else {
            geminiService.resetSystemPrompt();
        }
    };

    return (
        <div className="note-generator-view">
            <div className="chat-container">
                <div className="chat-header">
                    <div className="mode-selector">
                        <button
                            className={`mode-button ${mode === 'chat' ? 'active' : ''}`}
                            onClick={() => handleModeChange('chat')}
                        >
                            💬 Chat Mode
                        </button>
                        <button
                            className={`mode-button ${mode === 'generate' ? 'active' : ''}`}
                            onClick={() => handleModeChange('generate')}
                        >
                            📝 Generate Mode
                        </button>
                    </div>
                    <button className="close-button" onClick={handleClose}>✕</button>
                </div>

                {mode === 'chat' && (
                    <ChatHistoryPills
                        histories={chatHistories}
                        currentId={currentChatId}
                        onSelect={switchToChat}
                        onNew={createNewChat}
                        onDelete={deleteChat}
                    />
                )}

                <div className="messages-container">
                    {showExplanation && mode === 'chat' && (
                        <div className="explanation-message">
                            <p>Welcome to Note Generator! Here you can:</p>
                            <ul>
                                <li>Ask questions about your notes</li>
                                <li>Get summaries and insights</li>
                                <li>Connect information across notes</li>
                            </ul>
                            <p>Use the "Add Context" button to select specific notes for your query.</p>
                        </div>
                    )}
                    {showExplanation && mode === 'generate' && (
                        <div className="explanation-message">
                            <p>Welcome to Note Generator! Here you can:</p>
                            <ul>
                                <li>Generate new notes based on your descriptions</li>
                                <li>Create structured content automatically</li>
                                <li>Link to existing notes for context</li>
                            </ul>
                            <p>Use the "Add Context" button to select notes that should influence the generation.</p>
                        </div>
                    )}

                    {(mode === 'chat' ? currentMessages : generateMessages).map((message, index) => (
                        <div key={index} className={`message ${message.role}`}>
                            <div className="message-header">
                                {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
                            </div>
                            <MessageContent content={message.content} plugin={plugin} />
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <InputArea
                    input={input}
                    setInput={setInput}
                    isGenerating={isGenerating}
                    mode={mode}
                    selectedContextNotes={selectedContextNotes}
                    onSend={handleSend}
                    onClearChat={handleClearChat}
                    onOpenNoteSelection={() => setIsNoteSelectionOpen(true)}
                    onCustomPromptChange={handleCustomPromptChange}
                />
            </div>

            <NoteSelectionModal
                isOpen={isNoteSelectionOpen}
                onClose={() => setIsNoteSelectionOpen(false)}
                onApply={handleNoteSelectionApply}
                files={plugin.app.vault.getFiles().filter(file => file.extension === 'md')}
                selectedPaths={selectedContextNotes}
            />
        </div>
    );
}; 