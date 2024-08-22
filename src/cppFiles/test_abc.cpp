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

int32_t* allocate(int size) {
	int32_t* static_array = new (std::nothrow) int32_t[size];

	if (!static_array) {
		std::cerr << "Failed to allocate memory for static array" << std::endl;
		return nullptr;
	}

	return static_array;
}

void unpackInt32ToInt16(int32_t packed, int16_t& first, int16_t& second) {
	first = static_cast<int16_t>(packed >> 16);
	second = static_cast<int16_t>(packed & 0xFFFF);
}

void test_hello_react() {
	int max_iterations = 90000;
	int beesPopulation = 10;
	int beesEmployed = 5;
	int beesOnlooker = 5;
	int beesScout = 1;
	int limit = 90;

	int num_teachers = 40 ;
	int total_section = 3 ;
	int num_subjects = 3 ;
	int teacher_subjects_length = num_teachers;
	int default_units = 0;  // 0 means everyday
	int workweek = 5;

	// 500 x 20 x 5

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);
	int32_t* section_subject_units = allocate(total_section_subjects);

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
	}

	for (int i = 0; i < num_teachers; ++i) {
		teacher_subjects[i] = packInt16ToInt32(i, i % num_subjects);
	}

	// teacher_subjects[0] = packInt16ToInt32(0, 0);
	// teacher_subjects[1] = packInt16ToInt32(1, 1);
	// teacher_subjects[2] = packInt16ToInt32(2, 0);
	// teacher_subjects[3] = packInt16ToInt32(3, 1);
	// teacher_subjects[2] = packInt16ToInt32(2, 2);

	for (int16_t section = 0; section < total_section; ++section) {
		for (int16_t subject = 0; subject < num_subjects; ++subject) {
			int index = section * num_subjects + subject;

			if (index >= total_section_subjects) {
				std::cerr << "Index out of bounds: " << index << std::endl;
				delete[] section_subjects;
				delete[] teacher_subjects;
				return;
			}

			section_subjects[index] = packInt16ToInt32(section, subject);

			std::cout << "index:  " << index << std::endl;
			// std::cout << "i : " << section << "j " << subject << " default_units " << default_units << std::endl;
			section_subject_units[index] = packInt16ToInt32(subject, default_units);
		}
	}

	section_subject_units[0] = packInt16ToInt32(0, 3);
	section_subject_units[1] = packInt16ToInt32(1, 2);
	// section_subject_units[2] = packInt16ToInt32(2, 3);
	// section_subject_units[3] = packInt16ToInt32(3, 1);

	int total_class_block = 0;
	for (int i = 0; i < total_section_subjects; ++i) {
		int16_t unpackedFirst, unpackedSecond;
		unpackInt32ToInt16(section_subject_units[i], unpackedFirst, unpackedSecond);
		total_class_block += unpackedSecond == 0 ? 1 : unpackedSecond;
	}

	std::cout << "total_class_block: " << total_class_block << std::endl;

	int64_t* result = new (std::nothrow) int64_t[total_class_block];

	std::cout << "Running experiment with configuration: ";

	std::cout << max_iterations << ", "
	          << beesPopulation << ", "
	          << beesEmployed << ", "
	          << beesOnlooker << ", "
	          << beesScout << ", "
	          << limit << std::endl;

	int result_buff_length = total_class_block;  // arbitrary

	runExperiment(
	    max_iterations,
	    num_teachers,
	    total_section_subjects,
	    total_class_block,
	    total_section,
	    section_subjects,
	    teacher_subjects,
	    section_subject_units,
	    teacher_subjects_length,
	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    workweek,
	    result_buff_length,
	    result);
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

void test_combine() {
	int32_t first = 3;
	int32_t second = 1245;
	int32_t combined = combine(first, second);

	std::cout << "Combined int32_t: " << combined << std::endl;

	int16_t unpackedFirst, unpackedSecond;
	std::cout << "extracted : " << extractFirst(combined) << " " << extractSecond(combined) << std::endl;

	int first2 = 0;
	int second2 = 55;
	int third2 = 10;

	int combined2 = combine(first2, second2, third2);

	std::cout << "Combined int32_t: " << combined2 << std::endl;
	std::cout << extractFirst(combined2) << " " << extractSecond(combined2) << " " << extractThird(combined2) << std::endl;
}

int main() {
	test_hello_react();
	// test_combine();
	// test_packing_unpacking_integers();
	std::cout << "done testing" << std::endl;
	return 0;
}

/* eslint-disable no-undef */
/* eslint-disable  no-restricted-globals */
/* eslint-disable  no-unused-expressions */
/* eslint-disable import/no-amd */
// export default Module;
// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js