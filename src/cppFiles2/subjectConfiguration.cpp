#include "subjectConfiguration.h"

SubjectConfigurationID SubjectConfiguration::getSubjectConfigurationId() const {
	return id;
}

SubjectID SubjectConfiguration::getSubjectId() const {
	return subject_id;
}

TimeDuration SubjectConfiguration::getDuration() const {
	return duration;
}

bool SubjectConfiguration::isConsistentEveryday() const {
	return is_consistent_everyday;
}

Timeslot SubjectConfiguration::getFixedTimeslot() const {
	return fixed_timeslot;
}

ScheduledDay SubjectConfiguration::getFixedDay() const {
	return fixed_day;
}