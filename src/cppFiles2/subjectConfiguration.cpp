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

int SubjectConfiguration::getUnits() const {
    return units;
}

Timeslot SubjectConfiguration::getFixedTimeslot() const {
	return fixed_timeslot;
}

std::vector<ScheduledDay> SubjectConfiguration::getFixedDays() const {
	return fixed_days;
}