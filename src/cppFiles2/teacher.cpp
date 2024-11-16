#include "teacher.h"

#include "print.h"
#include "timetable.h"

int Teacher::teacher_count;
std::unordered_set<TeacherID> Teacher::s_all_teachers;

Teacher::Teacher(TeacherID id_, int max_work_load_, TimeDuration min_work_load_)
    : id(id_), max_work_load(max_work_load_), min_work_load(min_work_load_), utilized_time(), has_violation(false) {
	for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
		class_count[static_cast<ScheduledDay>(day)] = 0;
	}
}

void Teacher::initializeClass(int work_week) {
	for (int day = 1; day <= work_week; ++day) {
		class_count[static_cast<ScheduledDay>(day)] = 0;
	}
}

TeacherID Teacher::getId() const {
	return id;
}

int Teacher::getMaxWorkLoad() const {
	return max_work_load;
}

bool Teacher::hasViolation() const {
	return has_violation;
}

const std::unordered_map<ScheduledDay, std::map<TimePoint, int>> Teacher::getUtilizedTime() const {
	return utilized_time;
}

const std::unordered_map<ScheduledDay, int> Teacher::getClassCount() const {
	return class_count;
}

void Teacher::adjustUtilizedTime(int day, TimePoint timePoint, int value) {
	utilized_time[static_cast<ScheduledDay>(day)][timePoint] += value;
}

void Teacher::incrementClassCount(ScheduledDay day) {
	if (day == ScheduledDay::EVERYDAY) {
		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			++class_count[static_cast<ScheduledDay>(day)];
		}
	} else {
		++class_count[day];
	}
}

void Teacher::decrementClassCount(ScheduledDay day) {
	if (day == ScheduledDay::EVERYDAY) {
		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			--class_count[static_cast<ScheduledDay>(day)];
		}
	} else {
		--class_count[day];
	}
}

int Teacher::incrementUtilizedTime(int day, TimePoint timePoint) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return ++utilized_time[scheduled_day][timePoint];
}

int Teacher::decrementUtilizedTime(int day, TimePoint timePoint) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return --utilized_time[scheduled_day][timePoint];
}

int Teacher::removeUtilizedTimePoint(int day, TimePoint timePoint) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return utilized_time[scheduled_day].erase(timePoint);
}

bool Teacher::isUtilizedTimesDayEmpty(int day) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return utilized_time[scheduled_day].empty();
}

void Teacher::removeUtilizedTimeDay(int day) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	utilized_time.erase(scheduled_day);
}