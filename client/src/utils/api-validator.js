import { z } from 'zod';

/**
 * Validates data against a Zod schema.
 * Throws a formatted error if validation fails.
 */
export const validateData = (schema, data, label = 'Data') => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    console.error(`❌ Validation failed for ${label}:`, errorMessages);
    throw new Error(`Invalid ${label}: ${errorMessages}`);
  }
  return result.data;
};

/**
 * Creates a validated async function.
 * Useful for wrapping API calls.
 */
export const withValidation = (schema, asyncFn, label) => {
  return async (...args) => {
    const data = await asyncFn(...args);
    return validateData(schema, data, label);
  };
};
