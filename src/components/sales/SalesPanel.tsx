import React, { useState } from 'react';
import { composePitch } from '../../services/salesComposer';
import { feedbackProcessor } from '../../services/feedbackProcessor';
import { ComposeInput, ComposeOutput } from '../../types/sales.types';

export const SalesPanel: React.FC = () => {
  const [customerNotes, setCustomerNotes] = useState('');
  const [suburb, setSuburb] = useState('');
  const [state, setState] = useState('VIC');
  const [cladding, setCladding] = useState('Colourbond');
  const [options, setOptions] = useState<string[]>(['walls', 'roof']);
  const [output, setOutput] = useState<ComposeOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const buildInput = (): ComposeInput => ({
    customer_notes: customerNotes,
    calc_summary: {
      dimensions: { L: 10, W: 8, H: 3 },
      areas: { roof: 80, walls: 120 },
      materials: { cladding, members: ['steel_frame','steel_purlin'] },
      options
    },
    region: { suburb, state }
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const input = buildInput();
      const result = await composePitch(input);
      setOutput(result);
    } catch (e) {
      console.error(e);
      alert('Generation failed');
    } finally { setLoading(false); }
  };

  const handleFeedbackSubmit = async () => {
    if (!output || !feedbackText.trim()) return;
    setLoading(true);
    try {
      const input = buildInput();
      await feedbackProcessor.saveFeedback(input, output, feedbackText);
      const updated = await composePitch(input);
      setOutput(updated);
      setFeedbackText('');
      alert('Feedback applied');
    } catch (e) {
      console.error(e);
      alert('Failed to apply feedback');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1>YetiFoam Sales Benefits Composer</h1>

      <div style={{ marginBottom: 24, border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
        <h2>Customer Details</h2>
        <label style={{ display:'block', fontWeight:'bold', marginTop:8 }}>Customer Notes</label>
        <textarea rows={4} value={customerNotes} onChange={e=>setCustomerNotes(e.target.value)} style={{ width:'100%', padding:10 }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
          <div>
            <label style={{ display:'block', fontWeight:'bold' }}>Suburb</label>
            <input value={suburb} onChange={e=>setSuburb(e.target.value)} style={{ width:'100%', padding:10 }} />
          </div>
          <div>
            <label style={{ display:'block', fontWeight:'bold' }}>State</label>
            <select value={state} onChange={e=>setState(e.target.value)} style={{ width:'100%', padding:10 }}>
              <option value="VIC">VIC</option><option value="NSW">NSW</option><option value="QLD">QLD</option>
              <option value="SA">SA</option><option value="WA">WA</option><option value="TAS">TAS</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <label style={{ display:'block', fontWeight:'bold' }}>Cladding</label>
          <select value={cladding} onChange={e=>setCladding(e.target.value)} style={{ width:'100%', padding:10 }}>
            <option value="Colourbond">Colourbond</option>
            <option value="Zincalume">Zincalume</option>
            <option value="Other">Other Metal</option>
          </select>
        </div>

        <div style={{ marginTop:12 }}>
          <label style={{ display:'block', fontWeight:'bold' }}>Treatment Options</label>
          <label style={{ marginRight:16 }}>
            <input type="checkbox" checked={options.includes('roof')}
              onChange={e=> setOptions(e.target.checked? [...options,'roof'] : options.filter(o=>o!=='roof')) }/> Roof
          </label>
          <label>
            <input type="checkbox" checked={options.includes('walls')}
              onChange={e=> setOptions(e.target.checked? [...options,'walls'] : options.filter(o=>o!=='walls')) }/> Walls
          </label>
        </div>

        <button onClick={handleGenerate} disabled={loading}
          style={{ marginTop:16, padding:'12px 24px', background:'#007bff', color:'#fff', border:'none', borderRadius:4, cursor:'pointer' }}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {output && (
        <div style={{ border:'1px solid #ddd', padding:16, borderRadius:8 }}>
          <h2>Benefits</h2>
          <pre style={{ whiteSpace:'pre-wrap', background:'#f9f9f9', padding:12 }}>{output.benefits}</pre>

          {output.comparison && (
            <>
              <h3>Comparison</h3>
              <pre style={{ whiteSpace:'pre-wrap', background:'#f9f9f9', padding:12 }}>{output.comparison}</pre>
            </>
          )}

          {output.objections && (
            <>
              <h3>Objections</h3>
              <pre style={{ whiteSpace:'pre-wrap', background:'#f9f9f9', padding:12 }}>{output.objections}</pre>
            </>
          )}

          <div style={{ marginTop:16, background:'#fff3cd', padding:12, borderRadius:8 }}>
            <strong>Provide Feedback</strong>
            <textarea rows={3} value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} style={{ width:'100%', padding:10, marginTop:8 }} />
            <button onClick={handleFeedbackSubmit} disabled={!feedbackText.trim() || loading}
              style={{ marginTop:8, padding:'10px 20px', background:'#28a745', color:'#fff', border:'none', borderRadius:4, cursor:'pointer' }}>
              {loading ? 'Applying...' : 'Apply & Regenerate'}
            </button>
          </div>

          <div style={{ marginTop:12, padding:10, background:'#e9ecef', borderRadius:4, fontSize:12 }}>
            <strong>Meta:</strong> Snippets used: {output.meta.snippets_used.join(', ')}
            {output.meta.feedback_used && ` | Applied feedback: ${output.meta.feedback_ids.join(', ')}`}
          </div>
        </div>
      )}
    </div>
  );
};
export default SalesPanel;
