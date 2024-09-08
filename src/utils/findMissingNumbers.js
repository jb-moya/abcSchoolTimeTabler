function findMissingNumbers(numbersToCheck, arr) {
    const missingNumbers = numbersToCheck.filter((num) => !arr.includes(num));
    return missingNumbers;
}

// Example usage:
// const inputArray = [1, 2, 4]; // Example array
// const missingNumbers = findMissingNumbers(inputArray);
// console.log("Missing numbers:", missingNumbers); // Output will be: [3, 5]

export default findMissingNumbers;