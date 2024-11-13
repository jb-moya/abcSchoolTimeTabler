#pragma once

#include <set>
#include <stdexcept>
#include <unordered_map>
#include <unordered_set>

#include "classStartEnd.h"
#include "scheduledDay.h"
#include "types.h"

class TimeslotManager {
   private:
	//    might TODO: used vector instead for optimal randomness
	std::unordered_map<Timeslot, std::set<ScheduledDay>> fixed_timeslot_day;
	std::unordered_map<Timeslot, std::set<ScheduledDay>> dynamic_timeslot_day;
	std::unordered_map<Timeslot, ClassStartEnd> time_range;
	std::unordered_set<Timeslot> segmented_timeslot;
	std::unordered_set<Timeslot> dynamic_timeslot;
	std::unordered_set<Timeslot> break_slots;

   public:
	void addBreakSlot(Timeslot break_slot);
	void addSegmentedTimeSlot(Timeslot timeslot);
	void addFixedTimeSlotDay(Timeslot timeslot, ScheduledDay day);
	void addDynamicTimeSlotDay(Timeslot timeslot, ScheduledDay day);
	const std::unordered_map<Timeslot, std::set<ScheduledDay>>& getFixedTimeslotDay() const;

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

	const std::unordered_set<Timeslot>& getDynamicTimeslot() const;

	bool isPairTimeslotDurationEqual(std::pair<Timeslot, Timeslot> selected_timeslots) const;

	ScheduledDay getRandomDynamicTimeslotDay(Timeslot timeslot) const;
};