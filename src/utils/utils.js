const findInObject = (obj, keys, values) => {
    // Iterate over each entry in the object
    for (const key in obj) {
        // console.log("key", key);
        if (Object.hasOwn(obj, key)) {
            const propertyArray = obj[key];
            console.log("propertyArray", propertyArray);

            for (const property of propertyArray) {
                if (
                    property[[keys[0]]] === values[0] &&
                    property[[keys[1]]] === values[1] &&
                    property[[keys[2]]] === values[2]
                ) {
                    return property;
                }
            }
        }
    }
    return null; // Return null if no matching entry is found
};

export default findInObject;

// const obj = {
//     a: { x: 1, y: 2, z: 4 },
//     b: { x: 4, y: 5, z: 6 },
//     c: { x: 1, y: 2, z: 3 },
// };

// const result = findInObject(obj, ["x", "y", "z"], [1, 2, 4]);
// const obj2 = {
//     a: { x: 1, y: 2, z: 3 },
//     b: { x: 4, y: 5, z: 6 },
// };

// const result2 = findInObject(obj2, ["x", "y", "z"], [1, 2, 4]);

// console.log("result", result, result2);
