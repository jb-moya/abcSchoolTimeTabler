import bigInt from 'big-integer';


function packInt16ToInt64(first, second, third, fourth) {
    let result = bigInt(0);
    result = result.or(bigInt(first).and(0xFFFF).shiftLeft(48));
    result = result.or(bigInt(second).and(0xFFFF).shiftLeft(32));
    result = result.or(bigInt(third).and(0xFFFF).shiftLeft(16));
    result = result.or(bigInt(fourth).and(0xFFFF));
    return result;
}

function unpackInt64ToInt16(packed64) {
    // Create a bigInt from the packed 64-bit integer
    let bigPacked64 = bigInt(packed64);

    // Extract each 16-bit segment
    let fourth = bigPacked64.and(0xffff).toJSNumber();
    let third = bigPacked64.shiftRight(16).and(0xffff).toJSNumber();
    let second = bigPacked64.shiftRight(32).and(0xffff).toJSNumber();
    let first = bigPacked64.shiftRight(48).and(0xffff).toJSNumber();

    return [ first, second, third, fourth ];
}

// Example usage
let packed64 = packInt16ToInt64(0, 1, 2, 3);
let unpacked = unpackInt64ToInt16(packed64);
console.log(packed64.toString()); // Outputs the packed 64-bit integer as a string
console.log(unpacked); // Outputs: { first: 0, second: 1, third: 2, fourth: 3 }

export default packInt16ToInt64;
export { unpackInt64ToInt16 };