#pragma once

#include "scheduledDay.h"
#include "types.h"

struct SubjectClassBlock {
	bool is_consistent;
	Timeslot fixed_timeslot;
	ScheduledDay fixed_day;
	TimeDuration duration;
};