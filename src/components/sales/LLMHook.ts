export function getSalesPrompt(context: any) {
  // Build prompt dynamically from form context and rules.
  // Will be replaced in later creative phase.
  return `
  You are a sales assistant for YetiFoam.
  Follow these rules: ${JSON.stringify(context.rules)}
  Context: ${JSON.stringify(context.form)}
  `;
}
