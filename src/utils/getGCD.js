// function gcd(a, b) {
//     // Base case: if b is 0, return a
//     if (b === 0) {
//         return a;
//     }
//     // Recursive case
//     return gcd(b, a % b);
// }

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }

    return a;
}

function gcdOfArray(numbers) {
    if (numbers.length === 0) {
        return null; // No common divisors
    }

    if (numbers.length === 1) {
        return numbers[0]; // Return the single number
    }
    return numbers.reduce((acc, num) => gcd(acc, num));
}

export default gcdOfArray;

// Test cases
// const testCases = [
//     { input: [60, 45, 30], expected: 15 },
//     { input: [12, 15, 18], expected: 3 },
//     { input: [8, 12, 16], expected: 4 },
//     { input: [7, 13, 19], expected: 1 }, // No common divisors other than 1
//     { input: [100, 25, 50], expected: 25 },
//     { input: [0, 45, 30], expected: 15 }, // GCD of a number and 0 is the number itself
//     { input: [0, 0, 0], expected: 0 }, // GCD of all zeros is undefined; assuming 0
//     { input: [1, 1, 1], expected: 1 }, // GCD of all ones is 1
//     { input: [42], expected: 42 }, // Single input, GCD is the number itself
//     { input: [], expected: null }, // No input numbers
//     { input: [40, 30], expected: 10 },
// ];

// testCases.forEach(({ input, expected }, index) => {
//     const result = gcdOfArray(input);
//     console.log(
//         `Test Case ${index + 1}:`,
//         result === expected
//             ? 'Passed'
//             : `Failed (Got ${result}, Expected ${expected})`
//     );
// });
