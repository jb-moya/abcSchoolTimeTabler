#include "timeslotManager.h"

#include "print.h"
#include "random_util.h"

void TimeslotManager::setTimeRange(Timeslot timeslot, ClassStartEnd time_range_) {
	time_range[timeslot] = time_range_;
}
bool TimeslotManager::isInBreakSlots(Timeslot timeslot) const {
	return break_slots.find(timeslot) != break_slots.end();
}
bool TimeslotManager::isInSegmentedTimeslot(Timeslot timeslot) const {
	return dynamic_segmented_timeslot.find(timeslot) != dynamic_segmented_timeslot.end();
}
void TimeslotManager::removeSegmentedTimeSlot(Timeslot timeslot) {
	dynamic_segmented_timeslot.erase(timeslot);
}
void TimeslotManager::addSegmentedTimeSlot(Timeslot timeslot) {
	dynamic_segmented_timeslot.insert(timeslot);
}

ClassStartEnd TimeslotManager::getClassStartTime(Timeslot timeslot) const {
	if (time_range.find(timeslot) == time_range.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
	};

	return time_range.find(timeslot)->second;
}
void TimeslotManager::addBreakSlot(Timeslot timeslot) {
	break_slots.insert(timeslot);
}
void TimeslotManager::removeBreakSlot(Timeslot timeslot) {
	break_slots.erase(timeslot);
}
ScheduledDay TimeslotManager::getRandomDynamicTimeslotDay(Timeslot timeslot) const {
	if (dynamic_timeslot_day.find(timeslot) == dynamic_timeslot_day.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
	}
	const std::set<ScheduledDay>& scheduledDays = dynamic_timeslot_day.find(timeslot)->second;
	std::vector<ScheduledDay> days(scheduledDays.begin(), scheduledDays.end());

	if (scheduledDays.empty()) {
		std::cerr << "No scheduled days found for timeslot: " << timeslot << std::endl;
		throw std::runtime_error("No scheduled days available for the given timeslot");
	}

	std::uniform_int_distribution<int> dis_work_day(0, days.size() - 1);
	return days[dis_work_day(randomizer_engine)];
}
Timeslot TimeslotManager::getRandomDynamicTimeslot() const {
	if (dynamic_timeslot.empty()) {
		std::cerr << "No dynamic timeslots found" << std::endl;
		throw std::runtime_error("No dynamic timeslots available");
	}

	std::uniform_int_distribution<int> dis_work_day(0, dynamic_timeslot.size() - 1);
	return dynamic_timeslot[dis_work_day(randomizer_engine)];
}

void TimeslotManager::addDynamicTimeSlotDay(Timeslot timeslot, ScheduledDay day) {
	dynamic_timeslot_day[timeslot].insert(day);
}
void TimeslotManager::addDynamicTimeSlot(Timeslot timeslot) {
	dynamic_timeslot.push_back(timeslot);
}
const std::unordered_set<Timeslot>& TimeslotManager::getBreakSlots() const {
	return break_slots;
}

TimePoint TimeslotManager::getTimeslotStart(Timeslot timeslot) const {
	auto it = time_range.find(timeslot);
	if (it == time_range.end()) {
		throw std::runtime_error(std::to_string(timeslot) + " Timeslot not found in time_range. Cannot get start time.");
	}
	return time_range.find(timeslot)->second.start;
}

TimePoint TimeslotManager::getTimeslotEnd(Timeslot timeslot) const {
	auto it = time_range.find(timeslot);
	if (it == time_range.end()) {
		throw std::runtime_error(std::to_string(timeslot) + " Timeslot not found in time_range. Cannot get end time.");
	}
	return time_range.find(timeslot)->second.end;
}
void TimeslotManager::updateTimeslotStart(Timeslot timeslot, TimePoint start) {
	auto it = time_range.find(timeslot);
	if (it == time_range.end()) {
		throw std::runtime_error(std::to_string(timeslot) + " Timeslot not found in time_range. Cannot update start time.");
	}
	time_range.find(timeslot)->second.start = start;
}

void TimeslotManager::updateTimeslotEnd(Timeslot timeslot, TimePoint end) {
	auto it = time_range.find(timeslot);
	if (it == time_range.end()) {
		throw std::runtime_error(std::to_string(timeslot) + " Timeslot not found in time_range. Cannot update end time.");
	}
	time_range.find(timeslot)->second.end = end;
}

const std::unordered_set<Timeslot>& TimeslotManager::getDynamicSegmentedTimeslot() const {
	return dynamic_segmented_timeslot;
}

bool TimeslotManager::isPairTimeslotDurationEqual(std::pair<Timeslot, Timeslot> selected_timeslots) const {
	Timeslot selected_timeslot_1 = selected_timeslots.first;
	Timeslot selected_timeslot_2 = selected_timeslots.second;

	TimeDuration duration_1 = getTimeslotEnd(selected_timeslot_1) - getTimeslotStart(selected_timeslot_1);
	TimeDuration duration_2 = getTimeslotEnd(selected_timeslot_2) - getTimeslotStart(selected_timeslot_2);

	return duration_1 == duration_2;
}
