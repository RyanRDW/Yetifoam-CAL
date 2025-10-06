// ==============================================================================
// SALES RULES
// ==============================================================================

export const salesRules = {
  tone: {
    style: 'confident, practical, fact-driven',
    forbidden: ['hype', 'fluff', 'salesy language', 'desperation'],
    required: ['comparison-heavy', 'educational', 'data-backed']
  },
  structure: {
    format: 'descriptive bullet points with cascading depth',
    no_opening: true,
    no_closing: true,
    no_cta: true,
    max_cascade_depth: 6,
    min_cascade_depth: 3
  },
  content: {
    source_priority: [
      'user_feedback (HIGHEST)',
      'salesKB internal content',
      'calc_summary data',
      'customer_notes'
    ],
    forbidden_claims: [
      'Unverified product benefits',
      'Made-up statistics',
      'Competitor defamation without data',
      'Negative framing about YetiFoam'
    ],
    required_elements: [
      'Embedded competitor comparisons',
      'Data citations when available',
      'Cascading cause-effect chains'
    ]
  },
  safety: { never_invent: true, cite_snippet_ids: true, log_all_sources: true, prefer_internal_content: true },
  output: { variants_required: ['sms', 'email', 'call'], json_structure: true, human_readable_text: true, meta_tracking: true }
};

export default salesRules;
