#ifndef ABC2_H
#define ABC2_H

#include <math.h>

// #include <omp.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib> 
#include <deque>   
#include <fstream> 
#include <iomanip>
#include <iostream>
#include <map>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#define CLASS_TIMESLOT_OVERLAP_INT 1
#define NO_BREAK_INT 2
#define EXCEED_WORKLOAD_INT 3
#define CLASS_GAP_INT 4
#define EARLY_BREAK_INT 5
#define SMALL_BREAK_GAP_INT 6
#define LATE_BREAK_INT 7

struct ClassStartEnd {
	int start;
	int end;
};

struct teacherViolation {
	unsigned long long class_timeslot_overlap;
	unsigned long long no_break;
	unsigned long long exceed_workload;
	unsigned long long class_gap;
};

struct sectionViolation {
	unsigned long long early_break;
	unsigned long long small_break_gap;
	unsigned long long late_break;
};

// struct Subject {
// 	int16_t id;

// 	static std::vector<int16_t> s_eligible_teachers;
// };

struct Teacher {
	int16_t id;

	int max_work_load;
	std::unordered_map<int, std::map<int, int>> utilized_time;
	std::unordered_map<int, int> class_count;

	bool has_violation;

	void initializeClass(int work_week);
};

struct SchoolClass {
	int16_t subject_id;
	int16_t teacher_id;
};

struct Section {
	int16_t id;

	std::map<int, std::unordered_map<int, SchoolClass>> classes;

	std::unordered_map<int, ClassStartEnd> time_range;
	std::set<int> break_slots;

	std::unordered_set<int> segmented_timeslot;
	std::unordered_map<int, std::set<int>> fixed_timeslot_day;
	std::unordered_set<int16_t> utilized_teachers;

	bool has_violation;
};

struct Timetable {
	static int s_break_timeslot_allowance;
	static int s_teacher_break_threshold;
	static int s_default_class_duration;
	static int s_max_teacher_work_load;
	static int s_break_time_duration;
	static int s_work_week;

	static std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> s_section_subjects_units;
	static std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> s_section_subjects_duration;
	static std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> s_section_subjects_order;
	static std::unordered_map<int16_t, std::vector<int16_t>> s_eligible_teachers_in_subject;
	static std::unordered_set<int16_t> s_section_dynamic_subject_consistent_duration;
	static std::unordered_map<int16_t, int> s_section_not_allowed_breakslot_gap;
	static std::unordered_map<int16_t, std::vector<int16_t>> s_section_subjects;
	static std::unordered_map<int16_t, int> s_section_total_duration;
	// // static std::unordered_map<int16_t, int> s_section_fixed_subject;  // TODO: remove
	static std::unordered_map<int16_t, int> s_section_timeslot;
	static std::unordered_map<int16_t, int> s_section_start;

	static std::unordered_set<int16_t> s_teachers_set;
	static std::unordered_set<int16_t> s_sections_set;

	static std::vector<int> s_section_num_breaks;

	// static std::unordered_map<int16_t, int> s_section_break_slot;

	static std::uniform_int_distribution<int16_t> s_random_section;
	static std::uniform_int_distribution<int8_t> s_random_workDay;
	static std::uniform_int_distribution<int16_t> s_random_field;

	static void initializeRandomWorkDayDistribution(int min, int max);
	static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void initializeSectionsSet(int sections);
	static void initializeTeacherSet(int teachers);
	static void reset();

	static int getRandomInRange(int n);

	static int16_t getRandomTeacher(int16_t subject_id);

	// section                  timeslot      days                    subject/teacher
	// std::unordered_map<int16_t, std::map<int, std::unordered_map<int, SchoolClass>>> school_classes;
	std::unordered_map<int16_t, Section> sections;
	std::unordered_map<int16_t, Teacher> teachers;

	std::unordered_set<int16_t> sections_with_conflicts;
	std::unordered_set<int16_t> teachers_with_conflicts;

	std::pair<int, int> pickRandomTimeslots(int selected_section, int field);
	int16_t pickRandomField(int16_t section);
	int16_t pickRandomSection();

	// void initializeTeachersClass(int teachers);

	void initializeRandomTimetable(std::unordered_set<int16_t>& update_teachers);

	void modify(std::unordered_set<int16_t>& affected_teachers, std::unordered_set<int16_t>& affected_sections);

	void updateTeachersAndSections(
	    std::unordered_set<int16_t>& affected_teachers,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator iter_start,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator iter_end,
	    bool is_returning_teachers,
	    bool is_skipping_between,
	    int16_t random_section,
	    bool is_reset);
};

struct Bee {
	Timetable timetable;
	std::vector<teacherViolation> teacher_violations;
	std::vector<sectionViolation> section_violations;
	unsigned long long total_cost;

	void resetTeacherViolation(int teacher_id) {
		teacher_violations[teacher_id].class_timeslot_overlap = 0;
		teacher_violations[teacher_id].no_break = 0;
		teacher_violations[teacher_id].exceed_workload = 0;
		teacher_violations[teacher_id].class_gap = 0;
	}

	void resetSectionViolation(int section_id) {
		section_violations[section_id].early_break = 0;
		section_violations[section_id].small_break_gap = 0;
		section_violations[section_id].late_break = 0;
	}

	Bee(int num_teachers,
	    std::unordered_map<int16_t, Section> sections,
	    std::unordered_map<int16_t, Teacher> teachers) : teacher_violations(num_teachers),
	                                                     section_violations(num_teachers),
	                                                     total_cost(std::numeric_limits<int>::max()) {
		// timetable.initializeTeachersClass(num_teachers);
		timetable.sections = sections;
		timetable.teachers = teachers;
	}
};

#ifdef __cplusplus
extern "C" {
#endif
void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,
    int32_t* section_subjects,
    int32_t* section_subject_duration,
    int32_t* section_subject_order,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* section_subject_units,
    int teacher_subjects_length,
    int bees_population,
    int bees_employed,
    int bees_onlooker,
    int bees_scout,
    int limit,
    int work_week,
    int max_teacher_work_load,
    int break_time_duration,
    int break_timeslot_allowance,
    int teacher_break_threshold,
    int min_total_class_duration_for_two_breaks,
    int default_class_duration,
    int result_buff_length,
    int offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging);

#ifdef __cplusplus
}
#endif

std::vector<std::vector<int>> getAllBreaksCombination(int slot_count, int break_count, int gap);

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e);
int32_t packInt16ToInt32(int16_t first, int16_t second);

void getResult(Bee& bee, int64_t* result_timetable, int64_t* result_timetable_2, int offset_duration);
void getViolation(Bee& bee, int64_t* result_violation);

struct ObjectiveFunction {
	static void evaluate(
	    Bee& bee,
	    std::unordered_set<int16_t>& update_teachers,
	    std::unordered_set<int16_t>& update_sections,
	    bool show_penalty,
	    bool is_initial);
};

#endif  // ABC_H
