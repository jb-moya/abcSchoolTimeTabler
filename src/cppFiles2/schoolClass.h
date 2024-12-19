#pragma once

#include "types.h"
#include "scheduledDay.h"

struct SchoolClass {
	SubjectID subject_id;
	TeacherID teacher_id;
	TimeDuration duration;
	bool is_consistent_everyday;
	Timeslot fixed_timeslot;
	ScheduledDay fixed_days;
};