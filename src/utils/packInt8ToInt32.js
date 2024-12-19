function packInt8ToInt32(first, second, third, fourth) {
    let result =
        (first << 24) |
        ((second & 0xff) << 16) |
        ((third & 0xff) << 8) |
        (fourth & 0xff);
    return result | 0; // Ensure it stays a 32-bit signed integer
}

export default packInt8ToInt32;