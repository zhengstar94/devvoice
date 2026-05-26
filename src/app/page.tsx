'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import HistorySidebar, { type HistoryItem } from './components/HistorySidebar';

type StyleKey = 'daily' | 'star' | 'email' | 'jira';

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

const DEFAULT_PROMPTS: Record<StyleKey, string> = {
  daily: 'brief, 2-3 sentences, what I did yesterday, what I\'m doing today, any blockers',
  star: 'Situation, Task, Action, Result format, show your impact and skills',
  email: 'professional, appropriate for workplace communication',
  jira: 'technical, reference IDs, action-oriented, typically 1-2 sentences',
};

const STORAGE_KEY = 'devvoice_history';
const MAX_ITEMS = 20;

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Record<StyleKey, string>>({
    daily: '',
    star: '',
    email: '',
    jira: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<StyleKey | null>(null);
  const [prompts, setPrompts] = useState<Record<StyleKey, string>>({
    daily: '',
    star: '',
    email: '',
    jira: '',
  });
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResult({ daily: '', star: '', email: '', jira: '' });
    setSelectedHistoryId(undefined);

    try {
      const mergedPrompts: Record<StyleKey, string> = {
        daily: prompts.daily || DEFAULT_PROMPTS.daily,
        star: prompts.star || DEFAULT_PROMPTS.star,
        email: prompts.email || DEFAULT_PROMPTS.email,
        jira: prompts.jira || DEFAULT_PROMPTS.jira,
      };

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chineseText: input, prompts: mergedPrompts }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '处理失败');
      }

      const text = data.result;

      const headerMap: Record<string, StyleKey> = {
        'Daily Standup': 'daily',
        'Interview STAR': 'star',
        'Email/Slack': 'email',
        'Jira Comment': 'jira',
      };

      const parsed: Record<StyleKey, string> = {
        daily: '',
        star: '',
        email: '',
        jira: '',
      };

      const headers = ['Daily Standup', 'Interview STAR', 'Email/Slack', 'Jira Comment'];

      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const marker = `**${header}:**`;
        const idx = text.indexOf(marker);
        if (idx === -1) continue;

        const contentStart = idx + marker.length;
        const nextMarker = headers[i + 1] ? `**${headers[i + 1]}:**` : null;
        const nextIdx = nextMarker ? text.indexOf(nextMarker) : -1;
        const endIdx = nextIdx === -1 ? text.length : nextIdx;

        const content = text.substring(contentStart, endIdx).trim().replace(/\n---\n[\s\S]*$/g, '');
        const key = headerMap[header];
        if (key && content) {
          parsed[key] = content;
        }
      }

      if (!parsed.daily && !parsed.star && !parsed.email && !parsed.jira) {
        throw new Error('解析结果失败');
      }

      setResult(parsed);
      saveHistory(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = (parsed: Record<StyleKey, string>) => {
    const history = getHistory();
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      input,
      results: parsed,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedHistoryId(newItem.id);
    window.dispatchEvent(new Event('historyUpdated'));
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.input);
    setResult(item.results);
    setSelectedHistoryId(item.id);
  };

  const handleCopy = async (key: StyleKey, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <HistorySidebar onSelect={handleSelectHistory} selectedId={selectedHistoryId} />

      <main className="flex-1 overflow-y-auto py-12 px-4">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-zinc-900">DevVoice</h1>
            <p className="mt-2 text-zinc-600">工程师英语输出训练器</p>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="mt-3 text-sm text-zinc-500 underline hover:text-zinc-700"
            >
              {showSettings ? '隐藏自定义提示词' : '自定义提示词'}
            </button>
          </header>

          {showSettings && (
            <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-100 p-4">
              <p className="mb-3 text-sm text-zinc-600">自定义每种风格的提示词（留空使用默认）</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(STYLE_LABELS) as StyleKey[]).map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      {STYLE_LABELS[key]}
                    </label>
                    <input
                      type="text"
                      value={prompts[key]}
                      onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
                      placeholder={DEFAULT_PROMPTS[key]}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-4">
              <label
                htmlFor="chinese-input"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                输入中文技术工作描述
              </label>
              <textarea
                id="chinese-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：修复了用户登录超时的 bug，优化了数据库查询性能"
                className="w-full rounded-lg border border-zinc-300 p-4 text-base leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                rows={4}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {loading ? '转换中...' : '转换为 4 种英语风格'}
            </button>
          </form>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {Object.entries(result).map(([key, text]) => {
            if (!text) return null;
            const k = key as StyleKey;
            return (
              <div key={k} className={`mb-4 rounded-lg border p-4 ${STYLE_COLORS[k]}`}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-700">
                    {STYLE_LABELS[k]}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(k, text)}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-100"
                  >
                    {copied === k ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                  {text}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function getHistory(): HistoryItem[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}