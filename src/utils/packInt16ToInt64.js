import bigInt from "big-integer";

function packToInt64(first, second, third, fourth, fifth) {
    let result = bigInt(0);
    result = result.or(bigInt(first).and(0xffff).shiftLeft(48));
    result = result.or(bigInt(second).and(0xffff).shiftLeft(32));
    result = result.or(bigInt(third).and(0xffff).shiftLeft(16));
    result = result.or(bigInt(fourth).and(0xff).shiftLeft(8)); // Shift left by 8
    result = result.or(bigInt(fifth).and(0xff)); // No shift needed
    return result;
}

function unpackIntegers(packed64) {
    let bigPacked64 = bigInt(packed64);

    let first = bigPacked64.shiftRight(48).and(0xffff).toJSNumber();
    let second = bigPacked64.shiftRight(32).and(0xffff).toJSNumber();
    let third = bigPacked64.shiftRight(16).and(0xffff).toJSNumber();
    let fourth = bigPacked64.shiftRight(8).and(0xff).toJSNumber(); // Shift right by 8
    let fifth = bigPacked64.and(0xff).toJSNumber();

    console.log("hays : ", first, second, third, fourth, fifth);
    return [first, second, third, fourth, fifth];
}

// Example usage
let packed64 = packToInt64(0, 1, 2, 3, 4);
let unpacked = unpackIntegers(589825);
console.log(packed64.toString()); // Outputs the packed 64-bit integer as a string
console.log(unpacked);

export default packToInt64;
export { unpackIntegers };
