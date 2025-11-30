/**
 * Simple password hashing utility using SHA-256
 * For production, consider using bcrypt or argon2
 */

/**
 * Simple hash function for password encryption
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
    if (!password) return '';

    try {
        // Create a simple hash using multiple iterations
        let hash = password;

        // Apply multiple rounds of encoding for better security
        for (let i = 0; i < 1000; i++) {
            const encoder = new TextEncoder();
            const data = encoder.encode(hash + 'salt_key_2025');

            // Use crypto subtle if available (web/modern environments)
            if (typeof crypto !== 'undefined' && crypto.subtle) {
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                // Fallback for React Native environments
                // Simple character code transformation
                hash = btoa(hash + 'salt_key_2025').split('').reverse().join('');
            }
        }

        return hash;
    } catch (error) {
        console.warn('Password hashing failed:', error);
        // Fallback to base64 encoding if hashing fails
        return btoa(password + 'fallback_salt');
    }
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - True if password matches
 */
export const verifyPassword = async (password, hash) => {
    const hashedInput = await hashPassword(password);
    return hashedInput === hash;
};

/**
 * Check if a string is already hashed (basic check)
 * @param {string} str - String to check
 * @returns {boolean} - True if appears to be hashed
 */
export const isHashed = (str) => {
    if (!str) return false;
    // Simple heuristic: hashed passwords are longer and contain only hex characters or base64
    return str.length > 50 && /^[a-f0-9]+$|^[A-Za-z0-9+/=]+$/.test(str);
};
