"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type UsageLog = {
  id: string;
  provider: string;
  start_time: string | null;
  end_time: string | null;
  uncached_input_tokens: number;
  cache_read_input_tokens: number;
  output_tokens: number;
  raw_data: Record<string, unknown> | null;
  fetched_at: string;
  api_keys?: {
    provider: string;
    label: string | null;
    key_hint: string;
  } | null;
};

type FetchResult = {
  key_id: string;
  key_hint: string;
  status: "success" | "error";
  message?: string;
  record_count?: number;
};

export function UsageDisplay({ initialLogs }: { initialLogs: UsageLog[] }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FetchResult[] | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const router = useRouter();

  const handleSyncUsage = async () => {
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/usage/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setResults([
          {
            key_id: "error",
            key_hint: "",
            status: "error",
            message: data.error || "Failed to fetch usage data.",
          },
        ]);
      } else if (data.results) {
        setResults(data.results);
      }

      router.refresh();
    } catch (err: unknown) {
      setResults([
        {
          key_id: "error",
          key_hint: "",
          status: "error",
          message: err instanceof Error ? err.message : "Unexpected error during fetch",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      {/* Header & Sync Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              API Usage & Token Metrics
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Sync token consumption from supported providers (Claude Admin API).
            </p>
          </div>

          <button
            onClick={handleSyncUsage}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing Usage...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Usage
              </>
            )}
          </button>
        </div>

        {/* Sync Action Feedback Messages */}
        {results && (
          <div className="mt-4 space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm border ${
                  r.status === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-semibold">
                    {r.status === "success" ? "✓ Success" : "⚠️ Error"}:
                  </span>
                  <div>
                    {r.key_hint && (
                      <span className="font-mono mr-1">
                        [••••{r.key_hint}]
                      </span>
                    )}
                    {r.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Table / Cards */}
      {initialLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          <p>No usage logs stored yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Ensure you have added a Claude API key with Admin/Org permissions and click &quot;Sync Usage&quot; above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Fetched Usage Logs ({initialLogs.length})
            </h4>
            <span className="text-xs text-gray-400">
              Latest sync results
            </span>
          </div>

          <div className="divide-y divide-gray-200">
            {initialLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      Claude (Anthropic)
                    </span>
                    {log.api_keys?.key_hint && (
                      <span className="text-xs font-mono text-gray-500">
                        ••••{log.api_keys.key_hint}
                      </span>
                    )}
                    {log.api_keys?.label && (
                      <span className="text-xs text-gray-400">
                        ({log.api_keys.label})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Fetched: {new Date(log.fetched_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2.5 rounded-lg my-2 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Input Tokens</p>
                    <p className="text-sm font-semibold text-gray-800 font-mono">
                      {log.uncached_input_tokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cache Read</p>
                    <p className="text-sm font-semibold text-gray-800 font-mono">
                      {log.cache_read_input_tokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Output Tokens</p>
                    <p className="text-sm font-semibold text-gray-800 font-mono">
                      {log.output_tokens.toLocaleString()}
                    </p>
                  </div>
                </div>

                {log.start_time && (
                  <p className="text-xs text-gray-400">
                    Period: {new Date(log.start_time).toLocaleDateString()} —{" "}
                    {log.end_time ? new Date(log.end_time).toLocaleDateString() : "Now"}
                  </p>
                )}

                {/* Raw JSON toggle */}
                {log.raw_data && (
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setExpandedLogId(expandedLogId === log.id ? null : log.id)
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {expandedLogId === log.id ? "Hide Raw Data" : "View Raw Response"}
                    </button>
                    {expandedLogId === log.id && (
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto font-mono">
                        {JSON.stringify(log.raw_data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
