import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../services/api';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: 'Hi! I am RailBot, your AI assistant for Indian Railways. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages: Message[] = [
            ...messages,
            { id: Date.now().toString(), role: 'user', text: userMessage }
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Include conversation history up to the last 10 messages (excluding the default intro if we want)
            const history = newMessages.slice(1, -1).map(m => ({
                role: m.role,
                text: m.text
            }));

            const res = await api.post(`/chat`, {
                message: userMessage,
                history
            });

            if (res.data.success) {
                setMessages(prev => [
                    ...prev,
                    { id: Date.now().toString(), role: 'model', text: res.data.response }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    { id: Date.now().toString(), role: 'model', text: 'Sorry, I encountered an error. Please try again later.' }
                ]);
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            const errorText = error.response?.data?.error || 'Oops! I am having trouble connecting to my servers right now. Please try again later.';
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), role: 'model', text: errorText }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 active:scale-95",
                    isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )}
            >
                <MessageCircle className="h-6 w-6" />
            </button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[400px] h-[600px] max-h-[85vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
                    isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="bg-slate-900 border-b border-border/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Bot className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">RailBot</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">AI Powered</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start gap-3 max-w-[85%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-1",
                                msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div
                                className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-slate-900 text-white rounded-tr-sm shadow-sm"
                                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm"
                                )}
                            >
                                {/* Format newlines nicely */}
                                {msg.text.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i !== msg.text.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3 max-w-[85%] mr-auto">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-1">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm flex items-center gap-1.5">
                                <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-border/50">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full h-12 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm shadow-inner transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-colors hover:bg-blue-700"
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
