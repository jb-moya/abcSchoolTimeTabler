#pragma once

#include <map>
#include <unordered_map>
#include <unordered_set>

#include "scheduledDay.h"
#include "types.h"

struct Teacher {
   private:
	TeacherID id;
	int max_work_load;

	std::unordered_map<ScheduledDay, std::map<TimePoint, int>> utilized_time;
	std::unordered_map<ScheduledDay, int> class_count;

	bool has_violation;

   public:
	static int teacher_count;
	static std::unordered_set<TeacherID> s_all_teachers;
	Teacher(TeacherID id_, int max_work_load_);
	// Teacher(int id_, int max_work_load_) : id(id_), max_work_load(max_work_load_) {}

	void initializeClass(int work_week);

	TeacherID getId() const;
	int getMaxWorkLoad() const;
	bool hasViolation() const;

	const std::unordered_map<ScheduledDay, std::map<TimePoint, int>> getUtilizedTime() const;
	const std::unordered_map<ScheduledDay, int> getClassCount() const;

	void adjustUtilizedTime(int day, TimePoint timePoint, int value);
	int incrementUtilizedTime(int day, TimePoint timePoint);
	int decrementUtilizedTime(int day, TimePoint timePoint);

	void incrementClassCount(ScheduledDay day);
	void decrementClassCount(ScheduledDay day);

	int removeUtilizedTimePoint(int day, TimePoint timePoint);

	bool isUtilizedTimesDayEmpty(int day);

	void removeUtilizedTimeDay(int day);
};