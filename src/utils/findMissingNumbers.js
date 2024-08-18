function findMissingNumbers(arr) {
    // Create an array with numbers 1 to 5
    const numbersToCheck = [1, 2, 3, 4, 5];

    // Filter out the numbers that are not in the input array
    const missingNumbers = numbersToCheck.filter((num) => !arr.includes(num));

    // Return the missing numbers
    return missingNumbers;
}

// Example usage:
const inputArray = [1, 2, 4]; // Example array
const missingNumbers = findMissingNumbers(inputArray);
console.log("Missing numbers:", missingNumbers); // Output will be: [3, 5]

export default findMissingNumbers;