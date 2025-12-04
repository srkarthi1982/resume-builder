import { randomUUID } from 'node:crypto';

export const nowIso = (): string => new Date().toISOString();

export const createId = (): string => randomUUID();

export const ensureUpdateData = <T extends Record<string, unknown>>(data: T): T => {
  if (Object.keys(data).length === 0) {
    throw new Error('No update fields provided for update operation.');
  }
  return data;
};
