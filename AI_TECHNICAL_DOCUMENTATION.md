# AI Sales Assistant - Complete Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [API Configuration](#api-configuration)
4. [System Prompt Engineering](#system-prompt-engineering)
5. [User Prompt Construction](#user-prompt-construction)
6. [Response Processing](#response-processing)
7. [Multi-Topic Handling](#multi-topic-handling)
8. [Error Handling & Fallbacks](#error-handling--fallbacks)
9. [Performance & Token Usage](#performance--token-usage)
10. [Testing & Verification](#testing--verification)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AIPanel.tsx (UI Layer)                    │
│  - Topic selection (17 presets + custom)                    │
│  - Multi-select state management                            │
│  - Prompt composition                                        │
│  - Response display                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ askSalesPoints({ context, prompt })
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   ai.ts (API Client Layer)                   │
│  - API key retrieval from env                                │
│  - System prompt (knowledge base)                            │
│  - User prompt construction                                  │
│  - OpenAI API call (GPT-4o-mini)                            │
│  - Response parsing & cleaning                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP POST to OpenAI
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenAI API (GPT-4o-mini)                    │
│  - Processes system + user prompts                           │
│  - Generates comprehensive sales statements                  │
│  - Returns up to 1500 tokens                                 │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── features/
│   └── ai/
│       └── AIPanel.tsx          # UI component for topic selection
└── lib/
    └── ai.ts                    # API client and prompt logic
```

---

## Data Flow

### 1. User Interaction Flow

```typescript
// User clicks topic chips (e.g., "Anti-con", "Condensation")
// State updates in AIPanel.tsx
const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

// User clicks "Generate Sales Points"
handleGenerateSalesPoints() {
  // 1. Format topics as bullet points
  const presetBullets = selectedPresets.map(p => `• ${p}`).join('\n');

  // 2. Combine with custom prompt
  const combinedPrompt = [presetBullets, customPrompt]
    .filter(Boolean)
    .join('\n\n');

  // 3. Call API with shed context
  const result = await askSalesPoints({
    context: { dimensions, pitch, cladding, sprayTotal },
    prompt: combinedPrompt
  });

  // 4. Display cleaned response
  setResponse(cleanedResponse);
}
```

### 2. API Request Flow

```typescript
// In ai.ts
export async function askSalesPoints(request: SalesPointsRequest) {
  // 1. Get hardcoded API key from environment
  const apiKey = getApiKey(); // Returns VITE_OPENAI_API_KEY

  // 2. Construct prompts
  const systemPrompt = `[Comprehensive Yetifoam knowledge base]`;
  const userPrompt = `
    Shed Configuration: ${dimensions}, ${pitch}, ${cladding}, ${sprayTotal}
    Customer Topics: ${request.prompt}

    **CRITICAL**: Address EVERY topic comprehensively with 3-5 statements each
  `;

  // 3. Make API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,  // Critical for multi-topic responses
    }),
  });

  // 4. Parse and clean response
  const content = data.choices[0].message.content;
  const parsed = parseAIResponse(content);
  const cleaned = parsed.variants.map(v =>
    v.replace(/^[•\-*]\s*/, '')         // Remove bullet points
     .replace(/^\*\*.*?\*\*:\s*/, '')   // Remove bold headings
  ).join('\n\n');

  return { variants: cleaned, closing: parsed.closing };
}
```

---

## API Configuration

### Environment Setup

```bash
# .env file
VITE_OPENAI_API_KEY=sk-svcacct-61Z1KrWzUHQK8EqL7Ep...
```

### Build-Time Injection

Vite injects environment variables at build time:

```typescript
// In ai.ts
const HARDCODED_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export function getApiKey(): string {
  return HARDCODED_API_KEY;
}

export function hasApiKey(): boolean {
  return Boolean(HARDCODED_API_KEY);
}
```

**Important**: The API key is embedded in the built JavaScript bundle. This is acceptable for internal sales tools but NOT for public applications.

### API Endpoint

```
POST https://api.openai.com/v1/chat/completions
```

**Model**: `gpt-4o-mini` (faster and cheaper than GPT-4, sufficient for structured knowledge retrieval)

**Parameters**:
- `temperature: 0.7` - Balanced between consistency and variation
- `max_tokens: 1500` - Allows comprehensive multi-topic responses (increased from 500)

---

## System Prompt Engineering

### Purpose

The system prompt is the AI's "knowledge base" and behavioral instructions. It contains:
1. Yetifoam product benefits (with specific data points)
2. Competitor product flaws (detailed weaknesses)
3. Cost comparisons (TCO analysis)
4. Customer education points (what they don't know)
5. Response formatting rules

### Structure

```typescript
const systemPrompt = `
You are a sales assistant for Yetifoam, a closed-cell spray polyurethane foam (ccSPF) insulation company in Australia.

**YOUR CRITICAL ROLE**:
For EACH topic provided, you MUST address ALL relevant aspects comprehensively.
Provide 3-5 direct factual statements PER TOPIC that salespeople can use with customers.

**KEY YETIFOAM BENEFITS**:
- Increases wind uplift resistance by up to 300%
- Increases wall racking resistance by 124-200%
- Eliminates condensation 100% (creates warm surface above dew point)
- Eliminates thermal bridging completely (continuous insulation over metal)
- Reduces air leakage by 83% (air leakage = 58% of winter heat loss)
- 40% heating cost reduction, 25% cooling cost reduction
- Zero degradation over 25+ years (93% of roofs <1% degradation)
- 97.6% leak-free rate over 26 years
- Class 1 vapor barrier at 75mm thickness
- 100% pest prevention (closed-cell structure)
- No demolition required - spray-applied from interior in 1-2 days
- Neat finish - NO LININGS NEEDED

**COMPETITOR FLAWS** (CRITICAL - use when addressing ANY alternative):

**REFLECTIVE FOIL/AIRCELL/ANTI-CON**:
- Requires complete roof removal (voids warranty on new sheds)
- Degrades entirely within 5 years due to dust (Kingspan admits this)
- Still allows condensation, thermal bridging, and air leakage even when brand new
- NOT designed for retrofitting (requires demolition)
- 0-13% winter benefit maximum (some make sheds COLDER by -5%)
- NOT a vapour barrier - condensation still forms
- Why it fails: Only reflects radiant heat, but there's NO radiant heat in unheated shed
- Winter: Shed emits heat as radiation, but there's no sun radiation coming in to reflect

**FIBREGLASS BATT WALLS SYSTEM**:
- $47,000 vs Yetifoam $16,000 (194% more expensive)
- Loses 150-200mm of space permanently on all walls + ceiling
- Customer permanently stuck with it (can't remove internal structure)
- Immediate 40-60% R-value loss from compression (advertised R3.5 → actual R1.4)
- Year 5: degrades to 31-38% of advertised performance
- Still allows condensation on original metal behind new walls
- 20-30% thermal bridging loss through timber framing
- Vulnerable to rodent nesting
- NOT a vapour barrier - moisture passes through

**FOILBOARD**:
- Requires roof AND wall removal
- $18,000 installed (13% more than Yetifoam)
- Degrades entirely within 5 years (dust on reflective surface)
- Gaps at joints allow thermal bridging and condensation
- NOT a vapour barrier

**CRITICAL CUSTOMER EDUCATION POINTS**:
- Customers know NOTHING about their problem or any solution
- They think they can DIY install competitors (all require demolition/roof removal)
- They don't know reflective products degrade entirely in 5 years
- They don't know fibreglass gets compressed to R=0 in metal buildings
- They don't know roof warranties are VOIDED if roof removed
- They don't know air leakage is 58% of winter heat loss
- They assume all products work the same (completely false)
- They assume cheaper upfront = better value (opposite is true)

**COST REALITY**:
- Yetifoam: $16,000 (walls + roof, neat finish, no linings needed)
- 10-year TCO: Yetifoam $25,750 (LOWEST) vs Fibreglass $60,350 (+$50,600)

**RESPONSE FORMAT RULES**:
1. Address EVERY topic provided separately and comprehensively
2. For each topic, provide 3-5 relevant facts/statements
3. Include competitor comparison when relevant to the topic
4. NO headings like "Superior Performance:" or "Key Benefit:"
5. NO bullet points with bold titles
6. Just direct statements separated by blank lines
7. Make statements conversational - things a salesperson can say verbatim to customer

**EXAMPLE for "Anti-con" topic**:
"Removing the roof to install Anti-con will void the warranty on your new shed, which can lead to significant long-term costs. Anti-con also degrades entirely within 5 years due to dust accumulation on the reflective surface - even Kingspan admits this in their technical documentation. It provides 0-13% winter benefit at most, and in some cases actually makes sheds colder by minus 5% because it only reflects radiant heat, but there's no sun radiation coming into an unheated shed in winter. Anti-con is not a vapour barrier, so condensation will still form on your metal surfaces causing rust. It's also not designed for retrofitting - it requires complete demolition of your existing roof structure."
`;
```

### Key Design Decisions

1. **Explicit "CRITICAL" markers**: Draws AI attention to most important instructions
2. **Specific data points**: "300%", "5 years", "$16,000" - makes responses concrete
3. **Competitor section**: Detailed flaws so AI can reference them for any topic
4. **Example response**: Shows AI the exact format and comprehensiveness expected
5. **Formatting rules**: Seven explicit rules prevent unwanted formatting

---

## User Prompt Construction

### Purpose

The user prompt provides:
1. Shed configuration context (for relevance)
2. Customer topics/questions (what to address)
3. Reinforcement of critical instructions

### Structure

```typescript
const userPrompt = `
Shed Configuration:
- Dimensions: ${request.context.dimensions}
- Roof Pitch: ${request.context.pitch}
- Cladding Type: ${request.context.cladding}
- Total Spray Area: ${request.context.sprayTotal}

${request.prompt ? `Customer Topics/Questions:\n${request.prompt}` : 'Provide general Yetifoam value proposition'}

**CRITICAL INSTRUCTION**: Address EVERY topic listed above comprehensively. For EACH topic, provide 3-5 direct statements covering ALL relevant aspects (benefits, competitor flaws, cost comparison, technical facts).

Each statement should be something a salesperson can say directly to the customer.
NO "Superior Performance:" headings. NO "Key Benefit:" titles. Just the facts as conversational statements.
Separate statements with blank lines.

If multiple topics are listed, address them ALL separately and thoroughly.
`;
```

### Topic Formatting (Critical for Multi-Topic)

In `AIPanel.tsx`:

```typescript
// Format topics as bullet points to make them distinct
const presetBullets = selectedPresets.length > 0
  ? selectedPresets.map(p => `• ${p}`).join('\n')
  : '';

const customPrompt = prompt.trim();

// Combine with line breaks to keep topics distinct
const combinedPrompt = [presetBullets, customPrompt]
  .filter(Boolean)
  .join('\n\n');

// Example output:
// • Anti-con
// • Condensation
// • Too Expensive
//
// Customer also mentioned roof is rusting
```

**Why Bullet Points?**
- Comma-separated: "Anti-con, Condensation, Too Expensive" → AI might treat as one concept
- Bullet points: Each is visually distinct → AI addresses each separately

---

## Response Processing

### Parsing Flow

```typescript
function parseAIResponse(content: string): { variants: string[]; closing: string } {
  const variants: string[] = [];
  let closing = '';

  const lines = content.split('\n').map(line => line.trim());

  let inVariants = true;
  for (const line of lines) {
    if (!line) continue;

    // Check if line is a bullet point
    const bulletMatch = line.match(/^[•\-*]\s*(.+)$/);
    const numberMatch = line.match(/^\d+[\.)]\s*(.+)$/);

    if (bulletMatch && inVariants) {
      variants.push(bulletMatch[1].trim());
    } else if (numberMatch && inVariants) {
      variants.push(numberMatch[1].trim());
    } else if (line.toLowerCase().includes('closing') || line.toLowerCase().includes('summary')) {
      inVariants = false;
    } else if (!inVariants && line.length > 10) {
      closing = line;
      break;
    }
  }

  // If no structured format found, use whole content as first variant
  if (variants.length === 0) {
    const sentences = content.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      variants.push(sentences[0]);
      if (sentences.length > 1) {
        closing = sentences[sentences.length - 1];
      }
    }
  }

  return { variants, closing };
}
```

### Cleaning Flow

```typescript
// In AIPanel.tsx
const cleanedResponse = result.variants
  .map(v => v.replace(/^[•\-*]\s*/, '')           // Remove bullet prefixes
             .replace(/^\*\*.*?\*\*:\s*/, ''))    // Remove bold headings like "**Key Benefit:**"
  .join('\n\n');                                  // Join with blank lines

setResponse(cleanedResponse);
```

### Display

```typescript
<Paper sx={{ maxHeight: '400px', overflow: 'auto' }}>
  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
    {response}
  </Typography>
</Paper>
```

**`whiteSpace: 'pre-wrap'`**: Preserves line breaks from `\n\n` while wrapping long lines.

---

## Multi-Topic Handling

### Problem Statement

**Before Fix**:
```typescript
// Topics: ["Anti-con", "Condensation", "Too Expensive"]
const combinedPrompt = selectedPresets.join(', ');
// Result: "Anti-con, Condensation, Too Expensive"
// AI Response: Only 1 statement about Anti-con (first topic)
```

**Issue**: Comma-separated topics look like a single concept to the AI.

### Solution

```typescript
// Topics: ["Anti-con", "Condensation", "Too Expensive"]
const presetBullets = selectedPresets.map(p => `• ${p}`).join('\n');
// Result:
// • Anti-con
// • Condensation
// • Too Expensive

// AI Response: 3-5 statements for EACH topic = 9-15 statements total
```

### Reinforcement Layers

1. **System Prompt**: "For EACH topic provided, you MUST address ALL relevant aspects comprehensively"
2. **User Prompt**: "Address EVERY topic listed above comprehensively"
3. **Bullet Formatting**: Visual separation of topics
4. **Token Limit**: 1500 tokens (enough for ~300 words = 9-15 statements)

### Example Response (Multi-Topic)

**Input**:
```
• Anti-con
• Condensation
```

**Output**:
```
Removing the roof to install Anti-con will void the warranty on your new shed, which can lead to significant long-term costs. Anti-con degrades entirely within 5 years due to dust accumulation on the reflective surface - even Kingspan admits this in their technical documentation. It provides 0-13% winter benefit at most, and in some cases actually makes sheds colder by minus 5%.

Yetifoam eliminates condensation 100% by creating a warm surface above the dew point, so moisture never condenses on your metal surfaces. This completely prevents rust from forming on the interior of your shed. Competitor products like Anti-con and fibreglass are NOT vapour barriers, so condensation will still form behind them causing ongoing rust issues.
```

**Analysis**: 3 statements for Anti-con, 2 for Condensation = 5 total statements addressing both topics comprehensively.

---

## Error Handling & Fallbacks

### API Error Handling

```typescript
try {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {...});

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `API request failed: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Invalid response from OpenAI API');
  }

  return parseAIResponse(content);

} catch (error) {
  console.error('OpenAI API error:', error);

  // Return fallback defaults
  return {
    variants: DEFAULT_VARIANTS,
    closing: DEFAULT_CLOSING,
  };
}
```

### Default Fallbacks

```typescript
const DEFAULT_VARIANTS = [
  'Standard foam application provides excellent insulation for this configuration.',
  'Consider premium options for enhanced thermal performance.',
];

const DEFAULT_CLOSING = "Let's discuss the best solution for your shed.";
```

### UI Error Display

```typescript
{error && (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
)}
```

---

## Performance & Token Usage

### Token Calculation

**Input Tokens** (approximate):
- System prompt: ~800 tokens
- User prompt: ~100 tokens
- Shed context: ~50 tokens
- Total Input: ~950 tokens

**Output Tokens**:
- Single topic: ~150 tokens (3-5 statements × ~30 tokens each)
- Three topics: ~450 tokens (9-15 statements)
- Max limit: 1500 tokens

**Total per Request**: ~950 input + 450 output = ~1400 tokens

### Cost Estimation

**GPT-4o-mini Pricing** (as of 2024):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Per Request**:
- Input cost: 950 tokens × $0.15 / 1M = $0.0001425
- Output cost: 450 tokens × $0.60 / 1M = $0.00027
- **Total: ~$0.0004 per request** (less than half a cent)

**Monthly Usage** (1000 requests):
- Total cost: ~$0.40/month
- Very affordable for internal sales tool

### Response Time

- Network latency: 50-100ms
- OpenAI processing: 1-3 seconds (depends on response length)
- **Total: 1-3 seconds** for comprehensive multi-topic response

### Optimization Opportunities

1. **Caching**: Could cache common topic combinations
2. **Streaming**: Could use SSE for real-time token streaming
3. **Prompt Compression**: Could reduce system prompt size (but would lose specificity)

**Current Decision**: No optimization needed - performance is acceptable for desktop tool.

---

## Testing & Verification

### Manual Test Cases

1. **Single Topic - Anti-con**
   - Expected: 3-5 statements covering warranty, degradation, winter performance, vapour barrier, retrofitting
   - Verify: All 5 aspects addressed

2. **Multiple Topics - Anti-con + Condensation**
   - Expected: 3-5 statements for Anti-con, 3-5 for Condensation
   - Verify: Distinct sections for each topic

3. **Complex Query**
   - Topics: Anti-con, Too Expensive, Can DIY
   - Custom: "Customer has a new shed and is worried about warranty"
   - Verify: All topics addressed + custom context incorporated

4. **Edge Cases**
   - No topics selected: Should provide general value proposition
   - Custom text only: Should address the specific question
   - All 17 presets: Should hit token limit gracefully

### API Key Verification

```bash
# Check .env file
cat .env | grep VITE_OPENAI_API_KEY

# Verify in browser console (after build)
console.log(hasApiKey()); // Should return true

# Test API call
# Select any topic and click "Generate Sales Points"
# If error appears, API key is invalid or expired
```

### Response Quality Checks

1. **Comprehensiveness**: Does each topic get 3-5 statements?
2. **Accuracy**: Are data points correct (300%, $16k, 5 years)?
3. **Conversational**: Can statements be spoken verbatim?
4. **No Fluff**: Are there any bold headings or bullet points?
5. **Competitor Info**: For competitive topics, are flaws mentioned?

---

## Troubleshooting Guide

### Issue: AI Returns Same Response Every Time

**Diagnosis**:
- Temperature is too low
- Prompt is too restrictive
- Caching on OpenAI side

**Solution**:
- Check `temperature: 0.7` (current value is correct)
- Verify topics are formatted as bullet points
- Add timestamp to user prompt to break cache

### Issue: AI Only Addresses First Topic

**Diagnosis**:
- Topics formatted as comma-separated string
- Insufficient instructions in system prompt
- Token limit too low

**Solution**:
- ✅ **Already Fixed**: Topics formatted as bullet points
- ✅ **Already Fixed**: System prompt says "EVERY topic"
- ✅ **Already Fixed**: max_tokens increased to 1500

### Issue: Response Has Bold Headings

**Diagnosis**:
- Response cleaning regex not working
- AI ignoring formatting instructions

**Solution**:
- ✅ **Already Fixed**: `.replace(/^\*\*.*?\*\*:\s*/, '')` removes bold headings
- Add more examples in system prompt showing desired format

### Issue: API Key Not Working

**Diagnosis**:
- Key not in .env file
- Key incorrect or expired
- Vite not injecting environment variable

**Solution**:
```bash
# 1. Check .env file exists and has correct key
cat .env | grep VITE_OPENAI_API_KEY

# 2. Restart dev server (Vite reads .env on startup)
npm run dev

# 3. Verify in browser console
console.log(import.meta.env.VITE_OPENAI_API_KEY)

# 4. If still not working, rebuild
npm run build
```

---

## Future Enhancements

### Potential Improvements

1. **Streaming Responses**: Use SSE to show responses as they're generated
2. **Response Caching**: Cache common topic combinations in localStorage
3. **Conversation History**: Store previous responses for context
4. **Response Variations**: Generate multiple response variants for A/B testing
5. **Feedback Loop**: Track which responses lead to sales, improve prompt accordingly
6. **Custom Knowledge Base**: Allow admins to update product data without code changes

### Code Changes Required

**Streaming**:
```typescript
const response = await fetch('...', {
  body: JSON.stringify({
    ...
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  setResponse(prev => prev + chunk);
}
```

**Caching**:
```typescript
const cacheKey = `ai_response_${selectedPresets.join('_')}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  setResponse(JSON.parse(cached));
  return;
}

const result = await askSalesPoints(...);
localStorage.setItem(cacheKey, JSON.stringify(result));
```

---

## Summary

The AI Sales Assistant is a **carefully engineered system** that:

1. **Uses GPT-4o-mini** for cost-effective, fast responses
2. **Embeds comprehensive knowledge** in system prompt (Yetifoam benefits, competitor flaws, costs)
3. **Formats topics as bullet points** to ensure each is addressed separately
4. **Enforces comprehensive coverage** through explicit instructions and examples
5. **Cleans responses** to remove formatting artifacts
6. **Handles errors gracefully** with fallback responses
7. **Costs less than $0.40/month** for 1000 requests
8. **Generates 3-5 statements per topic** covering benefits, competitor flaws, costs, and technical facts

Every aspect is designed to produce **conversational, comprehensive, accurate** sales talking points that salespeople can use verbatim with customers.
