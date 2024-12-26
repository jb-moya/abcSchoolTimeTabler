function packThreeSignedIntsToInt32(first, second, third) {
    const MAX_FIRST_SECOND = 1 << 9; // 2^9
    const MAX_THIRD = 1 << 11; // 2^11

    if (
        first < -MAX_FIRST_SECOND ||
        first >= MAX_FIRST_SECOND ||
        second < -MAX_FIRST_SECOND ||
        second >= MAX_FIRST_SECOND ||
        third < -MAX_THIRD ||
        third >= MAX_THIRD
    ) {
        throw new RangeError('Input integers are out of range.');
    }

    const packed =
        ((first + MAX_FIRST_SECOND) << 22) |
        ((second + MAX_FIRST_SECOND) << 12) |
        (third + MAX_THIRD);

    // console.log(packed.toString(2).padStart(32, '0')); // Output as 32-bit binary string

    return packed;
}

function unpackThreeSignedIntsFromInt32(packed) {
    // console.log('unpacking');

    const MAX_FIRST_SECOND = 1 << 9; // 2^9
    const MAX_THIRD = 1 << 11; // 2^11

    let first = (packed >> 22) & 0x3ff; // Extract first 10 bits
    let second = (packed >> 12) & 0x3ff; // Extract next 10 bits
    let third = packed & 0xfff; // Extract last 12 bits

    first -= MAX_FIRST_SECOND;
    second -= MAX_FIRST_SECOND;
    third -= MAX_THIRD;

    // console.log(first.toString(2).padStart(32, '0')); // First number in binary
    // console.log(second.toString(2).padStart(32, '0')); // Second number in binary
    // console.log(third.toString(2).padStart(32, '0')); // Third number in binary

    return { first, second, third };
}

export { packThreeSignedIntsToInt32, unpackThreeSignedIntsFromInt32 };
