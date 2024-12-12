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

#include "bit_utils.h"
#include "rotaryVector.h"
#include "scheduledDay.h"
#include "schoolClass.h"
#include "section.h"
#include "subjectEligibilityManager.h"
#include "subjectTeacherQueue.h"
#include "types.h"

#define CLASS_TIMESLOT_OVERLAP_INT 1
#define NO_BREAK_INT 2
#define EXCEED_MAX_WORKLOAD_INT 3
#define BELOW_MIN_WORKLOAD_INT 4
#define EARLY_BREAK_INT 5
#define SMALL_BREAK_GAP_INT 6
#define LATE_BREAK_INT 7

struct Timetable {
   private:
	static int s_teacher_break_threshold;
	static TimeDuration s_default_class_duration;
	static TimeDuration s_break_time_duration;
	static int s_work_week;
	static int s_total_section;
	static int s_teacher_middle_time_point_grow_allowance_for_break_timeslot;

	static std::unordered_set<SectionID> s_sections_set;
	static std::unordered_set<TeacherID> s_teachers_set;

	std::vector<std::shared_ptr<SubjectConfiguration>> subject_configurations;
	std::unordered_map<SectionID, Section> sections;
	std::unordered_map<TeacherID, Teacher> teachers;

   public:
	static void setTeacherBreakThreshold(int s_teacher_break_threshold);
	static void setTeacherMiddleTimePointGrowAllowanceForBreakTimeslot(int s_teacher_middle_time_point_grow_allowance_for_break_timeslot);
	static void setDefaultClassDuration(TimeDuration s_default_class_duration);
	static void setBreakTimeDuration(TimeDuration s_break_time_duration);
	static void setWorkWeek(int s_work_week);
	static void setTotalSection(int s_total_section);
	static void setTeachersSet(const std::unordered_set<SectionID>& s_teachers_set);
	static void setSectionsSet(const std::unordered_set<TeacherID>& s_sections_set);

	static int getTeacherBreakThreshold();
	static int getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot();
	static TimeDuration getDefaultClassDuration();
	static TimeDuration getBreakTimeDuration();
	static int getWorkWeek();
	static int getTotalSection();
	static std::unordered_set<TeacherID>& getTeachersSet();
	static std::unordered_set<SectionID>& getSectionsSet();

	// Helper method to find a subject by name
	std::shared_ptr<SubjectConfiguration> findSubjectConfigurationById(SubjectConfigurationID id);
	void addSubjectConfiguration(SubjectConfigurationID subject_configuration_id,
	                             SubjectID subject_id,
	                             TimeDuration duration,
	                             int unit_count,
	                             Timeslot fixed_timeslot,
	                             std::vector<ScheduledDay> fixed_days);

	Section& getSectionById(SectionID section_id);
	Teacher& getTeacherById(TeacherID teacher_id);

	static std::uniform_int_distribution<SectionID> s_random_section_id;
	static std::uniform_int_distribution<int8_t> s_random_workDay;
	static std::uniform_int_distribution<int> s_random_field;

	static SubjectEligibilityManager s_subject_eligibility_manager;
	static RotaryVector s_rotary_timeslot;
	static SubjectTeacherQueue s_subject_teacher_queue;

	static void initializeRandomWorkDayDistribution(int min, int max);
	static void initializeRandomSectionDistribution(int min, int max);
	static void initializeRandomFieldDistribution(int min, int max);
	static void initializeSectionSet(int total_section);
	static void initializeTeachersSet(int total_teacher);
	static void reset();

	void setClasstimeslot(Section& section);

	static int getRandomInRange(int n);
	static TeacherID getRandomTeacher(SubjectID subject_id);

	static void addEligibleTeacher(SubjectID subjectId, TeacherID teacherId);

	void addSection(SubjectID section_id, int num_break, TimePoint start_time, int total_timeslot, int not_allowed_breakslot_gap, bool is_dynamic_subject_consistent_duration);
	void addTeacher(TeacherID teacher_id, TimeDuration max_weekly_load, TimeDuration min_weekly_load);

	void addSubjectToSection(SectionID section_id, SubjectConfigurationID subject_configuration_id);

	std::unordered_set<SectionID> sections_with_conflicts;
	std::unordered_set<TeacherID> teachers_with_conflicts;

	std::pair<Timeslot, Timeslot> pickRandomTimeslots(Section& selected_section, int field);
	int pickRandomField(Section& section);
	Section& pickRandomSection();

	void initializeRandomTimetable(std::unordered_set<TeacherID>& update_teachers);
	void initializeSectionTimetable(SectionID section_id, Section& section);

	void initializeSubjectConfigurations(int number_of_subject_configuration,
	                                     int32_t* subject_configuration_subject_units,
	                                     int32_t* subject_configuration_subject_duration,
	                                     int32_t* subject_configuration_subject_fixed_timeslot,
	                                     int32_t* subject_configuration_subject_fixed_day);

	void initializeSections(int number_of_section,
	                        int32_t* section_configuration,
	                        int32_t* section_start);

	void initializeSectionFixedSubjectTeacher(int32_t* subject_fixed_teacher_section, int32_t* subject_fixed_teacher);

	void initializeTeachers(int number_of_teacher, int32_t* teacher_week_load_config);
	void initializeTeacherSubjects(int teacher_subjects_length, int32_t* teacher_subjects);
	void initializeSectionSubjects(int total_section_subjects, int32_t* section_subject_configuration);

	TeacherID getRandomInitialTeacher(Section& section, SubjectID subject_id);

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

	void moveTeacherClassCountToNewDay(TeacherID teacher_id, ScheduledDay from_day, ScheduledDay to_day);

	void categorizeSubjects(Section& section,
	                        std::vector<SubjectID>& full_week_day_subjects,
	                        std::vector<SubjectID>& special_unit_subjects) const;

	std::vector<Timeslot> getBreaks(const Section& section) const;
	void setupTimeslots(int total_timeslot, std::deque<Timeslot>& timeslot_keys, std::map<Timeslot, std::vector<ScheduledDay>>& timeslots, const std::vector<Timeslot>& skips) const;

	void changeTeacher(Section& selected_section, Timeslot selected_timeslot, ScheduledDay day, TeacherID new_teacher_id, std::unordered_set<TeacherID>& update_teachers);
};

std::vector<std::vector<Timeslot>> getAllBreaksCombination(int slot_count, int break_count, Timeslot gap, Timeslot end_gap);
std::vector<Timeslot> getDefaultBreaksCombination(std::vector<std::vector<Timeslot>>& breaks_combination);