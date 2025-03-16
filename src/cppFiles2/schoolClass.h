#pragma once

#include "types.h"
#include "scheduledDay.h"

struct SchoolClass {
	SubjectConfigurationID subject_configuration_id;
	SubjectID subject_id;
	TeacherID teacher_id;
	TimeDuration duration;
	bool is_consistent_everyday;
	Timeslot fixed_timeslot;
	ScheduledDay fixed_days;
	bool is_overlappable;
};