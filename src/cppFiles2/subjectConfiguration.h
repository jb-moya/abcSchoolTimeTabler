#pragma once

#include <unordered_set>
#include <vector>

#include "scheduledDay.h"
#include "types.h"

struct SubjectConfiguration {
   private:
	const SubjectConfigurationID id;
	const SubjectID subject_id;
	const TimeDuration duration;
	const int units;
	const Timeslot order;

   public:
	SubjectConfiguration(SubjectConfigurationID id_,
	                     SubjectID subject_id_,
	                     TimeDuration duration_,
	                     int units_,
	                     Timeslot order_)
	    : id(id_),
	      subject_id(subject_id_),
	      duration(duration_),
	      units(units_),
	      order(order_) {}

	SubjectConfigurationID getSubjectConfigurationId() const;
	SubjectID getSubjectId() const;
	TimeDuration getDuration() const;
	int getUnits() const;
	Timeslot getOrder() const;
};