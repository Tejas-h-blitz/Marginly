import { Prisma } from '@prisma/client';
import { ModelPricingItem } from '../config/defaultPricing.js';

export type Money = Prisma.Decimal;

export const zeroMoney = (): Money => new Prisma.Decimal(0);

export function toMoneyString(value: Money): string {
  return value.toFixed();
}

export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricingItem
): Money {
  const inputCost = new Prisma.Decimal(pricing.costPer1kInput)
    .mul(inputTokens)
    .div(1000);
  const outputCost = new Prisma.Decimal(pricing.costPer1kOutput)
    .mul(outputTokens)
    .div(1000);
  return inputCost.plus(outputCost);
}

export function parseMonthlyRevenue(value: unknown): Money {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Monthly revenue must be a non-negative number with up to two decimal places.');
  }
  const text = String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Monthly revenue must be a non-negative number with up to two decimal places.');
  }
  const amount = new Prisma.Decimal(text);
  if (amount.greaterThan('999999999999.99')) {
    throw new Error('Monthly revenue exceeds the supported maximum.');
  }
  return amount;
}

export function monthDateRange(month: string): { gte: Date; lt: Date } {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1))
  };
}

export function validateMonth(month: unknown): string | undefined {
  if (month === undefined) return undefined;
  if (typeof month !== 'string') {
    throw new Error('Month must be YYYY-MM or all.');
  }
  if (month === 'all') return month;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Month must be YYYY-MM or all.');
  }
  return month;
}
