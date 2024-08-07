#include <iostream>

// extern "C" makes sure that the compiler does not mangle the name
extern "C" {
void* allocateMemory(size_t size) {
	return malloc(size);
}

void deallocateMemory(void* ptr) {
	free(ptr);
}

void fillMemoryWithData(int32_t* buffer, int32_t* data, size_t dataSize) {
	std::memcpy(buffer, data, dataSize * sizeof(int32_t));
}

int add(int a, int b) {
	int n = 1000000000;

	int count = 0;
	for (int i = 0; i <= n; i++) {
		// bool isPrime = true;
		// for (int j = 2; j * j <= i; j++) {
		// 	if (i % j == 0) {
		// 		isPrime = false;
		// 		break;
		// 	}
		// }
		// if (isPrime) count++;
	}

	// printf("count: %d\n", count);

	return a + b;
}
}