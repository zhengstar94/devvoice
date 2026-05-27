'use client';

import { useState, useEffect } from 'react';

type StyleKey = 'daily' | 'star' | 'email' | 'jira';

type HistoryItem = {
  id: string;
  input: string;
  results: Record<StyleKey, string>;
  timestamp: number;
};

const STYLE_LABELS: Record<StyleKey, string> = {
  daily: 'Daily Standup',
  star: '面试 STAR',
  email: '邮件/Slack',
  jira: 'Jira Comment',
};

const STYLE_COLORS: Record<StyleKey, string> = {
  daily: 'bg-blue-50 border-blue-200',
  star: 'bg-green-50 border-green-200',
  email: 'bg-purple-50 border-purple-200',
  jira: 'bg-orange-50 border-orange-200',
};

const STORAGE_KEY = 'devvoice_history';
const MAX_ITEMS = 20;

function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveHistory(history: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function deleteHistoryItem(id: string) {
  const history = getHistory();
  const updated = history.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number = 40): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

interface HistorySidebarProps {
  onSelect: (item: HistoryItem) => void;
  selectedId?: string;
}

export default function HistorySidebar({ onSelect, selectedId }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());

    const handleUpdate = () => setHistory(getHistory());
    window.addEventListener('historyUpdated', handleUpdate);
    return () => window.removeEventListener('historyUpdated', handleUpdate);
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">History</h2>
        {history.length === 0 ? (
          <p className="text-xs text-zinc-400">No history yet</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id} className="group relative">
                <button
                  onClick={() => onSelect(item)}
                  className={`w-full text-left rounded p-2 pr-8 text-xs transition-colors ${
                    selectedId === item.id
                      ? 'bg-zinc-200 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-medium text-zinc-800">
                    {truncateText(item.input)}
                  </p>
                  <p className="mt-1 text-zinc-400">{formatTime(item.timestamp)}</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistory(deleteHistoryItem(item.id));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600"
                  aria-label="Delete"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {history.length > 0 && (
        <div className="border-t border-zinc-200 p-4">
          <button
            onClick={handleClear}
            className="w-full rounded bg-red-50 py-2 text-xs text-red-600 hover:bg-red-100"
          >
            Clear All
          </button>
        </div>
      )}
    </aside>
  );
}

export { type HistoryItem };