export default function chunkArray(arr, size) {
    if (size <= 0) throw new Error('Chunk size must be a positive integer');

    const result = [];
    let startIndex = 0;

    while (startIndex < arr.length) {
        result.push(arr.slice(startIndex, startIndex + size));
        startIndex += size;
    }

    return result;
}

function testChunkingPerformance() {
    // Create a large array to test
    const largeArray = Array.from({ length: 1_000_000 }, (_, i) => i + 1); // Array of 1 million elements

    // Test chunkArray with 5000 size chunks
    console.time('Chunking performance');
    const chunkedArray = chunkArray(largeArray, 5000);
    console.timeEnd('Chunking performance');

    // Optionally, print a sample of the result to verify
    console.log('Sample chunk:', chunkedArray[0]);
}

// Run the test
testChunkingPerformance();