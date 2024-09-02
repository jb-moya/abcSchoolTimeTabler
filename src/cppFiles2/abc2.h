#ifndef ABC2_H
#define ABC2_H

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
#include <map>
#include <random>
#include <set>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

// using namespace std;

struct SchoolClass {
	int16_t subject_id;
	int16_t teacher_id;
};

struct Timetable {
	// section                          timeslot                days  subject/teacher
	std::unordered_map<int16_t, std::map<int, std::unordered_map<int, SchoolClass>>> schoolClasses;
	// teachers                 days                    classes (timeslot)
	std::unordered_map<int16_t, std::unordered_map<int, std::map<int, int>>> teachers_timeslots;
	// teachers                 days                    min/max timeslot
	std::vector<int> teachers_class_count;
	std::unordered_map<int16_t, std::unordered_set<int16_t>> section_segmented_timeslot;

	void initializeTeachersClass(int teachers, int work_week, int num_time_fragment);

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    int& work_week,
	    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
	    std::unordered_map<int16_t, int>& section_timeslot,
	    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
	    std::unordered_map<int16_t, int>& section_start_map,
	    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
	    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
	    std::uniform_int_distribution<int8_t>& random_workday);

	void update(
	    std::mt19937& gen,
	    int& work_week,
	    std::uniform_int_distribution<int16_t>& distribution_field,
	    std::unordered_map<int16_t, int>& section_timeslot,
	    std::unordered_map<int16_t, int>& section_start_map,
	    std::uniform_int_distribution<int16_t>& distribution_section,
	    std::uniform_int_distribution<int8_t>& random_workday,
	    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
	    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
	    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
	    std::vector<int>& section_with_segmented_timeslots);

	void updateTeachersTimeslots(
	    std::unordered_map<int16_t, int>& section_start_map,
	    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
		std::map<int, std::unordered_map<int, SchoolClass>>::iterator& itLow,
		std::map<int, std::unordered_map<int, SchoolClass>>::iterator& itUp,
		bool is_skipping_between,
		int random_timeslot_1,
		int random_timeslot_2,
	    int16_t random_section,
	    int work_week,
	    bool is_reset);

	void updateTeachersMinMaxTimeslots(int16_t teacher, int day, int timeslot);
};

struct Bee {
	Timetable timetable;
	int cost;

	Bee() : cost(std::numeric_limits<int16_t>::max()) {}
};

#ifdef __cplusplus
extern "C" {
#endif
void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_class_block,
    int total_section,
    int32_t* section_subjects,
    int32_t* section_subject_duration,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* section_subject_units,
    int teacher_subjects_length,
    int beesPopulation,
    int beesEmployed,
    int beesOnlooker,
    int beesScout,
    int limit,
    int workweek,
    int max_teacher_work_load,
    int result_buff_length,
    int64_t* result);

#ifdef __cplusplus
}
#endif

std::vector<int> calculatePositions(
    std::vector<std::pair<int16_t, int16_t>> subjects_duration_map,
    int divisions = 1);

int combine(int first, int second);
int combine(int first, int second, int third);

int extractFirst(int combined);
int extractSecond(int combined);
int extractThird(int combined);

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e);
int32_t packInt16ToInt32(int16_t first, int16_t second);

void extractSectionSubjects(
    const std::vector<int32_t>& inputArray,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects);

struct ObjectiveFunction {
	int evaluate(
	    Timetable& timetable,
	    bool show_penalty,
	    int& work_week,
	    std::unordered_map<int16_t, int>& section_start_map,
	    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
	    int& max_teacher_work_load);
};

#endif  // ABC_H
