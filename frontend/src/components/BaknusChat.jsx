import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';

const BaknusChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Halo! Saya Baknus AI. Ada yang bisa saya bantu seputar informasi SMK Bakti Nusantara 666 atau pendaftaran SPMB?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Sedang mempersiapkan AI Baknus...');
    const [questionCount, setQuestionCount] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const savedCount = localStorage.getItem('baknus_chat_count');
        const savedDate = localStorage.getItem('baknus_chat_date');
        const today = new Date().toDateString();

        if (savedDate !== today) {
            localStorage.setItem('baknus_chat_count', '0');
            localStorage.setItem('baknus_chat_date', today);
            setQuestionCount(0);
        } else {
            setQuestionCount(parseInt(savedCount || '0'));
        }
    }, []);

    useEffect(() => {
        let interval;
        if (loading) {
            const texts = [
                'Sedang mempersiapkan AI Baknus...',
                'AI Baknus sedang bekerja...',
                'Mohon tunggu sebentar...'
            ];
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % texts.length;
                setLoadingText(texts[i]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        if (questionCount >= 5) {
            setMessages(prev => [...prev, 
                { role: 'user', content: message },
                { role: 'assistant', content: 'Maaf, Anda telah mencapai batas 5 pertanyaan untuk hari ini. Silakan hubungi admin via WhatsApp untuk informasi lebih lanjut.' }
            ]);
            setMessage('');
            return;
        }

        const userMsg = { role: 'user', content: message };
        // Add user message AND an empty assistant message to populate chunk-by-chunk
        setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
        setMessage('');
        setLoading(true);

        let accumulatedReply = '';

        try {
            const token = localStorage.getItem('token');
            const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/ask`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Save the last partial line back to buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const cleanedLine = line.trim();
                    if (cleanedLine.startsWith('data:')) {
                        try {
                            const data = JSON.parse(cleanedLine.substring(5).trim());
                            if (data.token) {
                                accumulatedReply += data.token;
                                // Update the last assistant message in real-time
                                setMessages(prev => {
                                    const updated = [...prev];
                                    if (updated.length > 0) {
                                        updated[updated.length - 1] = { role: 'assistant', content: accumulatedReply };
                                    }
                                    return updated;
                                });
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            console.error("Error parsing stream line:", e);
                        }
                    }
                }
            }

            const newCount = questionCount + 1;
            setQuestionCount(newCount);
            localStorage.setItem('baknus_chat_count', newCount.toString());

        } catch (error) {
            console.error("Streaming error:", error);
            // Replace the last empty assistant bubble with the error message
            setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1] = { role: 'assistant', content: 'Maaf, sistem AI sedang mengalami gangguan. Silakan coba lagi nanti.' };
                }
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl w-80 md:w-96 mb-4 overflow-hidden border border-gray-100 flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-blue-600 p-4 text-white flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Baknus AI</h3>
                                    <p className="text-[10px] text-blue-100">Asisten Virtual Sekolah</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-xs text-gray-500 italic animate-pulse">{loadingText}</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Limit Indicator */}
                        <div className="px-4 py-2 bg-blue-50 flex items-center justify-between text-[10px] text-blue-600 font-bold border-t border-blue-100">
                            <span className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Kuota: {5 - questionCount} Pertanyaan Tersisa
                            </span>
                            <span>Hari Ini</span>
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={questionCount >= 5 ? "Batas tercapai..." : "Tanya sesuatu..."}
                                disabled={questionCount >= 5 || loading}
                                className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50"
                            />
                            <button 
                                type="submit" 
                                disabled={questionCount >= 5 || loading || !message.trim()}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
                    isOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                } border-2 border-white/50 backdrop-blur-sm`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                {!isOpen && questionCount < 5 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        1
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default BaknusChat;
