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

#include "bit_utils.h"
#include "print.h"
#include "system_runner.h"

using namespace std;

std::random_device test_rd;
std::mt19937 test_randomizer_engine(test_rd());

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
	int max_iterations = 30000;
	int beesPopulation = 4;
	int beesEmployed = 2;
	int beesOnlooker = 2;
	int beesScout = 1;

	int num_teachers = 14;
	// count teacher with same subject: 11. does this mean there's extra 1 teacher?
	int total_section = 14;
	int num_subjects = 7;

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

	// is there a way to put async function that execute in parallell

	// int limit = (total_section * (num_teachers));
	int limit = (total_section * (num_teachers)) * 3;
	int default_units = 0;

	Timeslot default_fixed_timeslot = 0;

	TimeDuration default_class_duration = 40;
	TimeDuration break_time_duration = 30;
	TimeDuration max_teacher_work_load = 300;
	TimeDuration min_teacher_work_load = 10;
	TimeDuration min_total_class_duration_for_two_breaks = 380;

	int time_division = 10;
	default_class_duration /= time_division;
	break_time_duration /= time_division;
	max_teacher_work_load /= time_division;
	min_teacher_work_load /= time_division;

	int workweek = 1;

	min_total_class_duration_for_two_breaks /= time_division;

	int offset = 2;

	default_class_duration -= offset;
	break_time_duration -= offset;

	int teacher_break_threshold = 4;
	int common_subject_count = 9;

	int teacher_middle_time_point_grow_allowance_for_break_timeslot = 4;

	int num_violation_type = 7;

	int teacher_subjects_length = num_teachers;

	// min_total_class_duration_for_two_breaks /= offset;

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* section_start = allocate(total_section);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);

	int32_t* teacher_week_load_config = allocate(num_teachers);

	int32_t* subject_configuration_subject_fixed_timeslot = allocate(num_subjects);
	int32_t* subject_configuration_subject_fixed_day = allocate(num_subjects);
	int32_t* subject_configuration_subject_duration = allocate(num_subjects);
	int32_t* subject_configuration_subject_units = allocate(num_subjects);
	int32_t* section_configuration = allocate(total_section);

	int32_t* section_subject_configuration = allocate(total_section_subjects);

	// int32_t* subject_fixed_teacher_section = allocate(2);
	int32_t* subject_fixed_teacher_section = allocate(1);
	int32_t* subject_fixed_teacher = allocate(1);

	subject_fixed_teacher_section[0] = -1;

	// subject_fixed_teacher_section[0] = 0;
	// subject_fixed_teacher_section[1] = -1;
	// subject_fixed_teacher[0] = packInt16ToInt32(0, 0);

	for (TeacherID i = 0; i < teacher_subjects_length; ++i) {
		teacher_week_load_config[i] = packInt16ToInt32(max_teacher_work_load, min_teacher_work_load);
	}

	for (TeacherID i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = packInt16ToInt32(i, i % num_subjects);
	}

	for (SectionID i = 0; i < total_section; ++i) {
		section_start[i] = 0;
	}

	// for (int i = 0; i < total_section / 2; ++i) {
	// 	section_start[i] = 0;
	// }

	// for (int i = total_section / 2; i < total_section; ++i) {
	// 	section_start[i] = 20;
	// }

	uint8_t default_fixed_day = assignFixedDay(true, false, false, false, false, false, false, false);

	std::vector<std::vector<int>> subject_configure;
	for (SubjectID subject_id = 0; subject_id < num_subjects; ++subject_id) {
		subject_configure.push_back({subject_id, default_units, default_class_duration, default_fixed_timeslot, default_fixed_day});
	}

	int number_of_subject_configuration = subject_configure.size();
	for (SubjectConfigurationID subject_configuration_id = 0; subject_configuration_id < number_of_subject_configuration; ++subject_configuration_id) {
		SubjectID subject_configuration_subject_id = subject_configure[subject_configuration_id][0];
		int subject_configuration_default_units = subject_configure[subject_configuration_id][1];
		TimeDuration subject_configuration_default_class_duration = subject_configure[subject_configuration_id][2];
		Timeslot subject_configuration_default_fixed_timeslot = subject_configure[subject_configuration_id][3];
		int subject_configuration_default_fixed_day = subject_configure[subject_configuration_id][4];

		subject_configuration_subject_units[subject_configuration_id] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_units);
		subject_configuration_subject_duration[subject_configuration_id] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_class_duration);
		subject_configuration_subject_fixed_timeslot[subject_configuration_id] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_fixed_timeslot);
		subject_configuration_subject_fixed_day[subject_configuration_id] = packInt16ToInt32(subject_configuration_subject_id, subject_configuration_default_fixed_day);
	}

	subject_configuration_subject_units[0] = packInt16ToInt32(0, 1);
	subject_configuration_subject_units[1] = packInt16ToInt32(1, 1);

	for (int16_t section = 0; section < total_section; ++section) {
		for (int16_t subject = 0; subject < num_subjects; ++subject) {
			int index = section * num_subjects + subject;

			if (index >= total_section_subjects) {
				std::cerr << "Index out of bounds: " << index << std::endl;
				delete[] section_subjects;
				delete[] section_subject_configuration;
				return;
			}

			section_subjects[index] = packInt16ToInt32(section, subject);
			section_subject_configuration[index] = packInt16ToInt32(section, subject);
		}
	}

	for (int i = 0; i < total_section; ++i) {
		int num_break = 1;
		// int total_timeslot = 7;  // dependent on subject and their units
		int total_timeslot = 8;  // dependent on subject and their units
		int not_allowed_breakslot_gap = 2;
		int is_dynamic_subject_consistent_duration = 0;

		section_configuration[i] = packInt8ToInt32(num_break, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration);
	}

	// REMINDER:
	// about this config
	// a viable break slot between the two fixed subject but is impossible to get.
	// because they're fixed...
	// REMINDER END

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
	    subject_configuration_subject_units,
	    subject_configuration_subject_duration,
	    subject_configuration_subject_fixed_timeslot,
	    subject_configuration_subject_fixed_day,
	    subject_fixed_teacher_section,
	    subject_fixed_teacher,
	    section_start,
	    teacher_subjects,
	    teacher_week_load_config,

	    teacher_subjects_length,
	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    workweek,

	    break_time_duration,
	    teacher_break_threshold,
	    teacher_middle_time_point_grow_allowance_for_break_timeslot,
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
	delete[] teacher_week_load_config;
	delete[] subject_configuration_subject_fixed_timeslot;
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
	int iteration = 100;

	for (int i = 0; i < iteration; i++) {
		test_generate_timetable();
	}

	std::cout << "done testing" << std::endl;
	return 0;
}