import { useState } from 'react';
import { requestAdvisor, DEFAULT_ADVISOR_VARIANTS, DEFAULT_ADVISOR_CLOSING } from '../services/llmClient';
import { formSchema } from '../state/formSchema';
import { useLayout, type AdvisorEntry } from '../state/LayoutContext';

const MAX_HISTORY = 10;

export function AiAdvisorPanel() {
  const {
    state: { advisor, form },
    dispatch,
  } = useLayout();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });

      const entry: AdvisorEntry = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `advisor-${Date.now()}`,
        question,
        variants: result.variants.length > 0 ? result.variants : [...DEFAULT_ADVISOR_VARIANTS],
        closing: result.closing || DEFAULT_ADVISOR_CLOSING,
        createdAt: new Date().toISOString(),
      };

      const nextHistory = [...advisor.history, entry].slice(-MAX_HISTORY);
      dispatch({ type: 'SET_ADVISOR', payload: { history: nextHistory } });
      setInput('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to reach the advisor.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="ai-advisor-panel" className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">AI Advisor</h2>
        <p className="mt-1 text-xs text-slate-500">Generates suggested talking points from the current form.</p>
      </header>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-white/80 p-3">
        {advisor.history.length === 0 ? (
          <p className="text-sm text-slate-500">Ask a question to receive sales variants and a closing suggestion.</p>
        ) : (
          <ol data-testid="advisor-history" className="space-y-4 text-sm text-slate-800">
            {advisor.history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Question</p>
                <p className="mt-1 font-medium text-slate-800">{entry.question}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Variants</p>
                <ul data-testid="advisor-variants" className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                  {(entry.variants.length > 0 ? entry.variants : DEFAULT_ADVISOR_VARIANTS).map((variant, index) => (
                    <li key={`${entry.id}-variant-${index}`}>{variant}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Closing</p>
                <p data-testid="advisor-closing" className="mt-1 text-slate-700">{entry.closing || DEFAULT_ADVISOR_CLOSING}</p>
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
          placeholder="Ask how to position this configuration..."
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
