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
#include <optional>
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

struct teacherViolation {
	int class_timeslot_overlap;
	int teacher_have_no_break;
	int teacher_exceed_workload;
};

struct Timetable {
	static std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> section_subjects_units;

	//        section                     subject  duration
	static std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> section_subjects_duration;
	static std::unordered_map<int16_t, std::vector<int16_t>> eligible_teachers_in_subject;
	static std::unordered_map<int16_t, std::vector<int16_t>> section_subjects;
	static std::unordered_map<int16_t, int> section_timeslot;
	static std::unordered_map<int16_t, int> section_start;
	static std::unordered_set<int> teachers_set;
	static int break_time_duration;
	static int work_week;

	static std::uniform_int_distribution<int16_t>
	    random_class_block;
	static std::uniform_int_distribution<int16_t> random_section;
	static std::uniform_int_distribution<int8_t> random_workDay;
	static std::uniform_int_distribution<int16_t> random_field;

	static void initializeRandomClassBlockDistribution(int min, int max);
	static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void initializeRandomWorkDayDistribution(int min, int max);
	static void initializeTeacherSet(int teachers);
	static void reset();

	// section                          timeslot                days  subject/teacher
	std::unordered_map<int16_t, std::map<int, std::unordered_map<int, SchoolClass>>> schoolClasses;
	// teachers                 days                    classes (timeslot)
	std::unordered_map<int16_t, std::unordered_map<int, std::map<int, int>>> teachers_timeslots;
	// section                  timeslot
	std::unordered_map<int16_t, std::unordered_set<int>> section_segmented_timeslot;
	std::vector<int> teachers_class_count;

	void initializeTeachersClass(int teachers);

	void initializeRandomTimetable(std::unordered_set<int>& affected_teachers);

	void update(std::unordered_set<int>& affected_teachers);

	void updateTeachersTimeslots(
	    std::unordered_set<int>& affected_teachers,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
	    bool is_skipping_between,
	    bool is_returning_teachers,
	    int16_t random_section,
	    bool is_reset);
};

struct Bee {
	Timetable timetable;
	std::vector<teacherViolation> teacherViolations;
	int total_cost;

	void resetTeacherViolation(int teacher_id) {
		teacherViolations[teacher_id].class_timeslot_overlap = 0;
		teacherViolations[teacher_id].teacher_have_no_break = 0;
		teacherViolations[teacher_id].teacher_exceed_workload = 0;
	}

	Bee(int num_teachers) : teacherViolations(num_teachers),
	                        total_cost(std::numeric_limits<int>::max()) {
		timetable.initializeTeachersClass(num_teachers);
	}
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
    int break_time_duration,
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

// void extractSectionSubjects(
//     const std::vector<int32_t>& inputArray,
//     std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects);

struct ObjectiveFunction {
	static void evaluate(
	    Bee& bee,
	    std::unordered_set<int>& affected_teachers,
	    bool show_penalty,
	    bool is_initial,
	    int& work_week,
	    int& max_teacher_work_load,
	    int& break_time_duration);
};

#endif  // ABC_H
