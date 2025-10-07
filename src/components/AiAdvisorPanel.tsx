import { useState } from 'react';
import { requestAdvisor, DEFAULT_ADVISOR_VARIANTS, DEFAULT_ADVISOR_CLOSING } from '../services/llmClient';
import { formSchema } from '../state/formSchema';
import { useLayout, type AdvisorEntry } from '../state/LayoutContext';

const MAX_HISTORY = 10;
const PROVIDER_OPTIONS = [
  { id: 'grok', label: 'Grok (xAI)' },
  { id: 'openai', label: 'OpenAI' },
] as const;

export function AiAdvisorPanel() {
  const {
    state: { advisor, form },
    dispatch,
  } = useLayout();

  const provider = advisor.provider || 'grok';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderChange = (nextProvider: 'grok' | 'openai') => {
    if (nextProvider === provider) return;
    dispatch({ type: 'SET_ADVISOR', payload: { ...advisor, provider: nextProvider } });
  };

  async function sendPrompt() {
    const question = input.trim();
    if (!question) {
      return;
    }

    const validation = formSchema.safeParse(form);
    if (!validation.success) {
      setError('Complete all required inputs before asking the advisor.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestAdvisor({
        form: validation.data,
        question,
        feedback: { source: 'advisor_panel' },
        provider,
      });

      const entry: AdvisorEntry = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `advisor-${Date.now()}`,
        question,
        variants: result.variants.length > 0 ? result.variants : [...DEFAULT_ADVISOR_VARIANTS],
        closing: result.closing || DEFAULT_ADVISOR_CLOSING,
        createdAt: new Date().toISOString(),
      };

      const nextHistory = [...advisor.history, entry].slice(-MAX_HISTORY);
      dispatch({ type: 'SET_ADVISOR', payload: { ...advisor, history: nextHistory } });
      setInput('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to reach the advisor.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      data-testid="ai-advisor-panel"
      className="flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white/85 px-5 py-6 shadow-md backdrop-blur"
    >
      <header className="border-b border-slate-200/60 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-600/80">Advisor</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">AI sales companion</h2>
            <p className="mt-1 text-xs text-slate-500">
              Capture quick talking points tailored to the current configuration.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1 text-xs font-semibold text-slate-500">
            {PROVIDER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleProviderChange(option.id)}
                className={[
                  'rounded-2xl px-3 py-1 transition',
                  provider === option.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-blue-600',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-3 flex-1 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-4">
        {advisor.history.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ask a question to receive variants and a closing suggestion you can share with your customer.
          </p>
        ) : (
          <ol data-testid="advisor-history" className="space-y-4 text-sm text-slate-800">
            {advisor.history.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Question</p>
                    <p className="mt-1 font-medium text-slate-800">{entry.question}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Variants</p>
                <ul data-testid="advisor-variants" className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                  {(entry.variants.length > 0 ? entry.variants : DEFAULT_ADVISOR_VARIANTS).map((variant, index) => (
                    <li key={`${entry.id}-variant-${index}`}>{variant}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Closing</p>
                <p data-testid="advisor-closing" className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                  {entry.closing || DEFAULT_ADVISOR_CLOSING}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <div className="mt-4 flex gap-3">
        <label className="sr-only" htmlFor="ai-input">
          Advisor prompt
        </label>
        <textarea
          id="ai-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="Ask how to position this configuration..."
          className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="button"
          onClick={sendPrompt}
          disabled={loading || !input.trim()}
          className="h-fit rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </section>
  );
}
