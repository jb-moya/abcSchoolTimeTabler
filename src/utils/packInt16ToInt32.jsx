function packInt16ToInt32(first, second) {
    let result = ((first & 0xffff) << 16) | (second & 0xffff);
    return result;
}

function unpackInt32ToInt16(packed) {
    let first = (packed >> 16) & 0xffff; // Extract the higher 16 bits
    let second = packed & 0xffff; // Extract the lower 16 bits
    return { first, second };
}

// Example usage
let packed32 = packInt16ToInt32(1, 1);
// console.log(packed32); // Outputs the packed 32-bit integer

export default packInt16ToInt32;
export { unpackInt32ToInt16 };
