// Regular expression for MongoDB ObjectID validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validates if a string is a valid MongoDB ObjectID
 * @param id - The string to validate
 * @returns boolean - True if the string is a valid MongoDB ObjectID
 */
export function isValidObjectId(id: string): boolean {
  return objectIdRegex.test(id);
} 