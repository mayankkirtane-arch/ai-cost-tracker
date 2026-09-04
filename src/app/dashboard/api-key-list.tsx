"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddKeyForm } from "./add-key-form";

type ApiKey = {
  id: string;
  provider: string;
  label: string | null;
  key_hint: string;
  created_at: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Claude (Anthropic)",
  groq: "Groq",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-100 text-green-700",
  anthropic: "bg-orange-100 text-orange-700",
  groq: "bg-purple-100 text-purple-700",
};

export function ApiKeyList({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete key");
    } finally {
      setDeletingId(null);
    }
  };

  if (showForm) {
    return (
      <div className="flex justify-center">
        <AddKeyForm onClose={() => setShowForm(false)} />
      </div>
    );
  }

  if (initialKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connect your first API key to get started
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-md">
          Add an API key from OpenAI, Anthropic, or Groq to start tracking your
          usage and costs.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add API Key
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Key
        </button>
      </div>

      <div className="space-y-3">
        {initialKeys.map((key) => (
          <div
            key={key.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  PROVIDER_COLORS[key.provider] || "bg-gray-100 text-gray-700"
                }`}
              >
                {PROVIDER_LABELS[key.provider] || key.provider}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600">
                    {"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + key.key_hint}
                  </span>
                  {key.label && (
                    <span className="text-xs text-gray-400">{key.label}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Added {new Date(key.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDelete(key.id)}
              disabled={deletingId === key.id}
              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete key"
            >
              {deletingId === key.id ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
