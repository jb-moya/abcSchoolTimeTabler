#ifndef ABC_H
#define ABC_H

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

struct SchoolClass {
	int16_t school_class_id;
	int16_t section_id;
	int16_t subject_id;
	int16_t teacher_id;
	int16_t timeslot;
	int8_t day;
};

struct Timetable {
	std::vector<SchoolClass> schoolClasses;

	Timetable(int num_school_class);

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
	    std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions,
	    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
	    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
	    std::uniform_int_distribution<int8_t>& random_workday);

	void update(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int16_t>& distribution_field,
	    std::uniform_int_distribution<int16_t>& distribution_class_block,
	    std::uniform_int_distribution<int16_t>& distribution_section,
	    std::uniform_int_distribution<int8_t>& random_workday,
	    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
	    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
	    std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions);
};

struct Bee {
	Timetable timetable;
	int cost;

	Bee(int num_school_class) : timetable(num_school_class), cost(std::numeric_limits<int16_t>::max()) {}
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

std::vector<int> calculatePositions(int total_length, int divisions = 1);

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
	bool isQualified(
	    const int16_t& teacherID,
	    const int16_t& subjectID,
	    const std::unordered_map<int16_t, std::vector<int16_t>>& teacher_subjects_map = {}) const;
	int evaluate(
	    const Timetable& timetable,
	    bool show_penalty = false,
	    const int& work_week = 5,
	    const int& max_teacher_work_load = 9) const;
};

#endif  // ABC_H
