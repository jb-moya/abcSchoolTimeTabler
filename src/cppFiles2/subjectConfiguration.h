#ifndef SUBJECTCONFIGURATION_H
#define SUBJECTCONFIGURATION_H

#include <unordered_set>
#include <vector>

#include "scheduledDay.h"

struct SubjectConfiguration {
   private:
	const int id;
	const int subject_id;
	const int duration;
	const int units;
	const int order;

   public:
	SubjectConfiguration(int id_,
	                     int subject_id_,
	                     int duration_,
	                     int units_,
	                     int order_)
	    : id(id_),
	      subject_id(subject_id_),
	      duration(duration_),
	      units(units_),
	      order(order_) {}

	int getSubjectConfigurationId() const;
	int getSubjectId() const;
	int getDuration() const;
	int getUnits() const;
	int getOrder() const;
};

#endif  // SUBJECTCONFIGURATION_H