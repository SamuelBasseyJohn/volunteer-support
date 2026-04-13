"use client";
/**
 * VIEW LAYER — EventChat Component
 *
 * Provides a real-time chat interface for event communication.
 * Used by both organisations and confirmed volunteers.
 */

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

export default function EventChat({ eventId }: { eventId: string }) {
    const { data: session } = useSession();
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const trpcUtils = api.useUtils();

    const { data: messages, isLoading, error } = api.message.getEventChat.useQuery(
        { eventId },
        { refetchInterval: 5000 } // simple polling
    );

    const sendMessage = api.message.sendMessage.useMutation({
        onSuccess: () => {
            setMessage("");
            trpcUtils.message.getEventChat.invalidate({ eventId });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isLoading) return <div className="text-center p-4">Loading chat...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error.message}</div>;

    return (
        <div className="flex flex-col h-[500px] bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-600 text-white p-4 font-bold rounded-t-xl text-center">
                Event Group Chat
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages?.length === 0 ? (
                    <div className="text-center text-gray-500 my-auto">Start the conversation...</div>
                ) : (
                    messages?.map(msg => {
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="mb-1">
                                    <span className="text-xs text-gray-500 font-semibold">{msg.sender.name}</span>
                                    <span className={`ml-2 text-[10px] uppercase rounded px-1 text-white ${msg.sender.role === 'ORGANIZATION' ? 'bg-purple-500' : msg.sender.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-400'}`}>
                                        {msg.sender.role.substring(0, 3)}
                                    </span>
                                </div>
                                <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white pb-3 rounded-tr-none' : 'bg-white border border-gray-200 pb-3 rounded-tl-none'}`}>
                                    <p className="text-sm pb-1">{msg.text}</p>
                                    <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form 
                onSubmit={e => {
                    e.preventDefault();
                    if (!message.trim()) return;
                    sendMessage.mutate({ eventId, text: message });
                }}
                className="p-3 bg-white border-t border-gray-200 flex gap-2"
            >
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendMessage.isPending}
                />
                <button
                    type="submit"
                    disabled={sendMessage.isPending || !message.trim()}
                    className="bg-blue-600 text-white rounded-full px-6 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {sendMessage.isPending ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
}
