#ifndef TIMETABLE_H
#define TIMETABLE_H

#include <math.h>
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

#include "rotaryTimeslot.h"
#include "subjectTeacherQueue.h"
#include "schoolClass.h"

#define CLASS_TIMESLOT_OVERLAP_INT 1
#define NO_BREAK_INT 2
#define EXCEED_WORKLOAD_INT 3
#define EARLY_BREAK_INT 5
#define SMALL_BREAK_GAP_INT 6
#define LATE_BREAK_INT 7

struct ClassStartEnd {
	int start;
	int end;
};

struct Subject {
	int id;

	static std::vector<int> s_eligible_teachers;

	std::unordered_set<int> fixed_assigned_teachers;

	int units;
	int duration;
	int order;
};

struct Teacher {
	int id;

	int max_work_load;
	std::unordered_map<int, std::map<int, int>> utilized_time;
	std::unordered_map<int, int> class_count;

	bool has_violation;

	void initializeClass(int work_week);
};

struct Section {
	int id;

	std::map<int, std::unordered_map<int, SchoolClass>> classes;

	std::unordered_map<int, ClassStartEnd> time_range;
	std::set<int> break_slots;

	std::unordered_set<int> segmented_timeslot;
	std::unordered_set<int> dynamic_timeslot;
	std::unordered_map<int, std::set<int>> fixed_timeslot_day;
	std::unordered_set<int> utilized_teachers;

	bool has_violation;
};

struct Timetable {
	static int s_teacher_break_threshold;
	static int s_default_class_duration;
	static int s_max_teacher_work_load;
	static int s_break_time_duration;
	static int s_work_week;

	static std::unordered_map<int, std::unordered_map<int, int>> s_section_subjects_fixed_teacher;
	static std::unordered_map<int, std::vector<std::pair<int, int>>> s_section_subjects_units;
	static std::unordered_map<int, std::unordered_map<int, int>> s_section_subjects_duration;
	static std::unordered_map<int, std::unordered_map<int, int>> s_section_subjects_order;
	static std::unordered_map<int, std::vector<int>> s_eligible_teachers_in_subject;
	static std::unordered_set<int> s_section_dynamic_subject_consistent_duration;
	static std::unordered_map<int, int> s_section_not_allowed_breakslot_gap;
	static std::unordered_map<int, std::vector<int>> s_section_subjects;
	static std::unordered_map<int, int> s_section_total_duration;
	static std::unordered_map<int, int> s_section_total_timeslot;
	static std::unordered_map<int, int> s_section_start;

	static std::unordered_set<int> s_teachers_set;
	static std::unordered_set<int> s_sections_set;

	static std::vector<int> s_section_num_breaks;

	static std::uniform_int_distribution<int> s_random_section;
	static std::uniform_int_distribution<int8_t> s_random_workDay;
	static std::uniform_int_distribution<int> s_random_field;

	static RotaryTimeslot s_rotary_timeslot;
	static SubjectTeacherQueue s_subject_teacher_queue;

	static void initializeRandomWorkDayDistribution(int min, int max);
	static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void initializeSectionsSet(int sections);
	static void initializeTeacherSet(int teachers);
	static void reset();

	void setClasstimeslot(Section& section);

	static int getRandomInRange(int n);

	static int getRandomTeacher(int subject_id);

	std::unordered_map<int, Section> sections;
	std::unordered_map<int, Teacher> teachers;

	std::unordered_set<int> sections_with_conflicts;
	std::unordered_set<int> teachers_with_conflicts;

	std::pair<int, int> pickRandomTimeslots(int selected_section, int field);
	int pickRandomField(int section);
	int pickRandomSection();

	// void initializeTeachersClass(int teachers);

	void initializeRandomTimetable(std::unordered_set<int>& update_teachers);

	void modify(std::unordered_set<int>& affected_teachers, std::unordered_set<int>& affected_sections);

	void updateTeachersAndSections(
	    std::unordered_set<int>& affected_teachers,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator iter_start,
	    std::map<int, std::unordered_map<int, SchoolClass>>::iterator iter_end,
	    bool is_returning_teachers,
	    bool is_skipping_between,
	    int random_section,
	    bool is_reset);
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

std::vector<std::vector<int>> getAllBreaksCombination(int slot_count, int break_count, int gap, int end_gap);
std::vector<int> getDefaultBreaksCombination(std::vector<std::vector<int>>& breaks_combination);

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e);
int32_t packInt16ToInt32(int16_t first, int16_t second);

#endif  // TIMETABLE_H
