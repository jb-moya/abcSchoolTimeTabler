#pragma once

#include <unordered_set>
#include <vector>

#include "scheduledDay.h"
#include "types.h"
#include "subjectClassBlock.h"

struct SubjectConfiguration {
   private:
	const SubjectConfigurationID id;
	const SubjectID subject_id;
	const TimeDuration duration;
	const bool is_consistent_everyday;
	const Timeslot fixed_timeslot;
	const ScheduledDay fixed_day;

   public:
	SubjectConfiguration(SubjectConfigurationID id_,
	                     SubjectID subject_id_,
	                     TimeDuration duration_,
	                     bool is_consistent_everyday_,
	                     Timeslot fixed_timeslot_,
	                     ScheduledDay fixed_day_)
	    : id(id_),
	      subject_id(subject_id_),
	      duration(duration_),
	      is_consistent_everyday(is_consistent_everyday_),
	      fixed_timeslot(fixed_timeslot_),
	      fixed_day(fixed_day_) {}

	SubjectConfigurationID getSubjectConfigurationId() const;
	SubjectID getSubjectId() const;
	std::vector<SubjectClassBlock>& getSubjectClassBlocks();
	TimeDuration getDuration() const;
	bool isConsistentEveryday() const;
	Timeslot getFixedTimeslot() const;
	ScheduledDay getFixedDay() const;
};