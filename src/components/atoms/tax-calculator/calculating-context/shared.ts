import type {
  AppliedCredit,
  AppliedDeduction,
  CreditKey,
  DeductionKey,
} from "../types";

export function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function roundMoney(n: number): number {
  return Math.round(n);
}

export function applySimpleDeduction(
  key: DeductionKey,
  label: string,
  enteredAmount: number,
  deductibleAmount: number,
  reason?: string
): AppliedDeduction {
  return {
    key,
    label,
    enteredAmount: clampNonNegative(enteredAmount),
    deductibleAmount: clampNonNegative(deductibleAmount),
    reason,
  };
}

export function applySimpleCredit(
  key: CreditKey,
  label: string,
  enteredAmount: number,
  appliedAmount: number,
  reason?: string
): AppliedCredit {
  return {
    key,
    label,
    enteredAmount: clampNonNegative(enteredAmount),
    appliedAmount: clampNonNegative(appliedAmount),
    reason,
  };
}

export function sum(nums: readonly number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}
