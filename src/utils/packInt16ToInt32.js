function packInt16ToInt32(first, second) {
    first = Number(first);
    second = Number(second);

    let result = ((first & 0xffff) << 16) | (second & 0xffff);
    return result;
}

function unpackInt32ToInt16(packed) {
    let first = (packed >> 16) & 0xffff; // Extract the higher 16 bits
    let second = packed & 0xffff; // Extract the lower 16 bits

    // Restore the sign for 16-bit integers
    if (first > 0x7fff) first -= 0x10000;
    if (second > 0x7fff) second -= 0x10000;

    return { first, second };
}

// Example usage
// const packed = [
//     { first: 1, second: 1 },
//     { first: 100, second: 999 },
//     { first: -1, second: -1 },
//     { first: -100, second: -999 },
//     { first: -2, second: 0 },
// ];

// packed.forEach((item) => {
//     const { first, second } = item;
//     const packedValue = packInt16ToInt32(first, second);
//     const unpacked = unpackInt32ToInt16(packedValue);
//     console.log(
//         `Packed: ${packedValue}, Unpacked: ${unpacked.first}, ${unpacked.second}`
//     );
// });

export default packInt16ToInt32;
export { unpackInt32ToInt16 };
