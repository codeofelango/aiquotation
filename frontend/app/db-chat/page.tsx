"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { chatDb } from "@/lib/api"; 

interface Message {
    role: 'user' | 'bot';
    content: string;
    sql?: string;
    data?: any[];
}

export default function DbChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
           // check for existing session or just start clean
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        setInput(""); // Clear immediately
        
        const userMsg: Message = { role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const data = await chatDb(userText, sessionId);
            
            if (data.session_id) setSessionId(data.session_id);
            
            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.response,
                sql: data.sql,
                data: data.data
            }]);
        } catch (err: any) {
            console.error("Chat DB Error:", err);
            // Show the actual error message from backend if available
            const errorMsg = err.message || "Failed to connect to database agent.";
            setMessages(prev => [...prev, { 
                role: 'bot', 
                content: `Error: ${errorMsg}\n\nPlease check:\n1. Backend is running\n2. Database is connected\n3. 'db_chat_history' table exists` 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            {/* FIXED LAYOUT STRUCTURE:
              1. Outer Container: h-screen, fixed, no scroll.
              2. Navbar at top.
              3. Inner Content: Flex column, takes remaining height.
            */}
            <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
                {/* Navbar is strictly at the top, typically ~64px */}
                <div className="flex-none z-50">
                    <Navbar />
                </div>
                
                {/* Main Content Area - Fills remaining vertical space */}
                <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto overflow-hidden">
                    
                    {/* Header Strip */}
                    <div className="flex-none px-6 py-4 flex justify-between items-center border-b border-slate-200 bg-slate-50/90 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                                📊
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-800 text-lg">Data Analysis Agent</h1>
                                <p className="text-xs text-slate-500 font-medium">PostgreSQL • Live Connection</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => {setMessages([]); setSessionId(null);}} 
                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                New Analysis
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages - SCROLLABLE AREA */}
                    {/* This div takes all available space and scrolls internally */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-slate-50">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-4xl">🤖</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">How can I help with your data?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
                                    {["Show me the top 5 selling products", "How many new users this week?", "List opportunities > $10k", "Analyze customer retention"].map((q, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setInput(q)}
                                            className="p-4 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md rounded-xl text-left text-sm text-slate-600 transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                                <div className={`max-w-[90%] md:max-w-[80%] p-4 rounded-2xl text-sm leading-7 shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>

                                {/* Data Artifacts (Bot Only) */}
                                {msg.role === 'bot' && msg.sql && (
                                    <div className="mt-3 w-full max-w-[90%] md:max-w-[80%] bg-slate-900 rounded-xl overflow-hidden shadow-lg ring-1 ring-slate-900/5">
                                        
                                        {/* SQL Toggle / Header */}
                                        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Generated SQL</span>
                                            <span className="text-[10px] text-slate-600">Read-Only</span>
                                        </div>
                                        <div className="p-4 bg-[#0d1117] overflow-x-auto">
                                            <code className="text-xs font-mono text-green-400 block whitespace-pre">{msg.sql}</code>
                                        </div>

                                        {/* Results Table */}
                                        {msg.data && msg.data.length > 0 && (
                                            <div className="border-t border-slate-800">
                                                <div className="px-4 py-2 bg-slate-800/50 flex justify-between items-center">
                                                     <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">Query Results ({msg.data.length} rows)</span>
                                                </div>
                                                <div className="overflow-x-auto max-h-[400px]">
                                                    <table className="w-full text-left text-xs text-slate-300">
                                                        <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-sm">
                                                            <tr>
                                                                {Object.keys(msg.data[0]).map(k => (
                                                                    <th key={k} className="px-4 py-3 font-semibold whitespace-nowrap border-b border-slate-700">{k}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800">
                                                            {msg.data.map((row: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                                    {Object.values(row).map((val: any, vIdx) => (
                                                                        <td key={vIdx} className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-400">
                                                                            {val === null ? <span className="text-slate-600">null</span> : String(val).substring(0, 100)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        {msg.data && msg.data.length === 0 && (
                                            <div className="p-4 text-center text-slate-500 text-xs italic">Query executed successfully but returned no data.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl w-fit">
                                <LoadingSpinner size="sm" />
                                <span className="text-slate-500 text-sm animate-pulse">Running analysis on PostgreSQL...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - FIXED AT BOTTOM */}
                    <div className="flex-none p-4 bg-white border-t border-slate-200 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] z-10">
                        <form onSubmit={handleSend} className="relative max-w-5xl mx-auto flex items-end gap-2">
                             <div className="relative flex-1">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="Ask a question about your data..."
                                    className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none shadow-sm min-h-[56px] max-h-32 text-slate-700 placeholder:text-slate-400"
                                    rows={1}
                                />
                             </div>
                            <button 
                                type="submit" 
                                disabled={loading || !input.trim()}
                                className="flex-none h-[56px] px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center"
                            >
                                <span className="hidden sm:inline">Analyze</span>
                                <span className="sm:hidden">➤</span>
                            </button>
                        </form>
                        <div className="text-center mt-2">
                             <p className="text-[10px] text-slate-400">AI can make mistakes. Verify critical data.</p>
                        </div>
                    </div>

                </div>
            </div>
        </AuthGuard>
    );
}