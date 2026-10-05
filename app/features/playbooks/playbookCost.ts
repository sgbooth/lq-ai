/** Informational reference estimate, matching the legacy preview's token budget.
 * Rates are explicit assumptions, not live prices or deployment billing configuration.
 * The backend executes the deployment's `smart` alias, which may route elsewhere.
 */
export const playbookCostAssumptions = {
  model: "claude-sonnet-4-6",
  inputRate: 3,
  outputRate: 15,
  classifyInput: 2000,
  classifyOutput: 600,
  redlineInput: 2000,
  redlineOutput: 800,
  redlineProbability: 1 / 3,
};
export function estimatePlaybookCost(positionCount: number): number {
  const a = playbookCostAssumptions;
  return (
    (positionCount *
      ((a.classifyInput + a.redlineProbability * a.redlineInput) * a.inputRate +
        (a.classifyOutput + a.redlineProbability * a.redlineOutput) * a.outputRate)) /
    1_000_000
  );
}
export function formatCostUSD(amount: number): string {
  return amount > 0 && amount < 0.01 ? "< $0.01" : `$${amount.toFixed(2)}`;
}
