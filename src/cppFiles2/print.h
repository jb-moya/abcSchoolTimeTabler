// print.h
#ifndef PRINT_H
#define PRINT_H
// #include <iostream>
#include "abc2.h"

#define BLACK "\033[30m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN "\033[36m"
#define WHITE "\033[37m"
#define BLACK_B "\033[90m"
#define RED_B "\033[91m"
#define GREEN_B "\033[92m"
#define YELLOW_B "\033[93m"
#define BLUE_B "\033[94m"
#define MAGENTA_B "\033[95m"
#define CYAN_B "\033[96m"
#define WHITE_B "\033[97m"

#define BLACK_BG "\033[40m"
#define RED_BG "\033[41m"
#define GREEN_BG "\033[42m"
#define YELLOW_BG "\033[43m"
#define BLUE_BG "\033[44m"
#define MAGENTA_BG "\033[45m"
#define CYAN_BG "\033[46m"
#define WHITE_BG "\033[47m"
#define BLACK_BG_B "\033[100m"
#define RED_BG_B "\033[101m"
#define GREEN_BG_B "\033[102m"
#define YELLOW_BG_B "\033[103m"
#define BLUE_BG_B "\033[104m"
#define MAGENTA_BG_B "\033[105m"
#define CYAN_BG_B "\033[106m"
#define WHITE_BG_B "\033[107m"

#define BOLD "\033[1m"
#define DIM "\033[2m"
#define UNDERLINE "\033[4m"
#define BLINK "\033[5m"
#define REVERSE "\033[7m"
#define HIDDEN "\033[8m"
#define STRIKETHROUGH "\033[9m"
#define RESET "\033[0m"

// Function to handle the base case with no arguments
void print();
void printSchoolClasses(Timetable& timetable);

// Templated function to print multiple arguments with a separator
template <typename T, typename... Args>
void print(T first, Args... args) {
	std::cout << first;
	if constexpr (sizeof...(args) > 0) {
		std::cout << " - ";
		print(args...);  // Recursively call the function with remaining arguments
	} else {
		std::cout << RESET << std::endl;
	}
};


#endif  // PRINT_H
