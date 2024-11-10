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

#include "print.h"

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

void test_generate_timetable() {
	// TODO: dynamic max_iterations base on config'
	int max_iterations = 10000;
	int beesPopulation = 4;
	int beesEmployed = 2;
	int beesOnlooker = 2;
	int beesScout = 1;

	int num_teachers = 18;
	// count teacher with same subject: 11. does this mean there's extra 1 teacher?
	int total_section = 18;
	int num_subjects = 9;

	// oct 19, 2024

	// 80 section with 10 need 100
	// might TODO: even distribute class to teachers (on modify function) (might be more performant)
	// oct 28 tried. this might not be beneficial at all

	// FIXME: LIMIT NOT REACHING

	// might TODO: modify function: make it more smarter by knowing what and what not to modify
	// if theres no conflict in section break slot anymore, focus on teacher break slot

	// might TODO: treat subjects base on whether or not they are consistent or segmented separately

	// FIXME: with segmented timeslot, violation checker becomes inaccurate
	// 10 - 6- 24
	// FIXME: address !!!important notes on logs2 folder

	// is there a way to put async function that execute in parallel

	int limit = (total_section * (num_teachers)) * .5;
	int default_units = 0;
	int default_order = 0;

	int default_class_duration = 40;
	int break_time_duration = 30;
	int max_teacher_work_load = 900;
	int min_total_class_duration_for_two_breaks = 380;

	int time_division = 10;
	default_class_duration /= time_division;
	break_time_duration /= time_division;
	max_teacher_work_load /= time_division;
	min_total_class_duration_for_two_breaks /= time_division;

	int offset = 2;

	default_class_duration -= offset;
	break_time_duration -= offset;

	int workweek = 1;
	int teacher_break_threshold = 4;
	int common_subject_count = 9;

	// from schedule example
	// regular section with 1 break only has 350mins

	// print("default_class_duration", default_class_duration);
	// print("break_time_duration", break_time_duration);
	// print("max_teacher_work_load", max_teacher_work_load);
	// print("min_total_class_duration_for_two_breaks", min_total_class_duration_for_two_breaks);

	// return;

	int num_violation_type = 7;

	int teacher_subjects_length = num_teachers;

	// min_total_class_duration_for_two_breaks /= offset;

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* section_start = allocate(total_section);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);

	int32_t* teacher_max_weekly_load = allocate(num_teachers);

	int32_t* subject_configuration_subject_order = allocate(num_subjects);
	int32_t* subject_configuration_subject_duration = allocate(num_subjects);
	int32_t* subject_configuration_subject_units = allocate(num_subjects);
	int32_t* section_configuration = allocate(total_section);

	int32_t* section_subject_configuration = allocate(total_section_subjects);

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
		teacher_max_weekly_load[i] = max_teacher_work_load;
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

	std::vector<std::vector<int>> subject_configure;
	for (int i = 0; i < num_subjects; ++i) {
		subject_configure.push_back({i, default_units, default_class_duration, default_order});
	}

	int number_of_subject_configuration = subject_configure.size();
	for (int i = 0; i < number_of_subject_configuration; ++i) {
		int subject_configuration_subject_id = subject_configure[i][0];
		int subject_configuration_default_units = subject_configure[i][1];
		int subject_configuration_default_class_duration = subject_configure[i][2];
		int subject_configuration_default_order = subject_configure[i][3];

		subject_configuration_subject_units[i] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_units);
		subject_configuration_subject_duration[i] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_class_duration);
		subject_configuration_subject_order[i] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_order);
	}

	for (int16_t section = 0; section < total_section; ++section) {
		for (int16_t subject = 0; subject < num_subjects; ++subject) {
			int index = section * num_subjects + subject;

			if (index >= total_section_subjects) {
				std::cerr << "Index out of bounds: " << index << std::endl;
				delete[] section_subjects;
				delete[] section_start;
				delete[] teacher_subjects;
				delete[] teacher_max_weekly_load;
				delete[] subject_configuration_subject_order;
				delete[] subject_configuration_subject_duration;
				delete[] subject_configuration_subject_units;
				delete[] section_configuration;
				delete[] section_subject_configuration;
				return;
			}

			section_subjects[index] = packInt16ToInt32(section, subject);
			section_subject_configuration[index] = packInt16ToInt32(section, subject);
		}
	}

	for (int i = 0; i < total_section; ++i) {
		int num_break = 1;
		int total_timeslot = 10;
		int not_allowed_breakslot_gap = 3;
		int is_dynamic_subject_consistent_duration = 0;

		section_configuration[i] = packInt8ToInt32(num_break, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration);
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
	// section_subject_units[0] = packInt16ToInt32(0, 2);
	// section_subject_units[1] = packInt16ToInt32(1, 1);
	// section_subject_order[0] = packInt16ToInt32(0, 1);
	// section_subject_order[1] = packInt16ToInt32(1, 1);
	// section_subject_order[0] = packInt16ToInt32(0, 2);
	// section_subject_order[1] = packInt16ToInt32(1, 3);
	// section_subject_order[2] = packInt16ToInt32(2, 4);
	// section_subject_duration[2] = packInt16ToInt32(2, 10);
	// section_subject_order[1] = packInt16ToInt32(1, -2);
	// section_subject_order[7] = packInt16ToInt32(7, 1);
	// section_subject_duration[1] = packInt16ToInt32(1, 1);
	// section_subject_units[2] = packInt16ToInt32(2, 1);
	// section_subject_units[3] = packInt16ToInt32(3, 4);

	int64_t* resultTimetable = new (std::nothrow) int64_t[total_section * (total_section_subjects)];
	int64_t* resultTimetable_2 = new (std::nothrow) int64_t[total_section * (total_section_subjects)];
	int64_t* resultViolation = new (std::nothrow) int64_t[num_violation_type * total_section + num_violation_type * num_teachers];

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
	    number_of_subject_configuration,

	    section_configuration,
	    section_subject_configuration,
	    section_subjects,
	    subject_configuration_subject_units,
	    subject_configuration_subject_duration,
	    subject_configuration_subject_order,
	    section_start,
	    teacher_subjects,
	    teacher_max_weekly_load,

	    teacher_subjects_length,
	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    workweek,

	    max_teacher_work_load,
	    break_time_duration,
	    teacher_break_threshold,
	    min_total_class_duration_for_two_breaks,
	    default_class_duration,
	    result_buff_length,
	    offset,
	    resultTimetable,
	    resultTimetable_2,
	    resultViolation,

	    enable_logging);

	// Free allocated memory
	delete[] section_subjects;
	delete[] section_start;
	delete[] teacher_subjects;
	delete[] teacher_max_weekly_load;
	delete[] subject_configuration_subject_order;
	delete[] subject_configuration_subject_duration;
	delete[] subject_configuration_subject_units;
	delete[] section_configuration;
	delete[] section_subject_configuration;
	delete[] resultTimetable;
	delete[] resultTimetable_2;
	delete[] resultViolation;

	// for (int i = 0; i < result_buff_length; i++) {
	// 	std::cout << result[i] << std::endl;
	// }
}

void printVector(const std::vector<int>& vec) {
	for (int num : vec) {
		std::cout << std::setw(3) << num << " ";
	}
	std::cout << std::endl;
}

int main() {
	for (int i = 0; i < 1; i++) {
		test_generate_timetable();
	}

	std::cout << "done testing" << std::endl;
	return 0;

	// std::vector<std::vector<int>> breaks_combination = getAllBreaksCombination(12, 2, 3, 3);

	// for (auto it = breaks_combination.begin(); it != breaks_combination.end(); ++it) {
	// 	std::cout << "{";
	// 	for (auto it2 = it->begin(); it2 != it->end(); ++it2) {
	// 		std::cout << *it2;
	// 		if (std::next(it2) != it->end()) {
	// 			std::cout << ", ";
	// 		}
	// 	}
	// 	std::cout << "}\n";
	// }

	// int size = 7;
	// int shift = 6;

	// std::vector<int> vec;
	// for (int i = 0; i < size; i++) {
	// 	vec.push_back(i);
	// }

	// std::rotate(vec.rbegin(), vec.rbegin() + shift, vec.rend());  // Rotate by one

	// std::cout << "Rotated vector: ";
	// for (int num : vec) {
	// 	std::cout << num << " ";  // Output: 5 1 2 3 4
	// }

	// RotaryTimeslot rotary_timeslot;

	// // Example sizes to get timeslots
	// // std::vector<int> sizes = {9, 9, 9, 9, 9, 9, 5, 7, 9, 11, 13, 15, 10, 10, 10, 10, 10, 10, 10, 10, 3, 3, 3, 4, 4, 5, 4, 5, 6, 10, 12, 14, 16, 18, 9, 7, 10, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25};
	// // std::vector<int> sizes = {10, 10, 10, 10, 10, 10, 10, 10, 13, 13, 13, 13, 10, 12, 11};
	// std::vector<int> sizes = {10, 10, 9, 8, 7, 6, 7, 8, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10};

	// std::vector<std::vector<int>> skip = {{3}, {3}, {3}, {3}, {3}, {3}, {3}, {3}, {3}, {3}, {3}, {3, 7}, {3, 7}, {3, 7}, {3, 7}, {3, 7}, {3, 7}, {3}, {3}};

	// // Loop to demonstrate getting timeslots and incrementing shift
	// int i = 0;
	// for (int size : sizes) {
	// 	rotary_timeslot.adjustPosition(size - skip[i].size());
	// 	std::vector<int> timeslot = rotary_timeslot.getTimeslot(size, skip[i]);
	// 	printVector(timeslot);
	// 	rotary_timeslot.incrementShift();

	// 	i++;.
	// }

	SubjectTeacherQueue subject_teacher_queue;

	subject_teacher_queue.addTeacher(1, 1, 10);
	subject_teacher_queue.addTeacher(1, 2, 10);
	subject_teacher_queue.addTeacher(1, 3, 10);
	subject_teacher_queue.addTeacher(2, 4, 10);
	subject_teacher_queue.addTeacher(3, 4, 2);

	// print("ff", subject_teacher_queue.getTeacher(1, 5));
	// print("ff", subject_teacher_queue.getTeacher(1, 5));
	// print("ff", subject_teacher_queue.getTeacher(1, 5));
	// print("ff", subject_teacher_queue.getTeacher(1, 5));
	// print("ff", subject_teacher_queue.getTeacher(1, 5));
	// print("ff", subject_teacher_queue.getTeacher(1, 4));
	// print("ff", subject_teacher_queue.getTeacher(1, 1));
	// print("ff", subject_teacher_queue.getTeacher(1, 1));
	// print("ff", subject_teacher_queue.getTeacher(2, 1));
	// print("ff", subject_teacher_queue.getTeacher(2, 9));
	// print("ff", subject_teacher_queue.getTeacher(2, 1));
	// print("ff", subject_teacher_queue.getTeacher(3, 1));
	// print("ff", subject_teacher_queue.getTeacher(3, 1));
	// print("ff", subject_teacher_queue.getTeacher(3, 1));

	subject_teacher_queue.resetQueue();

	std::cout << "done testing" << std::endl;

	return 0;
}

// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js