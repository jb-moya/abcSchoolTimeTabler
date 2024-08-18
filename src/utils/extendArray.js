function extendArray(arr, otherArray) {
    // Check if otherArray is an array
    if (!Array.isArray(otherArray)) {
        throw new TypeError("Argument must be an array");
    }

    // Add elements from otherArray to arr
    otherArray.forEach(function (v) {
        arr.push(v);
    });

    // Return the modified array
    return arr;
}

// Example usage:
const myArray = [1, 2, 3];
const anotherArray = [4, 5];
extendArray(myArray, anotherArray);
console.log(myArray); // Output: [1, 2, 3, 4, 5]

export default extendArray;