import * as React from 'react';
import { useRef, useEffect } from 'react';
import { MessageContentProps } from '../types/interfaces';
import { MarkdownRenderer } from 'obsidian';
import { CopyButton } from './CopyButton';

export const MessageContent: React.FC<MessageContentProps> = React.memo(({ content, plugin }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderMarkdown = async () => {
            if (contentRef.current) {
                contentRef.current.empty();
                try {
                    await MarkdownRenderer.renderMarkdown(
                        content,
                        contentRef.current,
                        '',
                        plugin
                    );
                } catch (error) {
                    console.error('Error rendering markdown:', error);
                    contentRef.current.textContent = content;
                }
            }
        };

        renderMarkdown();
    }, [content, plugin]);

    return (
        <div className="message-wrapper">
            <div ref={contentRef} className="message-content selectable" />
            <CopyButton content={content} />
        </div>
    );
}); 