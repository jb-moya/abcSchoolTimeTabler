#pragma once

#include <map>
#include <unordered_map>
#include <unordered_set>

#include "scheduledDay.h"

struct Teacher {
   private:
	const int id;
	const int max_work_load;

	std::unordered_map<ScheduledDay, std::map<int, int>> utilized_time;
	std::unordered_map<ScheduledDay, int> class_count;

	bool has_violation;

   public:
	static int total_teacher;
	static std::unordered_set<int> s_all_teachers;
	Teacher(int id_, int max_work_load_);
	// Teacher(int id_, int max_work_load_) : id(id_), max_work_load(max_work_load_) {}

	void initializeClass(int work_week);

	int getId() const;
	int getMaxWorkLoad() const;
	bool hasViolation() const;

	const std::unordered_map<ScheduledDay, std::map<int, int>> getUtilizedTime() const;
	const std::unordered_map<ScheduledDay, int> getClassCount() const;

	void adjustUtilizedTime(int day, int timeslot, int value);
	int incrementUtilizedTime(int day, int timeslot);
	int decrementUtilizedTime(int day, int timeslot);

	void incrementClassCount(ScheduledDay day);
	void decrementClassCount(ScheduledDay day);

	int removeUtilizedTimeslot(int day, int timeslot);

	bool isUtilizedTimesDayEmpty(int day);

	void removeUtilizedTimeDay(int day);
};