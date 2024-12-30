import { useCallback } from 'react';
import { MarkdownRenderer } from 'obsidian';
import NoteGeneratorPlugin from '../main';

export const useMarkdownRenderer = (plugin: NoteGeneratorPlugin) => {
    const renderMarkdown = useCallback(async (
        content: string,
        container: HTMLElement
    ) => {
        try {
            container.empty();
            await MarkdownRenderer.renderMarkdown(
                content,
                container,
                '',
                plugin
            );
        } catch (error) {
            console.error('Error rendering markdown:', error);
            container.textContent = content;
        }
    }, [plugin]);

    return renderMarkdown;
}; 