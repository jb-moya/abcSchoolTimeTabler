#include <iostream>

int main() {
	// Outer loop 1
	for (int i = 0; i < 3; ++i) {
		// Middle loop 2
		for (int j = 0; j < 3; ++j) {
			// Inner loop 3
			for (int k = 0; k <= 18; ++k) {
				// Compute the sum of i, j, and k
				int counter = i + j + k;
				std::cout << "i: " << i << ", j: " << j << ", k: " << k << ", counter: " << counter << std::endl;
			}
		}
	}

	return 0;
}
