/**
 * AI/LLM client utilities
 * Uses hardcoded API key from environment variables at build time
 */

// API key is injected at build time from environment variables
const HARDCODED_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * Get the hardcoded API key
 */
export function getApiKey(): string {
  return HARDCODED_API_KEY;
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return Boolean(HARDCODED_API_KEY);
}

interface SalesPointsRequest {
  context: {
    dimensions: string;
    pitch: string;
    cladding: string;
    sprayTotal: string;
  };
  prompt?: string;
}

interface SalesPointsResponse {
  variants: string[];
  closing: string;
}

const DEFAULT_VARIANTS = [
  'Standard foam application provides excellent insulation for this configuration.',
  'Consider premium options for enhanced thermal performance.',
];

const DEFAULT_CLOSING = "Let's discuss the best solution for your shed.";

/**
 * Generate sales points using OpenAI API
 */
export async function askSalesPoints(
  request: SalesPointsRequest
): Promise<SalesPointsResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in environment variables');
  }

  const systemPrompt = `You are a sales assistant for Yetifoam, a closed-cell spray polyurethane foam (ccSPF) insulation company in Australia.

**YOUR CRITICAL ROLE**: For EACH topic provided, you MUST address ALL relevant aspects comprehensively. Provide 3-5 direct factual statements PER TOPIC that salespeople can use with customers. NO sales fluff, NO bold headings, NO bullet points with titles - just clear statements.

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
- Neat finish - NO LININGS NEEDED (can add plaster later if wanted)

**COMPETITOR FLAWS** (CRITICAL - use when addressing ANY alternative):

**REFLECTIVE FOIL/AIRCELL/ANTI-CON**:
- Requires complete roof removal (voids warranty on new sheds)
- Degrades entirely within 5 years due to dust (Kingspan admits this in technical docs)
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
"Removing the roof to install Anti-con will void the warranty on your new shed, which can lead to significant long-term costs. Anti-con also degrades entirely within 5 years due to dust accumulation on the reflective surface - even Kingspan admits this in their technical documentation. It provides 0-13% winter benefit at most, and in some cases actually makes sheds colder by minus 5% because it only reflects radiant heat, but there's no sun radiation coming into an unheated shed in winter. Anti-con is not a vapour barrier, so condensation will still form on your metal surfaces causing rust. It's also not designed for retrofitting - it requires complete demolition of your existing roof structure."`;

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

If multiple topics are listed, address them ALL separately and thoroughly.`;

  try {
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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as any)?.error?.message || `API request failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Invalid response from OpenAI API');
    }

    // Parse the response to extract variants and closing
    const parsed = parseAIResponse(content);

    return {
      variants: parsed.variants.length > 0 ? parsed.variants : DEFAULT_VARIANTS,
      closing: parsed.closing || DEFAULT_CLOSING,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return defaults on error
    return {
      variants: DEFAULT_VARIANTS,
      closing: DEFAULT_CLOSING,
    };
  }
}

/**
 * Parse AI response to extract structured data
 */
function parseAIResponse(content: string): { variants: string[]; closing: string } {
  const variants: string[] = [];
  let closing = '';

  // Split by lines and look for bullet points or numbered items
  const lines = content.split('\n').map((line) => line.trim());

  let inVariants = true;
  for (const line of lines) {
    if (!line) continue;

    // Check if line is a bullet point or numbered item
    const bulletMatch = line.match(/^[•\-*]\s*(.+)$/);
    const numberMatch = line.match(/^\d+[\.)]\s*(.+)$/);

    if (bulletMatch && inVariants) {
      variants.push(bulletMatch[1].trim());
    } else if (numberMatch && inVariants) {
      variants.push(numberMatch[1].trim());
    } else if (
      line.toLowerCase().includes('closing') ||
      line.toLowerCase().includes('summary')
    ) {
      inVariants = false;
    } else if (!inVariants && line.length > 10) {
      closing = line;
      break;
    }
  }

  // If no structured format found, use the whole content as first variant
  if (variants.length === 0) {
    const sentences = content.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 0) {
      variants.push(sentences[0]);
      if (sentences.length > 1) {
        closing = sentences[sentences.length - 1];
      }
    }
  }

  return { variants, closing };
}
