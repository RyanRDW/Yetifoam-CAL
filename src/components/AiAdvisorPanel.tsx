import { useState } from 'react';
import { llmCall, type ChatMessage } from '../services/llmClient';
import { useLayout } from '../state/LayoutContext';

export function AiAdvisorPanel() {
  const {
    state: { advisor },
    dispatch,
  } = useLayout();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = advisor.history;

  async function sendPrompt() {
    const question = input.trim();
    if (!question) return;
    setLoading(true);
    setError(null);
    const nextMessages: ChatMessage[] = [...history, { role: 'user', content: question }];
    try {
      const reply = await llmCall({ messages: nextMessages });
      dispatch({
        type: 'SET_ADVISOR',
        payload: { history: [...nextMessages, { role: 'assistant', content: reply }] },
      });
      setInput('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to reach AI advisor';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">AI Advisor</h2>
        <p className="mt-1 text-xs text-slate-500">Chat with the shed resilience assistant.</p>
      </header>
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-white/80 p-3">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No conversations yet.</p>
        ) : (
          <ol className="space-y-3 text-sm text-slate-800">
            {history.map((message, index) => (
              <li
                key={`${message.role}-${index}`}
                className={
                  message.role === 'assistant'
                    ? 'ml-auto max-w-[85%] rounded-2xl bg-slate-900 px-4 py-2 text-slate-50'
                    : 'max-w-[85%] rounded-2xl bg-slate-100 px-4 py-2 text-slate-800'
                }
              >
                {message.content}
              </li>
            ))}
          </ol>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="ai-input">
          Advisor prompt
        </label>
        <textarea
          id="ai-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
        />
        <button
          type="button"
          onClick={sendPrompt}
          disabled={loading || !input.trim()}
          className="h-fit rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </section>
  );
}
