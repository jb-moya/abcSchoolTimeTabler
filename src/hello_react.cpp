#include "hello_react.h"

#include <iostream>


void hello_react() {
	std::cout << "Hello, React from C++!" << std::endl;
}

void process_data(int value) {
	std::cout << "Processing value: " << value << std::endl;
}

// // hello_react.c

// #include <assert.h>
// #include <stdio.h>

// void hello() {
//     printf("Hello, React!\n");
// }

// double testing(double a) {
//     printf("Testing!\n");
//     return a * a; 
// }

// void process_data(double* input, double* output, int size) {
//     int i;

//     assert(size > 0 && "size must be positive");
//     assert(input && output && "must be valid pointers");

//     for (i = 0; i < size; i++) {
//         output[i] = input[i] * testing(input[i]);
//     }
// }
