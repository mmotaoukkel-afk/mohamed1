/**
 * Simple password hashing utility for React Native
 * Uses a basic but consistent hashing approach
 */

/**
 * Simple hash function for password encryption
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
    if (!password) return '';

    try {
        const salt = 'salt_key_2025_secure';
        const combined = password + salt;

        // Simple hash using character codes
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        // Convert to hex string and add some complexity
        const hexHash = Math.abs(hash).toString(16).padStart(8, '0');

        // Add more entropy by creating multiple passes
        let finalHash = hexHash;
        for (let i = 0; i < 3; i++) {
            let passHash = 0;
            for (let j = 0; j < finalHash.length; j++) {
                passHash = ((passHash << 5) - passHash) + finalHash.charCodeAt(j);
                passHash = passHash & passHash;
            }
            finalHash += Math.abs(passHash).toString(16).padStart(8, '0');
        }

        return 'hash_v1_' + finalHash;
    } catch (error) {
        console.warn('Password hashing failed:', error);
        // Return a consistent fallback
        return 'hash_v1_' + password.split('').map(c => c.charCodeAt(0).toString(16)).join('');
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
    // Check if it starts with our hash prefix
    return str.startsWith('hash_v1_');
};
