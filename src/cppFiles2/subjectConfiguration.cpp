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

int SubjectConfiguration::getOrder() const {    
    return order;
}