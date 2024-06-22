export function generateUniqueId(prefix) {
    // Ensure the prefix is a two-letter string
    if (typeof prefix !== 'string' || prefix.length !== 2) {
        throw new Error('Prefix must be a two-letter string');
    }

    const randomNumber = Math.floor(Math.random() * 9000000) + 1000000;

    // Combine the prefix and the random number to form the unique ID
    return `${prefix}${randomNumber}`;
}