# AI Sales Assistant System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [How the AI Works](#how-the-ai-works)
3. [File Locations](#file-locations)
4. [Preset Topic Buttons](#preset-topic-buttons)
5. [Feedback System](#feedback-system)
6. [Editing the AI System](#editing-the-ai-system)
7. [API Key Configuration](#api-key-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The AI Sales Assistant is a **client-side OpenAI GPT-4o-mini integration** that generates customized sales talking points for Yetifoam spray foam insulation. It uses a comprehensive knowledge base hardcoded in the system prompt and operates completely from the browser.

### Key Features:
- **26 Default Preset Topics** (Condensation, Rust, Anti-con, Dust Degradation, Structural Benefits, Air Sealing, Thermal Bridging, Total Cost of Ownership, Space Loss, Manufacturer Fraud, Victoria Climate Specific, Environmental Impact, etc.)
- **Custom Topic Creation** (users can add their own topics)
- **Multi-Select** (select multiple topics, AI addresses ALL comprehensively)
- **Comprehensive Responses** (3-5 statements per topic)
- **Feedback System** (report issues or suggest improvements)
- **No Backend Required** (API key injected at build time)

---

## How the AI Works

### 1. **User Interaction Flow**

```
User selects topics → Topics formatted as bullet points → Combined with custom text →
Sent to OpenAI API → AI generates 3-5 statements per topic →
Response cleaned and displayed → User copies for customer conversations
```

### 2. **Topic Formatting (Critical)**

When you select multiple topics, they are formatted as **bullet points** before being sent to the AI:

```
• Condensation
• Anti-con
• Too Expensive
```

**Why bullet points?** This ensures the AI treats each topic as distinct and addresses ALL topics comprehensively. Previously, comma-separated topics were treated as a single concept.

**Code Location:** [src/features/ai/AIPanel.tsx:97-107](src/features/ai/AIPanel.tsx#L97-L107)

### 3. **System Prompt (AI's Instructions)**

The AI receives an 800-token system prompt containing:

- **Yetifoam Benefits** (12 key points: 300% wind uplift, 100% condensation elimination, etc.)
- **Competitor Product Flaws** (Anti-con, Fibreglass, Foilboard - specific weaknesses)
- **Cost Reality** ($16k Yetifoam vs $47k Fibreglass)
- **Customer Education** (what customers don't know)
- **Response Format Rules** (NO sales fluff, NO headings, just conversational statements)
- **Comprehensive Coverage Instruction** ("For EACH topic, provide 3-5 statements")

**Code Location:** [src/lib/ai.ts:56-128](src/lib/ai.ts#L56-L128)

### 4. **Token Limit: 1500**

The AI can generate up to **1500 tokens** (approximately 1,125 words). This allows:
- 3 topics × 5 statements × ~75 words = ~1,125 words
- Comprehensive coverage of multiple topics simultaneously

**Code Location:** [src/lib/ai.ts:161](src/lib/ai.ts#L161)

### 5. **Response Cleaning**

After receiving the AI response, the system:
1. Removes bullet point prefixes (`• `, `- `, `* `)
2. Removes bold headings (`**Superior Performance:** `)
3. Joins statements with blank lines for readability

**Code Location:** [src/features/ai/AIPanel.tsx:115-117](src/features/ai/AIPanel.tsx#L115-L117)

### 6. **Display**

Responses are displayed in a fixed-height box (400px max) with scroll, preventing the page from jumping around.

**Code Location:** [src/features/ai/AIPanel.tsx:280-303](src/features/ai/AIPanel.tsx#L280-L303)

---

## File Locations

### Core AI Files (Edit These to Change AI Behavior)

| File | Purpose | Lines to Edit |
|------|---------|---------------|
| **[src/lib/ai.ts](src/lib/ai.ts)** | OpenAI API integration, system prompt, knowledge base | Lines 56-128 (system prompt), 161 (max_tokens) |
| **[src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)** | UI component, preset buttons, user interaction | Lines 33-51 (preset list), 97-107 (topic formatting) |
| **[src/pages/CalculatorPage.tsx](src/pages/CalculatorPage.tsx)** | Page layout (where AI panel appears) | Lines 77-84 (AI panel position) |

### API Key Configuration

| File | Purpose |
|------|---------|
| **[.env](.env)** | Environment variables (API key stored here) |
| **[src/lib/ai.ts:7](src/lib/ai.ts#L7)** | API key import from environment |

### Visual Example of File Relationships:

```
.env (VITE_OPENAI_API_KEY)
  ↓
src/lib/ai.ts (imports key, contains system prompt)
  ↓
src/features/ai/AIPanel.tsx (UI component, calls ai.ts functions)
  ↓
src/pages/CalculatorPage.tsx (displays AIPanel on page)
```

---

## Preset Topic Buttons

### Default Presets (26 Total)

**Location:** [src/features/ai/AIPanel.tsx:33-60](src/features/ai/AIPanel.tsx#L33-L60)

```typescript
const DEFAULT_PRESETS = [
  'Condensation',      // Moisture issues
  'Rust',              // Metal corrosion from condensation
  'Roof Only',         // Just spray roof vs walls too
  'Reflective Foil',   // Competitor product
  'Foil Board',        // Competitor product
  'Summer Heat',       // Cooling benefits
  'Winter Cold',       // Heating benefits
  'Anti-con',          // Main competitor product
  'Too Expensive',     // Price objection
  'Can DIY',           // DIY misconception
  'Fire',              // Fire safety
  'Air-Cell',          // Competitor product
  'Batt Walls',        // Fibreglass competitor
  'Vapour Barrier',    // Technical benefit
  'Air Barrier',       // Air sealing benefit
  'Leaking',           // Leak prevention
  'Noisy',             // Sound insulation
  'Dust Degradation',  // New: Dust impact on competitors
  'Structural Benefits', // New: Strength enhancements
  'Air Sealing / Air Leakage', // New: Leak reduction
  'Thermal Bridging',  // New: Bridging losses
  'Total Cost of Ownership', // New: Long-term costs
  'Space Loss',        // New: Space reduction from competitors
  'Manufacturer Fraud / Deception', // New: Misleading claims
  'Victoria Climate Specific', // New: Vic-specific benefits
  'Environmental Impact' // New: Eco aspects
];
```

### How Preset Buttons Work

1. **Selection State:** Clicking a preset toggles it on/off (visual feedback: blue = selected, gray = unselected)
2. **Multi-Select:** Users can select as many presets as needed
3. **Bullet Point Formatting:** Selected presets are converted to bullet points before sending to AI
4. **Chip Component:** Uses Material-UI Chip with custom styling

**Code Location:** [src/features/ai/AIPanel.tsx:68-72](src/features/ai/AIPanel.tsx#L68-L72) (toggle function)

### Adding/Editing Presets

**To add a new preset:**

1. Open [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)
2. Find `DEFAULT_PRESETS` array (line 33)
3. Add your topic to the array:
   ```typescript
   const DEFAULT_PRESETS = [
     'Condensation',
     'Rust',
     // ... existing presets ...
     'Your New Topic',  // ← Add here
   ];
   ```
4. Save file - Vite HMR will update instantly

**To remove a preset:**

1. Open [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)
2. Find the preset in `DEFAULT_PRESETS` array
3. Delete the line
4. Save file

**To rename a preset:**

1. Open [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)
2. Find the preset in `DEFAULT_PRESETS` array
3. Change the string value
4. Save file

### Custom Topics (User-Created)

Users can create their own preset buttons at runtime:

1. Click **"Add Topic"** button
2. Type topic name in text field
3. Press **Enter** or click **"Add"** button
4. New chip appears with **X icon** (can be deleted)
5. Custom topics are **stored in component state** (reset on page refresh)

**Code Locations:**
- Add Topic UI: [src/features/ai/AIPanel.tsx:190-218](src/features/ai/AIPanel.tsx#L190-L218)
- Add Function: [src/features/ai/AIPanel.tsx:74-80](src/features/ai/AIPanel.tsx#L74-L80)
- Remove Function: [src/features/ai/AIPanel.tsx:82-85](src/features/ai/AIPanel.tsx#L82-L85)

---

## Feedback System

### Purpose

The **"Report Calculation Issue + Update Sales Responses"** button allows users to:
- Report incorrect calculations
- Suggest improvements to AI responses
- Flag issues with the system

### How It Works

1. **Button Location:** Top of AI Panel (red outlined button)
2. **Click to Expand:** Opens a red-tinted text area
3. **User Types Feedback:** 4-row multiline text field
4. **Submit:** Currently logs to console and shows alert (placeholder for future backend integration)

**Code Location:** [src/features/ai/AIPanel.tsx:136-174](src/features/ai/AIPanel.tsx#L136-L174)

### Current Implementation

```typescript
const handleFeedbackSubmit = () => {
  console.log('Feedback submitted:', feedbackText);
  alert(`Feedback submitted: ${feedbackText}`);
  setFeedbackText('');
  setFeedbackOpen(false);
};
```

**Location:** [src/features/ai/AIPanel.tsx:127-132](src/features/ai/AIPanel.tsx#L127-L132)

### Integrating with Backend

To send feedback to a server:

```typescript
const handleFeedbackSubmit = async () => {
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback: feedbackText,
        context: context,
        timestamp: new Date().toISOString(),
      }),
    });
    alert('Feedback submitted successfully!');
  } catch (error) {
    alert('Failed to submit feedback');
  }
  setFeedbackText('');
  setFeedbackOpen(false);
};
```

---

## Editing the AI System

### 1. **Change AI Responses (Knowledge Base)**

**File:** [src/lib/ai.ts](src/lib/ai.ts)
**Lines:** 56-128 (system prompt)

**What You Can Edit:**

#### Add New Yetifoam Benefits:
```typescript
**KEY YETIFOAM BENEFITS**:
- Increases wind uplift resistance by up to 300%
- Eliminates condensation 100%
// ... existing benefits ...
- Your new benefit here  // ← Add here
```

#### Add New Competitor Flaws:
```typescript
**COMPETITOR FLAWS**:

**REFLECTIVE FOIL/AIRCELL/ANTI-CON**:
- Requires complete roof removal
// ... existing flaws ...
- Your new flaw here  // ← Add here

**NEW COMPETITOR PRODUCT**:  // ← Add entire section
- Flaw 1
- Flaw 2
```

#### Change Response Format Rules:
```typescript
**RESPONSE FORMAT RULES**:
1. Address EVERY topic provided separately
2. For each topic, provide 3-5 relevant facts  // ← Change number here
3. Include competitor comparison
// ... add new rules ...
```

#### Change Example Response:
```typescript
**EXAMPLE for "Anti-con" topic**:
"Your new example response here..."  // ← Replace entire example
```

#### Add New Sales Lines for Existing Topics:

For topics like **Dust Degradation**, **Structural Benefits**, **Air Sealing**, **Thermal Bridging**, etc., add specific talking points to the relevant sections:

```typescript
// Example: Adding Dust Degradation sales lines to COMPETITOR FLAWS section

**REFLECTIVE FOIL/AIRCELL/ANTI-CON**:
- Dust kills reflective foil: 40-70% performance loss in 2-3 years—cleaning impossible.
- Year 1: 25-35% loss; year 5: <30% remains—turns cheap products worthless.
- Manufacturers admit R-value drops with dust—impossible to keep clean in sheds.
- Dust kills foil: 26-47% cooling year 1, below 30% by year 3-5 as surface dulls.
```

```typescript
// Example: Adding Structural Benefits to KEY YETIFOAM BENEFITS section

**KEY YETIFOAM BENEFITS**:
- Yetifoam boosts wind uplift 300%, racking strength 124-191%—bonds structure per AS 4100.
- Eliminates thermal shock damage—no competitor provides structural gain.
- Increases overall stability—quantified, unique advantage.
```

```typescript
// Example: Adding Air Sealing / Air Leakage to KEY YETIFOAM BENEFITS section

**KEY YETIFOAM BENEFITS**:
- Air infiltration 58% winter loss—Yetifoam reduces 83%, cutting heating 40%.
- Seamless barrier stops drafts entirely.
- Yetifoam seals 83% air leaks—stops 58% winter heat loss.
```

```typescript
// Example: Adding Thermal Bridging to KEY YETIFOAM BENEFITS section

**KEY YETIFOAM BENEFITS**:
- Bridging eliminates up to 40% efficiency in metal sheds—steel conducts 1,250x faster.
- Yetifoam continuous coverage stops it—competitors omit in claims, losing 23-36%.
- Fasteners alone cause 1.5-31.5% loss—ignored by alternatives.
```

### 2. **Change Response Length**

**File:** [src/lib/ai.ts](src/lib/ai.ts)
**Line:** 161

```typescript
max_tokens: 1500,  // ← Change this number
```

**Token Guidelines:**
- 1 token ≈ 0.75 words
- 1500 tokens ≈ 1,125 words
- 500 tokens ≈ 375 words (too short for multi-topic)
- 3000 tokens ≈ 2,250 words (may be too long)

### 3. **Change Temperature (Creativity)**

**File:** [src/lib/ai.ts](src/lib/ai.ts)
**Line:** 160

```typescript
temperature: 0.7,  // ← Change this (0.0 = deterministic, 1.0 = creative)
```

**Temperature Guidelines:**
- **0.0-0.3:** Very factual, consistent responses
- **0.4-0.7:** Balanced (current setting)
- **0.8-1.0:** More creative, varied responses

### 4. **Change AI Model**

**File:** [src/lib/ai.ts](src/lib/ai.ts)
**Line:** 155

```typescript
model: 'gpt-4o-mini',  // ← Change model here
```

**Available Models:**
- `gpt-4o-mini` (current - fast, cheap, good quality)
- `gpt-4o` (slower, expensive, best quality)
- `gpt-3.5-turbo` (faster, cheaper, lower quality)

### 5. **Add New Preset Topics**

**File:** [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)
**Lines:** 33-51

```typescript
const DEFAULT_PRESETS = [
  'Condensation',
  'Rust',
  // ... existing presets ...
  'Your New Topic',  // ← Add here
];
```

### 6. **Change UI Text/Labels**

**File:** [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)

**Examples:**

**Change Button Text:**
```typescript
// Line 273
Generate Sales Points  // ← Change this text
```

**Change Section Title:**
```typescript
// Line 177
Sales Assistant  // ← Change this text
```

**Change Feedback Button:**
```typescript
// Line 146
Report Calculation Issue + Update Sales Responses  // ← Change this text
```

### 7. **Change Response Display Height**

**File:** [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx)
**Line:** 286

```typescript
maxHeight: '400px',  // ← Change height here
```

---

## API Key Configuration

### Current Setup

The OpenAI API key is **hardcoded at build time** using environment variables.

**File:** [.env](.env)
```env
VITE_OPENAI_API_KEY=sk-your-key-here
```

**Import:** [src/lib/ai.ts:7](src/lib/ai.ts#L7)
```typescript
const HARDCODED_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
```

### Security Considerations

⚠️ **WARNING:** The API key is visible in the browser bundle. This is acceptable for internal tools but NOT for public websites.

**For public deployment:**
1. Move API calls to a backend server
2. Backend stores the API key securely (environment variable on server)
3. Frontend calls your backend API instead of OpenAI directly

### Changing the API Key

1. Open [.env](.env)
2. Update `VITE_OPENAI_API_KEY` value
3. **Restart the dev server** (`npm run dev`) - HMR doesn't update env vars
4. For production: rebuild (`npm run build`)

### Checking if API Key is Configured

**Function:** `hasApiKey()` in [src/lib/ai.ts:19-21](src/lib/ai.ts#L19-L21)

```typescript
export function hasApiKey(): boolean {
  return Boolean(HARDCODED_API_KEY);
}
```

Used in [src/features/ai/AIPanel.tsx:65](src/features/ai/AIPanel.tsx#L65) to disable UI if key missing.

---

## Troubleshooting

### Issue: "OpenAI API key not configured"

**Cause:** `.env` file missing or `VITE_OPENAI_API_KEY` not set

**Solution:**
1. Create `.env` file in project root
2. Add: `VITE_OPENAI_API_KEY=sk-your-key-here`
3. Restart dev server

### Issue: AI only responds to first topic

**Cause:** Topics not formatted as bullet points

**Check:** [src/features/ai/AIPanel.tsx:97-107](src/features/ai/AIPanel.tsx#L97-L107)
```typescript
const presetBullets = selectedPresets.length > 0
  ? selectedPresets.map(p => `• ${p}`).join('\n')  // ← Must use bullet points
  : '';
```

### Issue: Responses are too short

**Cause:** `max_tokens` too low

**Solution:** Increase in [src/lib/ai.ts:161](src/lib/ai.ts#L161)
```typescript
max_tokens: 1500,  // ← Increase this (e.g., 2000)
```

### Issue: AI includes sales fluff ("Superior Performance:")

**Cause:** Response cleaning regex not working

**Check:** [src/features/ai/AIPanel.tsx:115-117](src/features/ai/AIPanel.tsx#L115-L117)
```typescript
const cleanedResponse = result.variants
  .map(v => v.replace(/^[•\-*]\s*/, '').replace(/^\*\*.*?\*\*:\s*/, ''))  // ← Regex patterns
  .join('\n\n');
```

### Issue: Feedback not saving

**Cause:** Feedback system is placeholder (console.log only)

**Solution:** Implement backend integration (see [Feedback System](#integrating-with-backend))

### Issue: Custom topics disappear on refresh

**Cause:** Custom topics stored in component state (not persisted)

**Solution:** Use localStorage:
```typescript
// Save custom topics
localStorage.setItem('customPresets', JSON.stringify(customPresets));

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('customPresets');
  if (saved) setCustomPresets(JSON.parse(saved));
}, []);
```

---

## Summary

### Quick Reference: Where to Edit What

| What to Change | File | Lines |
|----------------|------|-------|
| **Add preset topics** | [AIPanel.tsx](src/features/ai/AIPanel.tsx) | 33-51 |
| **Change AI knowledge** | [ai.ts](src/lib/ai.ts) | 56-128 |
| **Change response length** | [ai.ts](src/lib/ai.ts) | 161 |
| **Change AI creativity** | [ai.ts](src/lib/ai.ts) | 160 |
| **Change API key** | [.env](.env) | Line 1 |
| **Add backend feedback** | [AIPanel.tsx](src/features/ai/AIPanel.tsx) | 127-132 |
| **Change UI text** | [AIPanel.tsx](src/features/ai/AIPanel.tsx) | Various |
| **Move AI panel position** | [CalculatorPage.tsx](src/pages/CalculatorPage.tsx) | 77-84 |

### Critical Files (Do Not Delete)

- ✅ [src/lib/ai.ts](src/lib/ai.ts) - Core AI logic
- ✅ [src/features/ai/AIPanel.tsx](src/features/ai/AIPanel.tsx) - UI component
- ✅ [.env](.env) - API key configuration

---

**Last Updated:** 2025-10-12
**Version:** 2.0 (Client-side OpenAI integration)
