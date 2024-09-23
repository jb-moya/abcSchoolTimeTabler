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

#include "abc2.h"

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

void test_generate_timetable() {
	int max_iterations = 20000;
	int beesPopulation = 6;
	int beesEmployed = 3;
	int beesOnlooker = 3;
	int beesScout = 1;

	int num_teachers =  50;
	int total_section =  10;
	int num_subjects = 10;

	// 100k 650 320 10 2.5hrs

	// t 120 sc 40 sb 10 dd 4 w 6 bd 3 - 25sec

	// 640/320/10 56 cost 63 mins

	//
	//                before  98 - 89 - 48 - 41 - 53 seconds
	//                now     25 - 27 - 35 - 36 - 39
	//                        V
	// 9 15 30  45   50    60 120
	// 3 5  10  15   20    20 40   320
	// 3 3  6    9   10    12 10   10

	// int limit = total_section * num_subjects;
	int limit = total_section * num_teachers;

	// int break_timeslot_allowance = 12;
	int default_units = 0;  // 0 means everyday
	// int default_duration = 1;
	// int default_duration = 4;
	int default_class_duration = 2;
	// int workweek = 1;
	int workweek = 5;
	int break_time_duration = 1;
	int break_timeslot_allowance = 6;

	int teacher_break_threshold = 4;
	int min_classes_for_two_breaks = 10;
	// int break_time_duration = 3;

	int max_teacher_work_load = 9;
	int teacher_subjects_length = num_teachers;

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* section_start = allocate(total_section);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);
	int32_t* section_subject_units = allocate(total_section_subjects);
	int32_t* section_subject_duration = allocate(total_section_subjects);

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
	}

	for (int i = 0; i < num_teachers; ++i) {
		teacher_subjects[i] = packInt16ToInt32(i, i % num_subjects);
	}

	for (int i = 0; i < total_section; ++i) {
		section_start[i] = 0;
	}

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
			section_subject_duration[index] = packInt16ToInt32(subject, default_class_duration);
		}
	}

	section_subject_units[0] = packInt16ToInt32(0, 1);
	section_subject_units[1] = packInt16ToInt32(1, 1);
	// section_subject_units[2] = packInt16ToInt32(2, 7);

	// section_subject_duration[0] = packInt16ToInt32(0, 5);
	// section_subject_duration[1] = packInt16ToInt32(1, 1);

	// section_subject_units[2] = packInt16ToInt32(2, 1);
	// section_subject_units[3] = packInt16ToInt32(3, 4);

	int total_class_block = 0;
	for (int i = 0; i < total_section_subjects; ++i) {
		int16_t unpackedFirst, unpackedSecond;
		unpackInt32ToInt16(section_subject_units[i], unpackedFirst, unpackedSecond);
		total_class_block += unpackedSecond == 0 ? 1 : unpackedSecond;
	}

	// for (int i = 0; i < total_section; ++i) {
	// 	total_class_block += 2;
	// }

	std::cout << "total_class_block: " << total_class_block << std::endl;

	int64_t* result = new (std::nothrow) int64_t[999];

	std::cout << "Running experiment with configuration: ";

	std::cout << max_iterations << ", "
	          << beesPopulation << ", "
	          << beesEmployed << ", "
	          << beesOnlooker << ", "
	          << beesScout << ", "
	          << limit << std::endl;

	int result_buff_length = 999;  // arbitrary

	runExperiment(
	    max_iterations,
	    num_teachers,
	    total_section_subjects,
	    total_class_block,
	    total_section,

	    section_subjects,
	    section_subject_duration,
	    section_start,
	    teacher_subjects,
	    section_subject_units,
	    teacher_subjects_length,

	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    workweek,

	    max_teacher_work_load,
	    break_time_duration,
	    break_timeslot_allowance,
	    teacher_break_threshold,
	    min_classes_for_two_breaks,
	    default_class_duration,
	    result_buff_length,
	    result);
}

int main() {
	test_generate_timetable();
	// test_calculatePositions();
	std::cout << "done testing" << std::endl;
	return 0;
}

// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js