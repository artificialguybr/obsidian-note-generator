import { useState, useEffect } from 'react';
import { ChatHistory, ChatMessage } from '../types/interfaces';

export const useChatHistory = () => {
    const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);

    // Load chat histories from local storage
    useEffect(() => {
        const loadChatHistories = () => {
            const savedHistories = localStorage.getItem('chat_histories');
            if (savedHistories) {
                setChatHistories(JSON.parse(savedHistories));
            }
        };
        loadChatHistories();
    }, []);

    // Save chat histories to local storage
    useEffect(() => {
        if (chatHistories.length > 0) {
            const nonEmptyChats = chatHistories.filter(chat => chat.messages.length > 0);
            if (nonEmptyChats.length > 0) {
                localStorage.setItem('chat_histories', JSON.stringify(nonEmptyChats));
            } else {
                localStorage.removeItem('chat_histories');
            }
        } else {
            localStorage.removeItem('chat_histories');
        }
    }, [chatHistories]);

    const createNewChat = () => {
        const newChat: ChatHistory = {
            id: Date.now().toString(),
            title: 'Nova conversa',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setChatHistories(prev => [...prev, newChat]);
        setCurrentChatId(newChat.id);
        setCurrentMessages([]);
        return newChat.id;
    };

    const switchToChat = (chatId: string) => {
        const chat = chatHistories.find(h => h.id === chatId);
        if (chat) {
            setCurrentChatId(chatId);
            setCurrentMessages(chat.messages);
        }
    };

    const updateCurrentChat = (messages: ChatMessage[]) => {
        if (currentChatId) {
            setChatHistories(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    const title = messages[0]?.content
                        .split(' ')
                        .slice(0, 3)
                        .join(' ')
                        .concat('...');

                    return {
                        ...chat,
                        messages,
                        updatedAt: Date.now(),
                        title: title || chat.title
                    };
                }
                return chat;
            }));
            setCurrentMessages(messages);
        }
    };

    const deleteChat = (chatId: string) => {
        setChatHistories(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
            const remainingChats = chatHistories.filter(chat => chat.id !== chatId);
            if (remainingChats.length > 0) {
                const mostRecentChat = remainingChats.reduce((latest, chat) => 
                    chat.updatedAt > latest.updatedAt ? chat : latest
                );
                switchToChat(mostRecentChat.id);
            } else {
                createNewChat();
            }
        }
    };

    return {
        chatHistories,
        currentChatId,
        currentMessages,
        createNewChat,
        switchToChat,
        updateCurrentChat,
        deleteChat
    };
}; 