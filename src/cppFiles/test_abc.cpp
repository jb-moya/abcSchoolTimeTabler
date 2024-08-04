#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "abc.h"

using namespace std;

void test_hello_react() {
	int max_iterations = 70000;
	vector<int> beesPopulations = {5};
	vector<int> beesEmployedOptions = {5};
	vector<int> beesOnlookerOptions = {2};
	vector<int> beesScoutOptions = {2};
	vector<int> limits = {800};  // dependent on no. of school class

	int num_teachers = 7;
	int num_rooms = 7;
	int num_timeslots = 7;

	int32_t* section_subjects = new int32_t[7];
	int32_t* teacher_subjects = new int32_t[num_teachers];

	for (int i = 0; i < num_teachers; ++i) {
		teacher_subjects[i] = -1;
	}

	section_subjects[0] = packInt16ToInt32(0, 1);
	section_subjects[1] = packInt16ToInt32(0, 2);
	section_subjects[2] = packInt16ToInt32(0, 3);
	section_subjects[3] = packInt16ToInt32(0, 4);
	section_subjects[4] = packInt16ToInt32(0, 5);
	section_subjects[5] = packInt16ToInt32(1, 6);
	section_subjects[6] = packInt16ToInt32(1, 7);

	int total_school_class = 7;

	int64_t packed64 = packInt16ToInt64(0, 1, 2, 3);
	std::cout << "test " << packed64 << std::endl;

	std::cout << "total school class : " << total_school_class << std::endl;

	teacher_subjects[0] = packInt16ToInt32(0, 1);
	teacher_subjects[1] = packInt16ToInt32(1, 2);
	teacher_subjects[2] = packInt16ToInt32(2, 3);
	teacher_subjects[3] = packInt16ToInt32(3, 4);
	teacher_subjects[4] = packInt16ToInt32(4, 5);
	teacher_subjects[5] = packInt16ToInt32(5, 6);
	teacher_subjects[6] = packInt16ToInt32(6, 7);

	// int total_section = section_subjects.size();
	int total_section = 1;

	int64_t* result = new int64_t[total_school_class];

	for (int beesPopulation : beesPopulations) {
		for (int beesEmployed : beesEmployedOptions) {
			for (int beesOnlooker : beesOnlookerOptions) {
				for (int beesScout : beesScoutOptions) {
					for (int limit : limits) {
						std::cout << "Running experiment with configuration: "
						          << max_iterations << ", "
						          << beesPopulation << ", "
						          << beesEmployed << ", "
						          << beesOnlooker << ", "
						          << beesScout << ", "
						          << limit << std::endl;
						runExperiment(
						    max_iterations,
						    num_teachers,
						    num_rooms,
						    num_timeslots,
						    total_school_class,
						    total_section,
						    section_subjects,
						    teacher_subjects,
						    beesPopulation,
						    beesEmployed,
						    beesOnlooker,
						    beesScout,
						    limit,
						    result);
					}
				}
			}
		}
	}

	for (int i = 0; i < total_school_class; i++) {
		std::cout << result[i] << std::endl;
	}
}

void unpackInt32ToInt16(int32_t packed, int16_t& first, int16_t& second) {
	first = static_cast<int16_t>(packed >> 16);
	second = static_cast<int16_t>(packed & 0xFFFF);
}

void test_packing_unpacking_integers() {
	int16_t first = 3;
	int16_t second = 1245;

	int32_t packed = packInt16ToInt32(first, second);
	std::cout << "Packed int32_t: " << packed << std::endl;

	int16_t unpackedFirst, unpackedSecond;
	unpackInt32ToInt16(packed, unpackedFirst, unpackedSecond);

	std::cout << "Unpacked first int16_t: " << unpackedFirst << std::endl;
	std::cout << "Unpacked second int16_t: " << unpackedSecond << std::endl;

	std::unordered_map<int16_t, std::vector<int16_t>> sections;

	std::vector<int32_t> inputArray = {197853, 197854, 197855, 197856, 197857, 19785, 32, 33, 34};
	extractSectionSubjects(inputArray, sections);

	for (auto it = sections.begin(); it != sections.end(); ++it) {
		std::cout << std::endl
		          << "Section ID: " << it->first;
		std::cout << " Subjects: ";
		for (int16_t subject_id : it->second) {
			std::cout << subject_id << " ";
		}
	}
}

int main() {
	test_hello_react();

	// for (auto it = sections.begin(); it != sections.end(); ++it) {
	// 	int32_t packed = packInt16ToInt32(it->first, it->second[0]);
	// 	std::cout << std::endl << "Packed int32_t: " << packed;
	// }

	// // Test data
	// int arr1[] = {1, 2, 3, 4, 5};       // Sum = 15
	// int arr2[] = {6, 7, 8, 9, 10};      // Sum = 40
	// int arr3[] = {11, 12, 13, 14, 15};  // Sum = 65

	// int* arrays[] = {arr1, arr2, arr3};
	// int sizes[] = {5, 5, 5};  // Sizes of each array
	// int numArrays = 3;

	// // Expected sum: 15 + 40 + 65 = 120

	// int result = sumOfArrays(arrays, sizes, numArrays);

	// // Print the result
	// printf("Total sum of all arrays: %d\n", result);

	// // Check if the result is as expected
	// if (result == 120) {
	// 	printf("Test passed.\n");
	// } else {
	// 	printf("Test failed.\n");
	// }

	return 0;
}
