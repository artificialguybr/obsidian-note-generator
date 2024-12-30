import * as React from 'react';
import { ChatHistoryPillsProps } from '../types/interfaces';

export const ChatHistoryPills: React.FC<ChatHistoryPillsProps> = ({ 
    histories, 
    currentId, 
    onSelect, 
    onNew, 
    onDelete 
}) => {
    const pillsRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(0);

    // Handle mouse wheel scrolling
    const handleWheel = (e: WheelEvent) => {
        if (pillsRef.current) {
            e.preventDefault();
            pillsRef.current.scrollLeft += e.deltaY;
        }
    };

    // Handle mouse drag scrolling
    const handleMouseDown = (e: React.MouseEvent) => {
        if (pillsRef.current) {
            setIsDragging(true);
            setStartX(e.pageX - pillsRef.current.offsetLeft);
            setScrollLeft(pillsRef.current.scrollLeft);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !pillsRef.current) return;
        e.preventDefault();
        const x = e.pageX - pillsRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        pillsRef.current.scrollLeft = scrollLeft - walk;
    };

    React.useEffect(() => {
        const pillsElement = pillsRef.current;
        if (pillsElement) {
            pillsElement.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (pillsElement) {
                pillsElement.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    return (
        <div 
            ref={pillsRef}
            className="chat-history-pills"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            <button className="new-chat-button" onClick={onNew}>
                + New Chat
            </button>
            {histories.map((chat) => (
                <div key={chat.id} className="chat-pill-wrapper">
                    <button
                        className={`chat-pill ${chat.id === currentId ? 'active' : ''}`}
                        onClick={() => onSelect(chat.id)}
                    >
                        {chat.title}
                    </button>
                    <button
                        className="delete-chat-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(chat.id);
                        }}
                        title="Delete chat"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}; 