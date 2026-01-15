export type ApprovedDocId =
  | "tax-act-2025"
  | "tax-administration-act-2025"
  | "nigeria-revenue-service-establishment-act-2025"
  | "joint-revenue-board-establishment-act-2025";

export type DocGrade = {
  score: number;
  label: "A" | "B" | "C" | "D";
  reason: string;
};

export type ApprovedDocCatalogItem = {
  id: ApprovedDocId;
  title: string;
  shortTitle: string;
  filename: string;
  url: string;
  approved: true;
  grade: DocGrade;
  keywords: string[];
  description: string;
};

/**
 * Approved docs served from `public/docs/*`.
 *
 * IMPORTANT:
 * - Only docs listed here will be available in the UI + retrieval system.
 * - Do not add non-approved/draft PDFs here.
 */
export const APPROVED_DOCS: readonly ApprovedDocCatalogItem[] = [
  {
    id: "tax-act-2025",
    title: "Nigeria Tax Act, 2025 (Final Approved Copy for Print)",
    shortTitle: "Tax Act 2025",
    filename: "Final Approved Copy for Print  NIGERIA TAX ACT 2025.pdf",
    url: "/docs/Final Approved Copy for Print  NIGERIA TAX ACT 2025.pdf",
    approved: true,
    grade: {
      score: 100,
      label: "A",
      reason: "Final approved copy for print.",
    },
    keywords: [
      "tax act",
      "personal income tax",
      "rates",
      "brackets",
      "section",
      "allowance",
      "deduction",
      "exemption",
      "chargeable income",
      "assessable income",
      "vat",
      "withholding",
      "stamp duty",
    ],
    description:
      "Primary reference for tax provisions, definitions, rates/brackets, reliefs, deductions, and general tax rules.",
  },
  {
    id: "tax-administration-act-2025",
    title: "Nigeria Tax Administration Act, 2025 (Approved Copy to Print)",
    shortTitle: "Tax Administration Act 2025",
    filename: "Approved Copy to Print NIGERIA TAX ADMINISTRATION ACT, 2025.pdf",
    url: "/docs/Approved Copy to Print NIGERIA TAX ADMINISTRATION ACT, 2025.pdf",
    approved: true,
    grade: {
      score: 95,
      label: "A",
      reason: "Approved copy to print.",
    },
    keywords: [
      "tax administration",
      "filing",
      "returns",
      "assessment",
      "enforcement",
      "penalty",
      "interest",
      "audit",
      "objection",
      "appeal",
      "tin",
      "registration",
      "payment",
    ],
    description:
      "Processes and obligations: registration, filing/returns, assessments, penalties, audits, disputes/appeals, payments.",
  },
  {
    id: "nigeria-revenue-service-establishment-act-2025",
    title:
      "Nigeria Revenue Service (Establishment) Act, 2025 (Approved Copy to Print)",
    shortTitle: "Nigeria Revenue Service Act 2025",
    filename:
      "Approved Copy to Print. Nigeria Revenue Service (Establishment) Act, 2025-1.pdf",
    url: "/docs/Approved Copy to Print. Nigeria Revenue Service (Establishment) Act, 2025-1.pdf",
    approved: true,
    grade: {
      score: 92,
      label: "A",
      reason: "Approved copy to print.",
    },
    keywords: [
      "revenue service",
      "nigeria revenue service",
      "nrs",
      "establishment",
      "functions",
      "powers",
      "governance",
      "collection",
      "administration",
      "compliance",
    ],
    description:
      "Institutional framework and powers of the Nigeria Revenue Service: governance, functions, administration and enforcement roles.",
  },
  {
    id: "joint-revenue-board-establishment-act-2025",
    title:
      "Joint Revenue Board of Nigeria (Establishment) Act, 2025 (Approved Copy to Print)",
    shortTitle: "Joint Revenue Board Act 2025",
    filename:
      "Approved Copy to Print Joint Revenue Board of Nigeria (Establishment) Act, 2025 B.pdf",
    url: "/docs/Approved Copy to Print Joint Revenue Board of Nigeria (Establishment) Act, 2025 B.pdf",
    approved: true,
    grade: {
      score: 90,
      label: "A",
      reason: "Approved copy to print.",
    },
    keywords: [
      "joint revenue board",
      "jrb",
      "establishment",
      "coordination",
      "harmonization",
      "tax administration",
      "intergovernmental",
      "board",
      "committee",
    ],
    description:
      "Coordination and intergovernmental framework: Joint Revenue Board establishment, functions and governance.",
  },
] as const;

export const DEFAULT_APPROVED_DOC_ID: ApprovedDocId = "tax-act-2025";

export function getApprovedDocById(
  id: ApprovedDocId
): ApprovedDocCatalogItem {
  const doc = APPROVED_DOCS.find((d) => d.id === id);
  if (!doc) {
    throw new Error(`Approved doc not found: ${id}`);
  }
  return doc;
}


