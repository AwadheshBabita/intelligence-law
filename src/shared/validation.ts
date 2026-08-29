import type { ValidationIssue, ValidationResult } from "./types.js";

export const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function resultFrom(issues: readonly ValidationIssue[]): ValidationResult {
  return issues.length === 0 ? { ok: true, issues: [] } : { ok: false, issues };
}

export function isIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
