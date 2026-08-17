"use client";

import { useEffect, useState } from "react";
import { Mail, MailOpen, MessageSquare, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageTitle } from "@/components/admin/ui";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const { showToast } = useShop();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<{ messages: Message[] }>("/api/admin/messages");
      setMessages(res.messages);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      await api(`/api/admin/messages?id=${id}`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await api(`/api/admin/messages?id=${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      showToast("Message deleted");
    } catch (err: any) {
      showToast(err.message || "Could not delete message", "error");
    }
  };

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <PageTitle title="Contact Messages" subtitle={`${unread} unread of ${messages.length} total`} />

      <div className="space-y-3">
        {loading ? (
          <p className="py-10 text-center text-gray-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-10 text-center text-gray-400">
            <MessageSquare className="h-5 w-5" /> No messages yet.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`rounded-xl border bg-white p-5 shadow-sm ${m.isRead ? "border-gray-200" : "border-brand-300 ring-1 ring-brand-100"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {m.isRead ? <MailOpen className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-brand-600" />}
                    <p className="font-semibold text-gray-900">{m.subject}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{m.name}</span> · {m.email} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!m.isRead && (
                    <button onClick={() => markRead(m.id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      Mark as read
                    </button>
                  )}
                  <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">
                    Reply
                  </a>
                  <button onClick={() => remove(m.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-500 hover:bg-red-50" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{m.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}