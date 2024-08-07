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
};

struct Timetable {
	std::vector<SchoolClass> schoolClasses;

	Timetable(int num_school_class);

	// void addCurriculum(const std::unordered_map<int16_t, std::vector<int16_t>> section_subjects);

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int16_t>& distribution_teacher,
	    std::uniform_int_distribution<int16_t>& distribution_room,
	    std::uniform_int_distribution<int16_t>& distribution_timeslot,
	    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects);

	void updateTimetableUsingDifference(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int16_t>& distribution_field,
	    std::uniform_int_distribution<int16_t>& distribution_school_class,
	    std::uniform_int_distribution<int16_t>& distribution_section,
	    std::uniform_int_distribution<int16_t>& distribution_teacher,
	    std::uniform_int_distribution<int16_t>& distribution_room,
	    std::uniform_int_distribution<int16_t>& distribution_timeslot);
};

struct Bee {
	Timetable timetable;
	int16_t cost;

	Bee(int num_school_class) : timetable(num_school_class), cost(std::numeric_limits<int16_t>::max()) {}
};

#ifdef __cplusplus
extern "C" {
#endif
void runExperiment(
    int max_iterations,
    int num_teachers,
    int num_rooms,
    int num_timeslots,
    int total_school_class,
    int total_section,
    int32_t* section_subjects,
    int32_t* teacher_subjects,
    int teacher_subjects_length,
    int beesPopulation,
    int beesEmployed,
    int beesOnlooker,
    int beesScout,
    int limit,
    int64_t* result);

int sumJSArray(int* arr, int size);
int sumOfArrays(int** arrays, int* sizes, int numArrays);

#ifdef __cplusplus
}
#endif

int64_t packInt16ToInt64(int16_t first, int16_t second, int16_t third, int16_t fourth);
int32_t packInt16ToInt32(int16_t first, int16_t second);

void extractSectionSubjects(
    const std::vector<int32_t>& inputArray,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects);

struct ObjectiveFunction {
	bool isQualified(
	    const int16_t& teacherID,
	    const int16_t& subjectID,
	    const std::unordered_map<int16_t, std::vector<int16_t>>& teacher_subjects = {}) const;
	double evaluate(
	    const Timetable& timetable,
	    bool show_penalty = false,
	    const std::unordered_map<int16_t, std::vector<int16_t>>& teacher_subjects = {}) const;
};

Bee generateRandomTimetable(
    int& num_school_class,
    int& num_teachers,
    int& num_rooms,
    int& num_timeslots,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
    const ObjectiveFunction& objFunc = ObjectiveFunction());

// auto fitnessProportionateSelection = [](const vector<double>& prob) {};

#endif  // ABC_H
