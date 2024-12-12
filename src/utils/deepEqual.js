function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true; // Same reference or both null
    if (
        typeof obj1 !== 'object' ||
        obj1 === null ||
        typeof obj2 !== 'object' ||
        obj2 === null
    )
        return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false; // Recursively check nested objects
    }

    return true;
}


// test

let obj1 = { a: 1, b: 2 };
let obj2 = { a: 1, b: 2 };

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: 1, b: 2 };
obj2 = { a: 1, c: 2 };

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = {};
obj2 = {};

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: { x: 1, y: 2 }, b: 3 };
obj2 = { a: { x: 1, y: 2 }, b: 3 };

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: { x: 1, y: 2 }, b: 3 };
obj2 = { a: { x: 1, y: 3 }, b: 3 };

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = { a: 1 };
obj2 = 1;

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = null;
obj2 = undefined;

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = { a: 1, b: 2 };
obj2 = obj1;

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = [1, 2, 3];
obj2 = [1, 2, 3];

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = [1, 2, 3];
obj2 = { a: 1, b: 2, c: 3 };

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = [1, [2, 3]];
obj2 = [1, [2, 3]];

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: function() { return 1; }, b: 2 };
obj2 = { a: function() { return 1; }, b: 2 };

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = new Date('2024-12-09T00:00:00Z');
obj2 = new Date('2024-12-09T00:00:00Z');

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = {};
obj1.self = obj1;

console.log("must be true", deepEqual(obj1, obj1)); // true

obj1 = { a: NaN };
obj2 = { a: NaN };

console.log("must be false", deepEqual(obj1, obj2)); // false

obj1 = { a: undefined, b: 2 };
obj2 = { a: undefined, b: 2 };

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: { b: { c: 1 } } };
obj2 = { a: { b: { c: 1 } } };

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = { a: { b: { c: { d: { e: 1 } } } } };
obj2 = { a: { b: { c: { d: { e: 1 } } } } };

console.log("must be true", deepEqual(obj1, obj2)); // true

obj1 = {};
obj2 = {};
for (let i = 0; i < 1000; i++) {
    obj1[`key${i}`] = { value: i };
    obj2[`key${i}`] = { value: i };
}

console.log("must be true", deepEqual(obj1, obj2)); // true


obj1 = { 
  a: { 
    x: 1, 
    y: { z: 3, w: { v: 5, u: [1, 2, 3] } } 
  },
  b: [4, 5, 6], 
  c: { d: { e: 7, f: { g: 8 } } }
};

obj2 = { 
  a: { 
    x: 1, 
    y: { z: 3, w: { v: 5, u: [1, 2, 4] } } 
  },
  b: [4, 5, 6], 
  c: { d: { e: 7, f: { g: 8 } } }
};

console.log("must be false", deepEqual(obj1, obj2)); // false


obj1 = { 
  a: { 
    x: 1, 
    y: { z: 3, w: { v: 5, u: [1, 2, 3] } } 
  },
  b: [4, 5, 6], 
  c: { d: { e: 7, f: { g: 8 } } }
};

obj2 = { 
  a: { 
    x: 1, 
    y: { z: 3, w: { v: 5, u: [1, 2, 3] } } 
  },
  b: [4, 5, 6], 
  c: { d: { e: 7, f: { g: 8 } } }
};

console.log("must be true", deepEqual(obj1, obj2)); // true