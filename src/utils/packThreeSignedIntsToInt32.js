function packThreeSignedIntsToInt32(first, second, third) {
    // Check if the inputs are within the specified ranges
    if (
        first < -(1 << 9) ||
        first >= 1 << 9 ||
        second < -(1 << 9) ||
        second >= 1 << 9 ||
        third < -(1 << 11) ||
        third >= 1 << 11
    ) {
        throw new RangeError('Input integers are out of range.');
    }

    // Compute the packed 32-bit integer
    const result = ((first + (1 << 9)) << 22) | ((second + (1 << 9)) << 12) | (third + (1 << 11));

    // Force unsigned 32-bit interpretation
    const unsignedResult = result >>> 0;


    // const result = (((first + (1 << 9)) & 0x3ff) << 22) | (((second + (1 << 9)) & 0x3ff) << 12) | ((third + (1 << 11)) & 0x7ff);
    // Log the binary representation of the result
    console.log(result.toString(2));
    console.log(unsignedResult.toString(2));

    // return result;
    return unsignedResult;
}

function unpackThreeSignedIntsFromInt32(packed) {
    const MAX_FIRST_SECOND = 1 << 9; // 2^9
    const MAX_THIRD = 1 << 11; // 2^11

    // Extract and unshift each component
    let first = (packed >> 22) & 0x3ff; // Extract first 10 bits
    let second = (packed >> 12) & 0x3ff; // Extract next 10 bits
    let third = packed & 0xfff; // Extract last 12 bits

    // Adjust back to signed range
    first -= MAX_FIRST_SECOND;
    second -= MAX_FIRST_SECOND;
    third -= MAX_THIRD;

    return { first, second, third };
}

function runTests() {
    const testCases = [
        // Test Case 1: Basic values within range
        { first: 0, second: 0, third: 0 },
        { first: 0, second: 0, third: 1 },
        { first: 0, second: 0, third: 2 },
        { first: 1, second: 1, third: 0 },
        { first: 100, second: 100, third: 0 },
    ];

    console.log('Running tests...');

    testCases.forEach(({ first, second, third }, index) => {
        try {
            console.log(`Test Case ${index + 1}: first=${first}, second=${second}, third=${third}`);
            const packed = packThreeSignedIntsToInt32(first, second, third);
            console.log(`Packed: ${packed} (binary: ${packed.toString(2).padStart(32, '0')})`);

            const unpacked = unpackThreeSignedIntsFromInt32(packed);
            console.log(`Unpacked:`, unpacked);

            // Verify correctness
            if (unpacked.first !== first || unpacked.second !== second || unpacked.third !== third) {
                console.error('Test failed: Unpacked values do not match original inputs.');
            } else {
                console.log('Test passed!');
            }
        } catch (error) {
            console.error(`Test failed with error: ${error.message}`);
        }
        console.log('---');
    });
}

runTests();

console.log('packThreeSignedIntsToInt32');

export { packThreeSignedIntsToInt32, unpackThreeSignedIntsFromInt32 };
