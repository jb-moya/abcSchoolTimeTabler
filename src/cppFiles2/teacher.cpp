#include "teacher.h"
#include "print.h"

int Teacher::total_teacher;
std::unordered_set<int> Teacher::s_all_teachers;

void Teacher::initializeClass(int work_week) {
	for (int day = 1; day <= work_week; ++day) {
		class_count[static_cast<ScheduledDay>(day)] = 0;
	}
}

int Teacher::getId() const {
	return id;
}

int Teacher::getMaxWorkLoad() const {
	return max_work_load;
}

bool Teacher::hasViolation() const {
	return has_violation;
}

const std::unordered_map<ScheduledDay, std::map<int, int>> Teacher::getUtilizedTime() const {
	return utilized_time;
}

const std::unordered_map<ScheduledDay, int> Teacher::getClassCount() const {
	return class_count;
}

void Teacher::adjustUtilizedTime(int day, int timeslot, int value) {
	utilized_time[static_cast<ScheduledDay>(day)][timeslot] += value;
}

void Teacher::incrementClassCount(ScheduledDay day) {
	++class_count[day];
}

void Teacher::decrementClassCount(ScheduledDay day) {
	--class_count[day];
}

int Teacher::incrementUtilizedTime(int day, int timeslot) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return ++utilized_time[scheduled_day][timeslot];
}

int Teacher::decrementUtilizedTime(int day, int timeslot) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return --utilized_time[scheduled_day][timeslot];
}

int Teacher::removeUtilizedTimeslot(int day, int timeslot) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	// print("scheduled_day", static_cast<int>(scheduled_day));
	return utilized_time[scheduled_day].erase(timeslot);
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