import { auth } from '../firebase.js';
import { validatePassword } from 'firebase/auth';
/**
 * 
 * @param {*} password 
 * @returns Status Object of the Password Policy Validation. True if valid, false with details otherwise.
 */
export const validateAHFULPasswordPolicy = async (password) => {
  const status = await validatePassword(auth, password);
  return status; // Returns true if password meets policy, false /w details otherwise
}