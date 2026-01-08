"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getRagSessions, getRagSessionHistory, chatRag } from "@/lib/api";

export default function DocChatPage() {
    const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Load Sessions on Mount
    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            const list = await getRagSessions();
            setSessions(list);
            if (list.length > 0 && !currentSessionId) {
                // Optionally load most recent? No, start new by default or let user choose.
            }
        } catch (e) {
            console.error("Failed to load sessions", e);
        }
    }

    const loadSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        try {
            const history = await getRagSessionHistory(sessionId);
            setMessages(history);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        
        // Manual fetch for file upload with headers
        const userStr = localStorage.getItem("user");
        const headers: any = {};
        if (userStr) {
            const u = JSON.parse(userStr);
            headers["x-user-id"] = u.id.toString();
            headers["x-user-email"] = u.email;
        }

        try {
            const res = await fetch("http://localhost:8000/rag/upload", {
                method: "POST",
                body: formData,
                headers
            });
            if (res.ok) {
                alert("Document uploaded! You can now ask questions about it.");
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setProcessing(true);
        
        try {
            // Pass currentSessionId (if null, backend creates new)
            const data = await chatRag(userMsg, currentSessionId || undefined);
            
            setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
            
            // If this was a new session, backend returns the new ID. Set it.
            if (!currentSessionId && data.session_id) {
                setCurrentSessionId(data.session_id);
                loadSessions(); // Refresh sidebar list
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: "Error connecting to AI." }]);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex gap-8 h-[calc(100vh-100px)]">
                    
                    {/* Sidebar: History */}
                    <div className="w-64 flex flex-col gap-4">
                        <button 
                            onClick={handleNewChat}
                            className="bg-brand text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
                        >
                            <span>+</span> New Chat
                        </button>
                        
                        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase p-2 mb-1">Recent Chats</h3>
                            {sessions.length === 0 ? (
                                <p className="text-xs text-slate-400 p-2 italic">No history yet.</p>
                            ) : (
                                <div className="space-y-1">
                                    {sessions.map((s) => (
                                        <button
                                            key={s.session_id}
                                            onClick={() => loadSession(s.session_id)}
                                            className={`w-full text-left p-3 rounded-lg text-sm transition-colors truncate ${currentSessionId === s.session_id ? 'bg-brand/10 text-brand font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            {s.title || "New Conversation"}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h2 className="font-bold text-slate-800">
                                {currentSessionId ? "Current Conversation" : "New Conversation"}
                            </h2>
                            <label className={`text-xs font-bold text-brand cursor-pointer hover:underline ${uploading ? 'opacity-50' : ''}`}>
                                {uploading ? "Uploading..." : "+ Upload PDF Context"}
                                <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={uploading} />
                            </label>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 mt-32">
                                    <div className="text-4xl mb-4">💬</div>
                                    <p className="font-medium text-slate-600">Ask questions about your documents.</p>
                                    <p className="text-sm mt-2">Upload a PDF or start typing to search your knowledge base.</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {processing && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleChat} className="flex gap-2">
                                <input 
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                                    placeholder="Type your question..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                />
                                <button disabled={processing} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg">
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}