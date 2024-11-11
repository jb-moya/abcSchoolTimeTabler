#pragma once

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
#include <memory>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "rotaryTimeslot.h"
#include "scheduledDay.h"
#include "schoolClass.h"
#include "section.h"
#include "subjectEligibilityManager.h"
#include "subjectTeacherQueue.h"
#include "types.h"

#define CLASS_TIMESLOT_OVERLAP_INT 1
#define NO_BREAK_INT 2
#define EXCEED_WORKLOAD_INT 3
#define EARLY_BREAK_INT 5
#define SMALL_BREAK_GAP_INT 6
#define LATE_BREAK_INT 7

struct Timetable {
   private:
	static int s_teacher_break_threshold;
	static TimeDuration s_default_class_duration;
	static int s_max_teacher_work_load;
	static TimeDuration s_break_time_duration;
	static int s_work_week;
	static int s_total_section;

	static std::unordered_set<SectionID> s_sections_set;
	static std::unordered_set<TeacherID> s_teachers_set;

	std::vector<std::shared_ptr<SubjectConfiguration>> subject_configurations;
	std::unordered_map<SectionID, Section> sections;
	std::unordered_map<TeacherID, Teacher> teachers;

   public:
	static void setTeacherBreakThreshold(int s_teacher_break_threshold);
	static void setDefaultClassDuration(TimeDuration s_default_class_duration);
	static void setMaxTeacherWorkLoad(int s_max_teacher_work_load);
	static void setBreakTimeDuration(TimeDuration s_break_time_duration);
	static void setWorkWeek(int s_work_week);
	static void setTotalSection(int s_total_section);
	static void setTeachersSet(const std::unordered_set<SectionID>& s_teachers_set);
	static void setSectionsSet(const std::unordered_set<TeacherID>& s_sections_set);

	static int getTeacherBreakThreshold();
	static TimeDuration getDefaultClassDuration();
	static int getMaxTeacherWorkLoad();
	static TimeDuration getBreakTimeDuration();
	static int getWorkWeek();
	static int getTotalSection();
	static std::unordered_set<TeacherID>& getTeachersSet();
	static std::unordered_set<SectionID>& getSectionsSet();

	// Helper method to find a subject by name
	std::shared_ptr<SubjectConfiguration> findSubjectConfigurationById(SubjectConfigurationID id);
	void addSubjectConfiguration(SubjectConfigurationID subject_configuration_id, SubjectID subject_id, TimeDuration duration, int unit_count, int order);

	Section& getSectionById(SectionID section_id);
	Teacher& getTeacherById(TeacherID teacher_id);

	static std::uniform_int_distribution<SectionID> s_random_section_id;
	static std::uniform_int_distribution<int8_t> s_random_workDay;
	static std::uniform_int_distribution<int> s_random_field;

	static SubjectEligibilityManager s_subject_eligibility_manager;
	static RotaryTimeslot s_rotary_timeslot;
	static SubjectTeacherQueue s_subject_teacher_queue;

	static void initializeRandomWorkDayDistribution(int min, int max);
	// static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void reset();

	void setClasstimeslot(Section& section);

	static int getRandomInRange(int n);
	static TeacherID getRandomTeacher(SubjectID subject_id);

	static void addEligibleTeacher(SubjectID subjectId, TeacherID teacherId);

	void addSection(SubjectID section_id, int num_break, TimePoint start_time, int total_timeslot, int not_allowed_breakslot_gap, bool is_dynamic_subject_consistent_duration);
	void addTeacher(TeacherID teacher_id, int max_weekly_load);

	void addSubjectToSection(SectionID section_id, SubjectConfigurationID subject_configuration_id);

	std::unordered_set<SectionID> sections_with_conflicts;
	std::unordered_set<TeacherID> teachers_with_conflicts;

	std::pair<Timeslot, Timeslot> pickRandomTimeslots(Section& selected_section, int field);
	int pickRandomField(Section& section);
	Section& pickRandomSection();

	void initializeRandomTimetable(std::unordered_set<TeacherID>& update_teachers);
	void initializeSectionTimetable(SectionID section_id, Section& section);

	void modify(Section& selected_section,
	            int choice,
	            std::pair<Timeslot, Timeslot> selected_timeslots,
	            std::unordered_set<TeacherID>& affected_teachers,
	            std::unordered_set<SubjectID>& affected_sections,
	            SubjectEligibilityManager& subject_eligibility = s_subject_eligibility_manager);

	// TODO: might refactor
	void updateTeachersAndSections(
	    std::unordered_set<TeacherID>& affected_teachers,
	    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator iter_start,
	    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator iter_end,
	    bool is_returning_teachers,
	    bool is_skipping_between,
	    Section& selected_section,
	    bool is_reset);

	void categorizeSubjects(Section& section,
	                        std::vector<SubjectID>& full_week_day_subjects,
	                        std::vector<SubjectID>& special_unit_subjects,
	                        std::set<int>& non_dynamic_order_start,
	                        std::set<int>& non_dynamic_order_end) const;

	std::vector<Timeslot> getBreaks(const Section& section) const;
	void setupTimeslots(int total_timeslot, std::deque<Timeslot>& timeslot_keys, std::map<Timeslot, int>& timeslots, const std::vector<Timeslot>& skips) const;

	// understand this function
	void processTimeslots(std::map<int, Timeslot>& fixed_subject_order,
	                      std::set<Timeslot>& reserved_timeslots,
	                      std::deque<Timeslot>& timeslot_keys,
	                      std::map<Timeslot, int>& timeslots,
	                      const std::set<int>& non_dynamic_order_start,
	                      const std::set<int>& non_dynamic_order_end) const;

	void changeTeacher(Section& selected_section, Timeslot selected_timeslot, ScheduledDay day, TeacherID new_teacher_id, std::unordered_set<TeacherID>& update_teachers);
	bool isSkippingUpdateBetween(Section& selected_section, std::pair<Timeslot, Timeslot> selected_timeslots) const;
};

#ifdef __cplusplus
extern "C" {
#endif

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,
    int number_of_subject_configuration,

    int32_t* section_configuration,
    int32_t* section_subject_configuration,
    int32_t* section_subjects,
    int32_t* subject_configuration_subject_units,
    int32_t* subject_configuration_subject_duration,
    int32_t* subject_configuration_subject_order,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* teacher_max_weekly_load,

    int teacher_subjects_length,
    int bees_population,
    int bees_employed,
    int bees_onlooker,
    int bees_scout,
    int limit,
    int work_week,

    int max_teacher_work_load,
    TimeDuration break_time_duration,
    int teacher_break_threshold,
    TimeDuration min_total_class_duration_for_two_breaks,
    TimeDuration default_class_duration,
    int result_buff_length,
    TimePoint offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging);

#ifdef __cplusplus
}
#endif

std::vector<std::vector<Timeslot>> getAllBreaksCombination(int slot_count, int break_count, Timeslot gap, Timeslot end_gap);
std::vector<Timeslot> getDefaultBreaksCombination(std::vector<std::vector<Timeslot>>& breaks_combination);

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e);
int32_t packInt16ToInt32(int16_t first, int16_t second);
int32_t packInt8ToInt32(int8_t first, int8_t second, int8_t third, int8_t fourth);
