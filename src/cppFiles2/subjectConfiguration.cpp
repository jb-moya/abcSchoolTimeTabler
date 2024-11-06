#include "subjectConfiguration.h"

int SubjectConfiguration::getSubjectConfigurationId() const {
	return id;
}

int SubjectConfiguration::getSubjectId() const {
    return subject_id;
}

int SubjectConfiguration::getDuration() const {
    return duration;
}

int SubjectConfiguration::getUnits() const {
    return units;
}

int SubjectConfiguration::getOrder() const {    
    return order;
}