function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
        console.log(`a: ${a}, b: ${b}`); // Debugging line to show the values of a and b
    }

    return a;
}

function gcdOfArray(numbers) {
    console.log("🚀 ~ gcdOfArray ~ numbers:", numbers)
    
    if (numbers.length === 0) {
        return null;
    }

    if (numbers.length === 1) {
        return numbers[0];
    }
    return numbers.reduce((acc, num) => gcd(acc, num));
}

export default gcdOfArray;