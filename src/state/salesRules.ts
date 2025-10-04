export const salesRules = {
  tone: "friendly, confident, professional",
  structure: [
    "Greet the user by suburb",
    "Mention local weather/wind context (if available)",
    "Explain structural advantages",
    "Finish with a confident sales suggestion"
  ],
  aiGuidelines: {
    contextInjection: true,
    factCheck: true,
    quoteFormatting: true
  }
};
