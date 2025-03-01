// Utility functions for managing the UID in localStorage

// Key used for storing the UID in localStorage
const AUTH_USER_UID_KEY = 'authUserUid';

/**
 * Set the UID of the authenticated user in localStorage
 * @param {string} uid - The UID of the authenticated user
 */
export const setAuthUserUid = (uid) => {
    if (typeof uid === 'string') {
        localStorage.setItem(AUTH_USER_UID_KEY, uid);
    } else {
        console.error('UID must be a string.');
    }
};

/**
 * Get the UID of the authenticated user from localStorage
 * @returns {string|null} The UID of the authenticated user or null if not found
 */
export const getAuthUserUid = () => {
    return localStorage.getItem(AUTH_USER_UID_KEY);
};

/**
 * Remove the UID of the authenticated user from localStorage
 */
export const clearAuthUserUid = () => {
    localStorage.removeItem(AUTH_USER_UID_KEY);
};
