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
#include "timeslotManager.h"

class Section {
   private:
	// Member Variables
	const SectionID id;
	const int num_break;
	const TimePoint start_time;
	const int total_timeslot;
	const int not_allowed_breakslot_gap;
	const bool is_dynamic_subject_consistent_duration;

	TimeDuration total_duration;
	bool has_violation;

	std::unordered_map<SubjectID, std::shared_ptr<SubjectConfiguration>> subject_configurations;
	std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>> classes;
	std::unordered_set<TeacherID> utilized_teachers;

	TimeslotManager timeslot_manager;

   public:
	static int total_section;
	static std::unordered_set<SectionID> s_all_sections;

	Section(SectionID id_,
	        int num_break_,
	        TimePoint start_,
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
	void addClass(Timeslot timeslot, ScheduledDay day, const SchoolClass& class_);
	void addUtilizedTeacher(TeacherID teacher_id);
	void removeUtilizedTeacher(TeacherID teacher_id);
	std::unordered_set<ScheduledDay> getClassTimeslotScheduledDay(Timeslot timeslot) const;

	// Setters for Attributes
	void setTotalDuration(TimeDuration total_duration);
	void setViolation(bool violation);

	// Getters for Attributes
	SectionID getId() const;
	int getNumberOfBreak() const;
	int getTotalTimeslot() const;
	int getNotAllowedBreakslotGap() const;
	TimeDuration getTotalDuration() const;
	TimePoint getStartTime() const;
	SubjectID getClassTimeslotSubjectID(ScheduledDay day, Timeslot timeslot) const;
	TeacherID getClassTimeslotTeacherID(ScheduledDay day, Timeslot timeslot) const;
	ScheduledDay getRandomClassTimeslotWorkingDays(Timeslot timeslot) const;
	std::unordered_set<ScheduledDay> getAllScheduledDayOnClasstimeslot(Timeslot timeslot) const;

	const std::unordered_map<Timeslot, std::set<ScheduledDay>>& getFixedTimeslotDay() const;

	bool hasViolation() const;
	bool isDynamicSubjectConsistentDuration() const;

	// Getters for Containers
	const std::unordered_map<SubjectID, std::shared_ptr<SubjectConfiguration>>& getSubjectConfigurations() const;
	const std::unordered_map<Timeslot, ClassStartEnd>& getTimeRange() const;
	const std::unordered_set<TeacherID>& getUtilizedTeachers() const;

	// Accessing and Modifying Specific Subject
	SubjectConfiguration& getSubject(SubjectID subject_id);
	std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>& getClasses();

	void updateClassTimeslotDay(ScheduledDay day, Timeslot timeslot, SchoolClass& school_class);
	void assignBreaks(std::vector<Timeslot>& breaks);

	void addBreakSlot(Timeslot break_slot);
	void addSegmentedTimeSlot(Timeslot timeslot);
	void addFixedTimeSlotDay(Timeslot timeslot, ScheduledDay day);
	void addDynamicTimeSlotDay(Timeslot timeslot, ScheduledDay day);

	void removeBreakSlot(Timeslot timeslot);
	void removeSegmentedTimeSlot(Timeslot timeslot);

	void updateTimeslotStart(Timeslot timeslot, TimePoint start);
	void updateTimeslotEnd(Timeslot timeslot, TimePoint end);

	void setTimeRange(Timeslot timeslot, ClassStartEnd time_range);

	ClassStartEnd getClassStartTime(Timeslot timeslot) const;

	TimePoint getTimeslotStart(Timeslot timeslot) const;
	TimePoint getTimeslotEnd(Timeslot timeslot) const;

	bool isInBreakSlots(Timeslot timeslot) const;
	bool isInSegmentedTimeslot(Timeslot timeslot) const;
	const std::unordered_set<Timeslot>& getBreakSlots() const;
	const std::unordered_set<Timeslot>& getSegmentedTimeslot() const;

	bool isPairTimeslotDurationEqual(std::pair<Timeslot, Timeslot> selected_timeslots) const;

	void swapClassesByTimeslot(Timeslot timeslot_1, Timeslot timeslot_2);

	void adjustBreakslots(Timeslot timeslot_1, Timeslot timeslot_2);
	void adjustSegmentedTimeslots(Timeslot timeslot_1, Timeslot timeslot_2);
	ScheduledDay getRandomDynamicTimeslotDay(Timeslot timeslot);
	Timeslot getRandomDynamicTimeslot() const;
};