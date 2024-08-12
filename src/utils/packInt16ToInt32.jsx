function packInt16ToInt32(first, second) {
    let result = ((first & 0xffff) << 16) | (second & 0xffff);
    return result;
}

// Example usage
let packed32 = packInt16ToInt32(1, 1);
// console.log(packed32); // Outputs the packed 32-bit integer

export default packInt16ToInt32