// hello_react.c

#include <assert.h>
#include <stdio.h>

void hello() {
    printf("Hello, React!\n");
}

void process_data(double* input, double* output, int size) {
    int i;

    assert(size > 0 && "size must be positive");
    assert(input && output && "must be valid pointers");

    for (i = 0; i < size; i++) {
        output[i] = input[i] * input[i];
    }
}

int main() {
    double input[] = {1.0, 2.0, 3.0};
    double output[3];
    int size = 3;

    process_data(input, output, size);
    printf("Output: %f, %f, %f\n", output[0], output[1], output[2]);
    return 0;
}