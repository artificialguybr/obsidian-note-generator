import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NoteGeneratorSettings } from '../main';
import { chatModePrompt } from '../prompts/chatMode';
import { noteModePrompt } from '../prompts/noteMode';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private settings: NoteGeneratorSettings;
    private chatSession: any;
    private noteSession: any;
    private customSystemPrompt: string | null = null;

    constructor(settings: NoteGeneratorSettings) {
        this.settings = settings;
        this.genAI = new GoogleGenerativeAI(settings.apiKey);
        this.initializeChatSession();
        this.initializeNoteSession();
    }

    private getModel(systemInstruction?: string) {
        return this.genAI.getGenerativeModel({
            model: this.settings.geminiModel,
            systemInstruction: this.customSystemPrompt || systemInstruction,
        });
    }

    private getGenerationConfig() {
        return {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        };
    }

    setCustomSystemPrompt(prompt: string) {
        this.customSystemPrompt = prompt;
        this.initializeChatSession();
        this.initializeNoteSession();
    }

    resetSystemPrompt() {
        this.customSystemPrompt = null;
        this.initializeChatSession();
        this.initializeNoteSession();
    }

    private initializeChatSession() {
        const model = this.getModel(chatModePrompt);
        this.chatSession = model.startChat({
            generationConfig: this.getGenerationConfig(),
            history: [],
        });
    }

    private initializeNoteSession() {
        const model = this.getModel(noteModePrompt);
        this.noteSession = model.startChat({
            generationConfig: this.getGenerationConfig(),
            history: [],
        });
    }

    async chat(input: string, context: string): Promise<string> {
        try {
            if (!this.chatSession) {
                this.initializeChatSession();
            }

            const message = `Context from notes:\n${context}\n\nQuestion: ${input}`;
            const result = await this.chatSession.sendMessage(message);
            return result.response.text();
        } catch (error) {
            console.error('Error in chat:', error);
            throw new Error('Failed to get response from Gemini. Please check your API key and try again.');
        }
    }

    async generateNote(input: string, existingNotes: string[], contextNotes?: string[]): Promise<{ title: string, content: string }> {
        try {
            console.log('GeminiService: Starting note generation...');
            
            if (!this.noteSession) {
                console.log('GeminiService: Initializing note session...');
                this.initializeNoteSession();
            }

            // Extract just the titles for linking when no context is selected
            const noteTitles = existingNotes.map(note => {
                const titleMatch = note.match(/^([^:]+):/);
                return titleMatch ? titleMatch[1] : '';
            }).filter(Boolean);

            // Extract existing tags from notes
            const existingTags = new Set<string>();
            existingNotes.forEach(note => {
                const matches = note.match(/#[\w-]+/g);
                if (matches) {
                    matches.forEach(tag => existingTags.add(tag));
                }
            });
            const tagsString = Array.from(existingTags).join(' ');

            let message: string;
            
            if (contextNotes && contextNotes.length > 0) {
                const selectedContext = contextNotes.join('\n\n');
                console.log('GeminiService: Using selected context notes:', contextNotes.length, 'notes');
                message = `Using the following notes as context:\n${selectedContext}\n\nExisting tags in your vault: ${tagsString}\n\nPlease generate a note based on this request: ${input}`;
            } else {
                const titlesForLinking = noteTitles.join(', ');
                console.log('GeminiService: No context selected, using only note titles for linking');
                message = `Available notes for linking: [[${titlesForLinking}]]\n\nExisting tags in your vault: ${tagsString}\n\nPlease generate a new note based on this request: ${input}. Use double brackets [[]] to link to relevant existing notes when appropriate.`;
            }
            
            console.log('GeminiService: Full message to API:', {
                messageLength: message.length,
                input,
                contextType: contextNotes && contextNotes.length > 0 ? 'selected notes' : 'titles only',
                numberOfNotes: contextNotes?.length || noteTitles.length,
                numberOfTags: existingTags.size,
                firstFewChars: message.substring(0, 500) + '...',
                lastFewChars: '...' + message.substring(message.length - 500)
            });

            console.log('GeminiService: Sending message to API...');
            const result = await this.noteSession.sendMessage(message);
            const response = result.response.text();
            console.log('GeminiService: Received response from API');

            // Process the response to extract title and content
            const lines = response.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(2).join('\n').trim(); // Skip the title and the blank line

            // Remove any wrapping code blocks
            const cleanContent = content.replace(/^```markdown\n/, '').replace(/\n```$/, '');
            
            return { title, content: cleanContent };
        } catch (error) {
            console.error('GeminiService Error:', error);
            console.error('GeminiService Error details:', {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw new Error('Failed to generate note. Please check your API key and try again.');
        }
    }
} 