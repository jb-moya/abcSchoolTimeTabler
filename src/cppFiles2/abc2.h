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

#define BLACK "\033[30m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN "\033[36m"
#define WHITE "\033[37m"
#define BLACK_B "\033[90m"
#define RED_B "\033[91m"
#define GREEN_B "\033[92m"
#define YELLOW_B "\033[93m"
#define BLUE_B "\033[94m"
#define MAGENTA_B "\033[95m"
#define CYAN_B "\033[96m"
#define WHITE_B "\033[97m"

#define BLACK_BG "\033[40m"
#define RED_BG "\033[41m"
#define GREEN_BG "\033[42m"
#define YELLOW_BG "\033[43m"
#define BLUE_BG "\033[44m"
#define MAGENTA_BG "\033[45m"
#define CYAN_BG "\033[46m"
#define WHITE_BG "\033[47m"
#define BLACK_BG_B "\033[100m"
#define RED_BG_B "\033[101m"
#define GREEN_BG_B "\033[102m"
#define YELLOW_BG_B "\033[103m"
#define BLUE_BG_B "\033[104m"
#define MAGENTA_BG_B "\033[105m"
#define CYAN_BG_B "\033[106m"
#define WHITE_BG_B "\033[107m"

#define BOLD "\033[1m"
#define DIM "\033[2m"
#define UNDERLINE "\033[4m"
#define BLINK "\033[5m"
#define REVERSE "\033[7m"
#define HIDDEN "\033[8m"
#define STRIKETHROUGH "\033[9m"
#define RESET "\033[0m"

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

struct sectionViolation {
	int early_break;
	int small_break_gap;
	int late_break;
};

struct Timetable {
	static std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> section_subjects_units;
	static std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> section_subjects_duration;
	static std::unordered_map<int16_t, std::vector<int16_t>> eligible_teachers_in_subject;
	static std::unordered_map<int16_t, std::vector<int16_t>> section_subjects;
	static std::unordered_map<int16_t, int> section_timeslot;
	static std::unordered_map<int16_t, int> section_start;
	static std::unordered_set<int> teachers_set;
	static std::unordered_set<int> sections_set;
	static std::vector<int> section_num_breaks;
	static int break_timeslot_allowance;
	static int teacher_break_threshold;
	static int default_class_duration;
	static int break_time_duration;
	static int work_week;

	static std::uniform_int_distribution<int16_t> random_class_block;
	static std::uniform_int_distribution<int16_t> random_section;
	static std::uniform_int_distribution<int8_t> random_workDay;
	static std::uniform_int_distribution<int16_t> random_field;

	static void initializeRandomClassBlockDistribution(int min, int max);
	static void initializeRandomWorkDayDistribution(int min, int max);
	static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void initializeSectionsSet(int sections);
	static void initializeTeacherSet(int teachers);
	static void reset();

	// section                           timeslot                days  subject/teacher
	std::unordered_map<int16_t, std::map<int, std::unordered_map<int, SchoolClass>>> schoolClasses;
	// teachers                 days                    classes (timeslot)
	std::unordered_map<int16_t, std::unordered_map<int, std::map<int, int>>> teachers_timeslots;
	// section                  timeslot
	std::unordered_map<int16_t, std::unordered_set<int>> section_segmented_timeslot;
	// day                      teachers
	std::unordered_map<int16_t, std::vector<int>> teachers_class_count;

	void initializeTeachersClass(int teachers);

	void initializeRandomTimetable(std::unordered_set<int>& update_teachers);

	void update(std::unordered_set<int>& affected_teachers, std::unordered_set<int>& affected_sections);

	void updateTeachersTimeslots(
	    std::unordered_set<int>& affected_teachers,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
	    bool is_returning_teachers,
	    int16_t random_section,
	    bool is_reset);
};

struct Bee {
	Timetable timetable;
	std::vector<teacherViolation> teacherViolations;
	std::vector<sectionViolation> sectionViolations;
	int total_cost;

	void resetTeacherViolation(int teacher_id) {
		teacherViolations[teacher_id].class_timeslot_overlap = 0;
		teacherViolations[teacher_id].teacher_have_no_break = 0;
		teacherViolations[teacher_id].teacher_exceed_workload = 0;
	}

	void resetSectionViolation(int section_id) {
		sectionViolations[section_id].early_break = 0;
		sectionViolations[section_id].small_break_gap = 0;
		sectionViolations[section_id].late_break = 0;
	}

	Bee(int num_teachers) : teacherViolations(num_teachers),
	                        sectionViolations(num_teachers),
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
    int break_timeslot_allowance,
    int teacher_break_threshold,
    int min_classes_for_two_breaks,
    int default_class_duration,
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

struct ObjectiveFunction {
	static void evaluate(
	    Bee& bee,
	    std::unordered_set<int>& update_teachers,
	    std::unordered_set<int>& update_sections,
	    bool show_penalty,
	    bool is_initial,
	    int& work_week,
	    int& max_teacher_work_load,
	    int& break_time_duration);
};

#endif  // ABC_H
