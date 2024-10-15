#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <windows.h>

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

std::random_device test_rd;
std::mt19937 test_randomizer_engine(test_rd());
//
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
	// TODO: dynamic max_iterations base on config'
	int max_iterations = 15000;
	int beesPopulation = 4;
	int beesEmployed = 2;
	int beesOnlooker = 2;
	int beesScout = 1;

	int num_teachers = 90;
	// int num_teachers = 60;
	// count teacher with same subject: 11. does this mean there's extra 1 teacher?
	int total_section = 79;
	// int total_section = 40;
	int num_subjects = 10;

	// 80 section with 10 need 100
	// might TODO: even distribute class to teachers (on modify function) (might be more performant)
	// might TODO: modify function: make it more smarter by knowing what and what not to modify
	// if theres no conflict in section break slot anymore, focus on teacher break slot

	// FIXME: when ignoring consistent subject (same timeslot for every situation),
	// the calculates of viable break slots becomes inaccurate

	// might TODO: treat subjects base on whether or not they are consistent or segmented separately

	// FIXME: teachers class allocation is not efficient. so many gaps (breaks) in teacher class allocation

	// might TODO: teachers are divided beforehand to avoid gaps in teacher class allocation
	// 10 - 5 - 24

	// FIXME: with segmented timeslot, violation checker becomes inaccurate
	// 10 - 6- 24
	// FIXME: address !!!important notes on logs2 folder

	// 10 - 13 - 24 TODO: make all int16 to int

	// 700 t - 320 s - 10 sb - 56mins

	// --------------------------
	// with suggested break slot implementation
	// 700 t - 320 s - 10 sb - 4.5 to 9mins at <12k iteration
	// no segmented timeslot
	//
	// 700 t - 320 s - 8 sb - 3 to 4 at <5k iteration

	// 640 t - 320 s - 320 sb - 10 : 6mins at 8k iteration
	// 600 t - 320 s - 320 sb - 10 : 8mins at 9k iteration
	// 580 t - 320 s - 320 sb - 10 : 8mins at 11k iteration
	// 540 t - 320 s - 320 sb - 10 : 7mins at 9k iteration
	// 420 t - 320 s - 320 sb - 10 : 10 mins at 9k iteration and 50 costs
	// 400 t - 320 s - 320 sb - 10 : 14 mins at 22k iteration and 5 costs
	// 370 t - 320 s - 320 sb - 10 : 14 mins at 30k iteration and 80 costs
	// 60 t - 50 s - 10 sb - 17s to 1m at <3k iteration
	// --------------------------

	// 100k 650 320 10 2.5hrs

	// t 120 sc 40 sb 10 dd 4 w 6 bd 3 - 25sec

	// 50/20/10: 6 to 19

	// is there a way to put async function that execute in parallel

	int limit = total_section * num_teachers;

	int default_units = 0;
	int default_order = 0;
	int default_class_duration = 4;
	int break_time_duration = 3;
	int workweek = 5;
	int break_timeslot_allowance = 6;
	int teacher_break_threshold = 4;
	int common_subject_count = 9;
	int min_total_class_duration_for_two_breaks = common_subject_count * default_class_duration;
	int max_teacher_work_load = 9;
	int teacher_subjects_length = num_teachers;

	int offset = 2;
	default_class_duration -= offset;
	break_time_duration -= offset;
	min_total_class_duration_for_two_breaks /= offset;

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* section_start = allocate(total_section);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);
	int32_t* section_subject_units = allocate(total_section_subjects);
	int32_t* section_subject_duration = allocate(total_section_subjects);
	int32_t* section_subject_order = allocate(total_section_subjects);

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
	}

	for (int i = 0; i < num_teachers; ++i) {
		teacher_subjects[i] = packInt16ToInt32(i, i % num_subjects);
	}

	for (int i = 0; i < total_section; ++i) {
		section_start[i] = 0;
	}

	// for (int i = 0; i < total_section / 2; ++i) {
	// 	section_start[i] = 0;
	// }

	// for (int i = total_section / 2; i < total_section; ++i) {
	// 	section_start[i] = 20;
	// }

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

			// std::cout << "index:  " << index << std::endl;
			// std::cout << "i : " << section << "j " << subject << " default_units " << default_units << std::endl;
			section_subject_units[index] = packInt16ToInt32(subject, default_units);
			section_subject_duration[index] = packInt16ToInt32(subject, default_class_duration);
			section_subject_order[index] = packInt16ToInt32(subject, default_order);
		}
	}

	// REMINDER:
	// about this config
	// a viable break slot between the two fixed subject but is impossible to get.
	// because they're fixed...
	// section_subject_units[0] = packInt16ToInt32(0, 4);
	// section_subject_units[1] = packInt16ToInt32(1, 1);
	// section_subject_order[0] = packInt16ToInt32(0, 1);
	// section_subject_order[1] = packInt16ToInt32(1, 1);
	// section_subject_order[2] = packInt16ToInt32(2, 2);
	// section_subject_duration[2] = packInt16ToInt32(2, 10);
	// REMINDER END
	// section_subject_units[2] = packInt16ToInt32(2, 2);
	// section_subject_units[3] = packInt16ToInt32(3, 3);
	// section_subject_units[4] = packInt16ToInt32(4, 3);
	// section_subject_units[5] = packInt16ToInt32(5, 2);
	// section_subject_units[6] = packInt16ToInt32(6, 4);
	// section_subject_units[10] = packInt16ToInt32(0, 1);
	// section_subject_units[11] = packInt16ToInt32(1, 4);
	// section_subject_units[12] = packInt16ToInt32(2, 2);
	// section_subject_units[13] = packInt16ToInt32(3, 3);
	// section_subject_units[14] = packInt16ToInt32(4, 3);
	// section_subject_units[15] = packInt16ToInt32(5, 2);
	// section_subject_units[16] = packInt16ToInt32(6, 4);

	// section_subject_duration[7] = packInt16ToInt32(7, 10);

	// section_subject_units[0] = packInt16ToInt32(0, 4);
	// section_subject_units[1] = packInt16ToInt32(1, 1);
	// section_subject_order[0] = packInt16ToInt32(0, 1);
	// section_subject_order[1] = packInt16ToInt32(1, 1);
	// section_subject_order[2] = packInt16ToInt32(2, 2);
	// section_subject_duration[2] = packInt16ToInt32(2, 10);

	// section_subject_order[1] = packInt16ToInt32(1, -2);
	// section_subject_order[7] = packInt16ToInt32(7, 1);

	// section_subject_duration[1] = packInt16ToInt32(1, 1);
	// section_subject_units[2] = packInt16ToInt32(2, 1);
	// section_subject_units[3] = packInt16ToInt32(3, 4);

	int64_t* result = new (std::nothrow) int64_t[999];
	int64_t* result_2 = new (std::nothrow) int64_t[999];

	std::cout << "Running experiment with configuration: ";

	std::cout << max_iterations << ", "
	          << beesPopulation << ", "
	          << beesEmployed << ", "
	          << beesOnlooker << ", "
	          << beesScout << ", "
	          << limit << std::endl;

	int result_buff_length = 9999;  // arbitrary

	bool enable_logging = true;

	runExperiment(
	    max_iterations,
	    num_teachers,
	    total_section_subjects,
	    total_section,

	    section_subjects,
	    section_subject_duration,
	    section_subject_order,
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
	    min_total_class_duration_for_two_breaks,
	    default_class_duration,
	    result_buff_length,
	    offset,
	    result,
	    result_2,

	    enable_logging);
}

int main() {
	test_generate_timetable();
	std::cout << "done testing" << std::endl;
	return 0;

	std::vector<std::vector<int>> breaks_combination = getAllBreaksCombination(11, 2, 3);
	//  0
	//  1
	//  2

	//  3
	//  4

	//  5
	//  6
	//  7

	for (auto it = breaks_combination.begin(); it != breaks_combination.end(); ++it) {
		std::cout << "{";
		for (auto it2 = it->begin(); it2 != it->end(); ++it2) {
			std::cout << *it2;
			if (std::next(it2) != it->end()) {
				std::cout << ", ";
			}
		}
		std::cout << "}\n";
	}

	std::cout << "done testing" << std::endl;

	// int iterations = 1000;  // Number of times to call the function
	// std::map<std::vector<int>, int> distribution;

	// for (int i = 0; i < iterations; ++i) {
	// 	std::vector<std::vector<int>> breaks_combination = getAllBreaksCombination(13, 2, 3);
	// 	std::uniform_int_distribution<> dis_break_combination(0, breaks_combination.size() - 1);

	// 	int random_index = dis_break_combination(test_randomizer_engine);

	// 	for (const auto& combination : breaks_combination) {
	// 		distribution[breaks_combination[random_index]]++;
	// 	}
	// }

	// // Print distribution
	// for (const auto& entry : distribution) {
	// 	std::cout << "{";
	// 	for (auto it = entry.first.begin(); it != entry.first.end(); ++it) {
	// 		std::cout << *it;
	// 		if (std::next(it) != entry.first.end()) {
	// 			std::cout << ", ";
	// 		}
	// 	}
	// 	std::cout << "} -> " << entry.second << "\n";
	// }

	return 0;

	// int slot_count = 13;
	// int break_count = 2;
	// int break_count = 2;
	// int gap = 3;
	// int num_iterations = 100000;  // Number of times to repeat the test
	// Map to store combinations and their frequency

	// std::vector<std::vector<int>> test_1 = getAllBreaksCombination(slot_count, break_count, gap);

	// for (auto it = test_1.begin(); it != test_1.end(); ++it) {
	// 	std::cout << "{";
	// 	for (auto it2 = it->begin(); it2 != it->end(); ++it2) {
	// 		std::cout << *it2;
	// 		if (std::next(it2) != it->end()) {
	// 			std::cout << ", ";
	// 		}
	// 	}
	// 	std::cout << "}\n";
	// }

	// std::map<std::set<int>, int> combination_counts;

	// for (int i = 0; i < num_iterations; ++i) {
	// 	std::set<int> result = getRandomBreakSlot(slot_count, break_count, gap);
	// 	// Increment the count of this combination
	// 	combination_counts[result]++;
	// }

	// // Display the results
	// std::cout << "Combinations and their frequencies:\n";
	// for (const auto& pair : combination_counts) {
	// 	std::cout << "{";
	// 	for (auto it = pair.first.begin(); it != pair.first.end(); ++it) {
	// 		std::cout << *it;
	// 		if (std::next(it) != pair.first.end()) {
	// 			std::cout << ", ";
	// 		}
	// 	}
	// 	std::cout << "} -> " << pair.second << " times\n";
	// }

	// std::cout << "done testing" << std::endl;
	return 0;
}

// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js