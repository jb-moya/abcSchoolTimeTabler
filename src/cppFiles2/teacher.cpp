#include "teacher.h"

#include "timetable.h"

int Teacher::teacher_count;

Teacher::Teacher(TeacherID id_, TimeDuration max_work_load_, TimeDuration min_work_load_)
    : id(id_), max_work_load(max_work_load_), min_work_load(min_work_load_), utilized_time(), has_violation(false) {
	for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
		day_total_work_load[static_cast<ScheduledDay>(day)] = 0;
	}
}

void Teacher::initializeClass(int work_week) {
	for (int day = 1; day <= work_week; ++day) {
		day_total_work_load[static_cast<ScheduledDay>(day)] = 0;
	}
}

TeacherID Teacher::getId() const {
	return id;
}

int Teacher::getMaxDayWorkLoad() const {
	return max_work_load;
}

int Teacher::getMinDayWorkLoad() const {
	return min_work_load;
}

bool Teacher::hasViolation() const {
	return has_violation;
}

const std::unordered_map<ScheduledDay, std::map<TimePoint, std::tuple<SectionID, int, int, int>>> Teacher::getUtilizedTime() const {
	return utilized_time;
}

const std::unordered_map<ScheduledDay, TimeDuration> Teacher::getDayTotalWorkLoad() const {
	return day_total_work_load;
}

void Teacher::incrementClassCount(ScheduledDay day) {
	if (day == ScheduledDay::EVERYDAY) {
		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			++day_total_work_load[static_cast<ScheduledDay>(day)];
		}
	} else {
		++day_total_work_load[day];
	}
}

void Teacher::decrementClassCount(ScheduledDay day) {
	if (day == ScheduledDay::EVERYDAY) {
		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			--day_total_work_load[static_cast<ScheduledDay>(day)];
		}
	} else {
		--day_total_work_load[day];
	}
}

int Teacher::incrementUtilizedTime(int day, TimePoint timePoint, int class_type, SectionID section_id) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);

	auto& tuple_value = utilized_time[scheduled_day][timePoint];
	std::get<0>(tuple_value) = section_id;

	if (class_type == 1) {
		++std::get<1>(tuple_value);
	} else if (class_type == 2) {
		++std::get<2>(tuple_value);
	} else if (class_type == 3) {
		++std::get<3>(tuple_value);
	}

	return std::get<1>(tuple_value) + std::get<2>(tuple_value) + std::get<3>(tuple_value);
}

int Teacher::decrementUtilizedTime(int day, TimePoint timePoint, int class_type) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);

	auto& tuple_value = utilized_time[scheduled_day][timePoint];

	if (class_type == 1) {
		--std::get<1>(tuple_value);
	} else if (class_type == 2) {
		--std::get<2>(tuple_value);
	} else if (class_type == 3) {
		--std::get<3>(tuple_value);
	}

	return std::get<1>(tuple_value) + std::get<2>(tuple_value);
}

int Teacher::removeUtilizedTimePoint(int day, TimePoint timePoint) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	return utilized_time[scheduled_day].erase(timePoint);
}

bool Teacher::isUtilizedTimesDayEmpty(int day) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	return utilized_time[scheduled_day].empty();
}

void Teacher::removeUtilizedTimeDay(int day) {
	ScheduledDay scheduled_day = static_cast<ScheduledDay>(day);
	utilized_time.erase(scheduled_day);
}