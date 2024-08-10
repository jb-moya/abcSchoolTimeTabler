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
/* eslint-disable no-undef */
/* eslint-disable  no-restricted-globals */
/* eslint-disable  no-unused-expressions */
/* eslint-disable import/no-amd */
// export default Module;
// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js
void test_hello_react() {
	int max_iterations = 20000;
	int beesPopulation = 11;
	int beesEmployed = 5;
	int beesOnlooker = 5;
	int beesScout = 1;
	std::cout << "size: " << std::endl;

	int num_rooms = 7;
	int num_teachers = 7;
	int num_timeslots = 6;

	int total_section = 7;
	int num_subjects = 7;
	int total_school_class = total_section * num_subjects;
	int limit = num_timeslots * num_teachers;  // dependent on no. of school class
	// int limit = 10;  // dependent on no. of school class

	int32_t* section_subjects = new (std::nothrow) int32_t[total_school_class];
	if (!section_subjects) {
		std::cerr << "Failed to allocate memory for section_subjects" << std::endl;
		return;
	}

	int teacher_subjects_length = 7;

	int32_t* teacher_subjects = new (std::nothrow) int32_t[teacher_subjects_length];
	if (!teacher_subjects) {
		std::cerr << "Failed to allocate memory for teacher_subjects" << std::endl;
		delete[] section_subjects;
		return;
	}

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
	}

	teacher_subjects[0] = packInt16ToInt32(0, 0);
	teacher_subjects[1] = packInt16ToInt32(1, 1);
	teacher_subjects[2] = packInt16ToInt32(2, 2);
	teacher_subjects[3] = packInt16ToInt32(3, 3);
	teacher_subjects[4] = packInt16ToInt32(4, 4);
	teacher_subjects[5] = packInt16ToInt32(5, 5);
	teacher_subjects[6] = packInt16ToInt32(6, 6);

	for (int16_t i = 0; i < total_section; ++i) {
		for (int16_t j = 0; j < num_subjects; ++j) {
			int index = i * num_subjects + j;
			if (index >= total_school_class) {
				std::cerr << "Index out of bounds: " << index << std::endl;
				delete[] section_subjects;
				delete[] teacher_subjects;
				return;
			}
			section_subjects[index] = packInt16ToInt32(i, j);
		}
	}
	int64_t* result = new (std::nothrow) int64_t[total_school_class];

	std::cout << "Running experiment with configuration: ";

	std::cout << max_iterations << ", "
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
	    teacher_subjects_length,
	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    result);

	// for (int i = 0; i < total_school_class; i++) {
	// 	std::cout << result[i] << std::endl;
	// }
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

	int total_section = 7;
	int num_subjects = 7;
	int total_school_class = total_section * num_subjects;

	int32_t* section_subjects = new int32_t[total_school_class];

	for (int16_t i = 0; i < total_section; ++i) {
		for (int16_t j = 0; j < num_subjects; ++j) {
			section_subjects[i * num_subjects + j] = packInt16ToInt32(i, j);
			std::cout << i << " " << j << " " << section_subjects[i * num_subjects + j] << std::endl;
		}
	}

	for (int i = 0; i < total_school_class; i++) {
		int16_t unpackedFirst, unpackedSecond;

		unpackedFirst = static_cast<int16_t>(section_subjects[i] >> 16);
		unpackedSecond = static_cast<int16_t>(section_subjects[i]);
		std::cout << "unpackedFirst: " << unpackedFirst << " unpackedSecond: " << unpackedSecond << std::endl;
	}
}

int main() {
	test_hello_react();
	// test_packing_unpacking_integers();
	std::cout << "done testing" << std::endl;
	return 0;
}
