#pragma once

#include <map>
#include <unordered_map>
#include <unordered_set>

#include "scheduledDay.h"
#include "types.h"

struct Teacher {
   private:
	TeacherID id;
	TimeDuration max_work_load;
	TimeDuration min_work_load;

	std::unordered_map<ScheduledDay, std::map<TimePoint, int>> utilized_time;
	std::unordered_map<ScheduledDay, TimeDuration> day_total_work_load;

	bool has_violation;

   public:
	static int teacher_count;
	Teacher(TeacherID id_, TimeDuration max_work_load_, TimeDuration min_work_load_);

	void initializeClass(int work_week);

	TeacherID getId() const;
	TimeDuration getMaxWorkLoad() const;
	TimeDuration getMinWorkLoad() const;

	bool hasViolation() const;

	const std::unordered_map<ScheduledDay, std::map<TimePoint, int>> getUtilizedTime() const;
	const std::unordered_map<ScheduledDay, TimeDuration> getDayTotalWorkLoad() const;

	void adjustUtilizedTime(int day, TimePoint timePoint, int value);
	int incrementUtilizedTime(int day, TimePoint timePoint);
	int decrementUtilizedTime(int day, TimePoint timePoint);

	void incrementClassCount(ScheduledDay day);
	void decrementClassCount(ScheduledDay day);

	int removeUtilizedTimePoint(int day, TimePoint timePoint);

	bool isUtilizedTimesDayEmpty(int day);

	void removeUtilizedTimeDay(int day);
};