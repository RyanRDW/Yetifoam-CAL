import React, { useState } from 'react';
import { composeSales, DEFAULT_SALES_VARIANTS, DEFAULT_SALES_CLOSING, type SalesResponse } from '../../services/salesComposer';
import { useLayout } from '../../state/LayoutContext';
import { formSchema } from '../../state/formSchema';

export const SalesPanel: React.FC = () => {
  const { state } = useLayout();
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [output, setOutput] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const validation = formSchema.safeParse(state.form);
    if (!validation.success) {
      setError('Complete all required inputs before generating sales variants.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await composeSales({
        form: validation.data,
        feedback: {
          notes,
          followUp: feedback,
        },
      });
      setOutput(response);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sales composer request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-800">Sales Composer</h1>
        <p className="text-sm text-slate-500">
          Generates sales talking points from the current form data. Adjust the inputs in the main panel before requesting
          variants.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Customer Notes (optional)</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Internal Feedback (optional)</span>
          <textarea
            rows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          />
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-fit rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? 'Generating…' : 'Generate variants'}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>

      {output && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Variants</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-800">
              {(output.variants.length > 0 ? output.variants : DEFAULT_SALES_VARIANTS).map((variant, index) => (
                <li key={`variant-${index}`}>{variant}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Closing</h2>
            <p className="mt-2 text-slate-800">{output.closing || DEFAULT_SALES_CLOSING}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default SalesPanel;
