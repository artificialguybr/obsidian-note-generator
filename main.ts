import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, Notice } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ChatView } from './ChatView';

export const NOTE_GENERATOR_VIEW = "note-generator-view";

export interface NoteGeneratorSettings {
    apiKey: string;
    geminiModel: 'gemini-2.0-flash-exp' | 'gemini-1.5-flash' | 'gemini-1.5-flash-8b' | 'gemini-1.5-pro';
}

export const DEFAULT_SETTINGS: NoteGeneratorSettings = {
    apiKey: '',
    geminiModel: 'gemini-2.0-flash-exp'
}

export default class NoteGeneratorPlugin extends Plugin {
    settings: NoteGeneratorSettings;

    async onload() {
        await this.loadSettings();

        // Register Custom View
        this.registerView(
            NOTE_GENERATOR_VIEW,
            (leaf) => new NoteGeneratorView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('message-square', 'Note Generator', async () => {
            if (!this.settings.apiKey) {
                new Notice('Please set your Gemini API key in the plugin settings first.');
                this.openSettings();
                return;
            }
            await this.activateView();
        });

        // Add settings tab
        this.addSettingTab(new NoteGeneratorSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(NOTE_GENERATOR_VIEW);
        
        if (leaves.length > 0) {
            // View already exists, show it
            leaf = leaves[0];
        } else {
            // Create new leaf
            leaf = workspace.getRightLeaf(false);
        }

        if (leaf) {
            await leaf.setViewState({
                type: NOTE_GENERATOR_VIEW,
                active: true,
            });
            workspace.revealLeaf(leaf);
        }
    }

    async openSettings() {
        new Notice('Please enter your Gemini API key in the plugin settings (Settings -> Community Plugins -> Note Generator -> Settings)');
    }
}

class NoteGeneratorView extends ItemView {
    plugin: NoteGeneratorPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: NoteGeneratorPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return NOTE_GENERATOR_VIEW;
    }

    getDisplayText(): string {
        return "Note Generator";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("div", { attr: { id: "note-generator-root" } });
        
        ReactDOM.render(
            React.createElement(ChatView, { plugin: this.plugin }),
            container.querySelector("#note-generator-root")
        );
    }

    async onClose() {
        ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    }
}

class NoteGeneratorSettingTab extends PluginSettingTab {
    plugin: NoteGeneratorPlugin;

    constructor(app: App, plugin: NoteGeneratorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Note Generator Settings' });

        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Enter your Gemini API key. You can get one from Google AI Studio.')
            .addText(text => text
                .setPlaceholder('Enter your API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Gemini Model')
            .setDesc('Select which Gemini model to use')
            .addDropdown(dropdown => dropdown
                .addOption('gemini-2.0-flash-exp', 'Gemini 2.0 Flash (Recommended) - Next gen features & multimodal')
                .addOption('gemini-1.5-flash', 'Gemini 1.5 Flash - Fast & versatile')
                .addOption('gemini-1.5-flash-8b', 'Gemini 1.5 Flash-8B - High volume tasks')
                .addOption('gemini-1.5-pro', 'Gemini 1.5 Pro - Complex reasoning')
                .setValue(this.plugin.settings.geminiModel)
                .onChange(async (value: 'gemini-2.0-flash-exp' | 'gemini-1.5-flash' | 'gemini-1.5-flash-8b' | 'gemini-1.5-pro') => {
                    this.plugin.settings.geminiModel = value;
                    await this.plugin.saveSettings();
                }));

        const linkDiv = containerEl.createEl('div', { cls: 'note-generator-settings-links' });
        
        linkDiv.createEl('a', {
            text: 'Get Gemini API Key',
            href: 'https://makersuite.google.com/app/apikey'
        });
    }
} 