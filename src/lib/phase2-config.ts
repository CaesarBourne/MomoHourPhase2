/**
 * Which bouquet — AND which service — a Phase 2 window can reference isn't
 * a free choice, it's fixed by report type (docus/MOMO-HOUR-PHASE2.md
 * §4.8/§5.1): Bundle reports only ever tie to BQ1's past drops and its
 * synthetic `bundle_manual` service (never BQ1's REAL services —
 * buyairtime, databundle-fixed, databundle-flexi, broadband — those are
 * never valid choices here). Jumo Loan Repayment reports tie to BQ5, which
 * has no fixed service at all. Shared between WindowForm (creation) and
 * WindowServiceEditor (correcting an existing window) so both enforce the
 * exact same mapping. Add a new entry here if a third report type/bouquet/
 * service triple is ever introduced.
 */
export const REPORT_TYPES = [
  { extBouquetId: 'BQ1', serviceKey: 'bundle_manual', label: 'Bundle' },
  { extBouquetId: 'BQ5', serviceKey: null, label: 'Jumo Loan Repayments' }
] as const;

export function fixedServiceKeyForBouquet(extBouquetId: string): string | null {
  return REPORT_TYPES.find(r => r.extBouquetId === extBouquetId)?.serviceKey ?? null;
}
