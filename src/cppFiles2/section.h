#pragma once

#include <iostream>
#include <map>
#include <memory>
#include <random>
#include <set>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include "classStartEnd.h"
#include "schoolClass.h"
#include "subjectConfiguration.h"
#include "teacher.h"

class Section {
   private:
	// Member Variables
	const int id;
	const int num_break;
	const int start_time;
	const int total_timeslot;
	const int not_allowed_breakslot_gap;
	const bool is_dynamic_subject_consistent_duration;

	int total_duration;
	bool has_violation;

	// Containers for different configurations and attributes
	std::unordered_map<int, std::shared_ptr<SubjectConfiguration>> subject_configurations;
	std::map<int, std::unordered_map<ScheduledDay, SchoolClass>> classes;

	std::unordered_map<int, std::set<ScheduledDay>> fixed_timeslot_day;
	std::unordered_map<int, ClassStartEnd> time_range;
	std::unordered_set<int> segmented_timeslot;
	std::unordered_set<int> utilized_teachers;
	std::unordered_set<int> dynamic_timeslot;
	std::unordered_set<int> break_slots;

   public:
	// Static Variables
	static int total_section;
	static std::unordered_set<int> s_all_sections;

	// Constructors
	Section(int id_,
	        int num_break_,
	        int start_,
	        int total_timeslot_,
	        int not_allowed_breakslot_gap_,
	        bool is_dynamic_subject_consistent_duration_)
	    : id(id_),
	      num_break(num_break_),
	      start_time(start_),
	      total_timeslot(total_timeslot_),
	      not_allowed_breakslot_gap(not_allowed_breakslot_gap_),
	      is_dynamic_subject_consistent_duration(is_dynamic_subject_consistent_duration_),
	      has_violation(false) {}

	// Static Functions
	static Section& getRandomSection();

	// Core Functional Methods
	void addSubject(const std::shared_ptr<SubjectConfiguration>& subject_configuration);
	void addClass(int timeslot, ScheduledDay day, const SchoolClass& class_);
	void addBreakSlot(int break_slot);
	void addSegmentedTimeSlot(int timeslot);
	void addUtilizedTeacher(int teacher_id);
	void addFixedTimeSlotDay(int timeslot, ScheduledDay day);

	void removeBreakSlot(int timeslot);
	void removeSegmentedTimeSlot(int timeslot);
	void removeUtilizedTeacher(int teacher_id);

	void updateTimeslotStart(int timeslot, int start);
	void updateTimeslotEnd(int timeslot, int end);
	void setTimeRange(int timeslot, ClassStartEnd time_range);
	std::unordered_set<ScheduledDay> getClassTimeslotScheduledDay(int timeslot) const;

	// CRUD Operations for Classes
	void setClasses(const std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>& classes_);

	// Setters for Attributes
	void setTotalDuration(int total_duration);
	void setBreakSlots(const std::unordered_set<int>& break_slots);
	void setSegmentedTimeslot(const std::unordered_set<int>& segmented_timeslot);
	void setDynamicTimeslot(const std::unordered_set<int>& dynamic_timeslot);
	void setFixedTimeslotDay(const std::unordered_map<int, std::set<ScheduledDay>>& fixed_timeslot_day);
	void setUtilizedTeachers(const std::unordered_set<int>& utilized_teachers);
	void setViolation(bool violation);

	// Getters for Attributes
	int getId() const;
	int getNumberOfBreak() const;
	int getTotalTimeslot() const;
	int getNotAllowedBreakslotGap() const;
	int getTotalDuration() const;
	int getStartTime() const;
	ClassStartEnd getClassStartTime(int timeslot) const;
	int getTimeslotStart(int timeslot) const;
	int getTimeslotEnd(int timeslot) const;
	int getClassTimeslotSubjectID(ScheduledDay day, int timeslot) const;
	int getClassTimeslotTeacherID(ScheduledDay day, int timeslot) const;
	ScheduledDay getRandomClassTimeslotWorkingDays(int timeslot) const;
	std::unordered_set<ScheduledDay> getAllScheduledDayOnClasstimeslot(int timeslot) const;

	bool hasViolation() const;
	bool isDynamicSubjectConsistentDuration() const;
	bool isInBreakSlots(int timeslot) const;
	bool isInSegmentedTimeslot(int timeslot) const;

	// Getters for Containers
	const std::unordered_map<int, std::shared_ptr<SubjectConfiguration>>& getSubjectConfigurations() const;
	const std::unordered_map<int, ClassStartEnd>& getTimeRange() const;
	const std::unordered_set<int>& getBreakSlots() const;
	const std::unordered_set<int>& getSegmentedTimeslot() const;
	const std::unordered_set<int>& getDynamicTimeslot() const;
	const std::unordered_map<int, std::set<ScheduledDay>>& getFixedTimeslotDay() const;
	const std::unordered_set<int>& getUtilizedTeachers() const;

	// Accessing and Modifying Specific Subject
	SubjectConfiguration& getSubject(int subject_id);
	std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>& getClasses();

	void updateClassTimeslotDay(ScheduledDay day, int timeslot, SchoolClass& school_class);
	void assignBreaks(std::vector<int>& breaks);
};