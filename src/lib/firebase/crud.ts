import { get, ref, remove, set, update } from 'firebase/database';
import { ZodType } from 'zod';

import { db } from './init';

// Base CRUD helpers used across firebase modules
export const createOperation = async <T>(
  path: string,
  data: Omit<T, 'id'>,
  schema: any
) => {
  const validatedData = schema.parse(data);
  const newRef = ref(db, path);
  await set(newRef, validatedData);
  return validatedData as T;
};

export const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

export const updateOperation = async <T>(path: string, data: Partial<T>, schema: any) => {
  const current = (await readOperation<T>(path)) as T | null;
  const validatedData = schema.parse({ ...(current as any), ...data });
  await update(ref(db, path), validatedData);
  return validatedData as T;
};

export const deleteOperation = async (path: string) => {
  await remove(ref(db, path));
};

export interface BatchOperation<T> {
  id: string;
  data: Partial<T>;
}

export const batchOperation = async <T>(
  paths: string[],
  data: Partial<T>[],
  schema: ZodType
): Promise<T[]> => {
  if (paths.length !== data.length) {
    throw new Error('Paths and data arrays must have the same length');
  }

  const updates: { [key: string]: any } = {};
  const results: T[] = [];

  // Validate all data first
  for (let i = 0; i < paths.length; i++) {
    const currentData = await readOperation<T>(paths[i]);
    const mergedData = { ...(currentData || {}), ...data[i] };
    const validatedData = schema.parse(mergedData);
    
    // Add to batch update
    updates[paths[i]] = validatedData;
    results.push(validatedData as T);
  }

  // Perform batch update
  if (Object.keys(updates).length > 0) {
    await update(ref(db, '/'), updates);
  }

  return results;
};
