#ifndef ABC_H
#define ABC_H

#include <bits/stdc++.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <cassert>
#include <chrono>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>

// #ifdef __cplusplus
// extern "C" {
// #endif

struct Curriculum {
	int16_t curriculum_id;
	std::vector<int16_t> subjects;
	std::vector<int16_t> sections;
};

struct SchoolClass {
	int16_t school_class_id;
	int16_t section_id;
	int16_t subject_id;
	int16_t teacher_id;
	int16_t timeslot;
};

struct Timetable {
	std::vector<Curriculum> curriculums;
	std::vector<SchoolClass> schoolClasses;

	Timetable(int16_t& num_curriculum,
	          int16_t& num_teachers,
	          int16_t& num_rooms,
	          int16_t& num_timeslots);

	void addCurriculum(const std::vector<Curriculum>& added_curriculums);

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int16_t>& distribution_teacher,
	    std::uniform_int_distribution<int16_t>& distribution_room,
	    std::uniform_int_distribution<int16_t>& distribution_timeslot);

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

	Bee(int16_t num_curriculum, int16_t num_teachers, int16_t num_rooms, int16_t num_timeslots) : timetable(num_curriculum, num_teachers, num_rooms, num_timeslots), cost(std::numeric_limits<int16_t>::max()) {}
};

// void hello_react();
// void process_data(int value);

void runExperiment(
    int max_iterations,
    int num_curriculum,
    int num_teachers,
    int num_rooms,
    int num_timeslots,
    std::vector<Curriculum> curriculum,
    std::unordered_map<int16_t, std::vector<int16_t>>
        teacher_subjects,
    int beesPopulation,
    int beesEmployed,
    int beesOnlooker,
    int beesScout,
    int limit);

// #ifdef __cplusplus
// }
// #endif

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

Bee generateRandomTimetable(int& num_curriculum,
                            int& num_teachers,
                            int& num_rooms,
                            int& num_timeslots,
                            const std::vector<Curriculum>& curriculum,
                            const ObjectiveFunction& objFunc = ObjectiveFunction());

// auto fitnessProportionateSelection = [](const vector<double>& prob) {};

#endif  // ABC_H
