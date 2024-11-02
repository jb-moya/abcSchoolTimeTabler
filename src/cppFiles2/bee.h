#ifndef BEE_H
#define BEE_H

#include <cstdint>
#include <iostream>
#include <unordered_map>
#include <vector>

#include "timetable.h"

struct teacherViolation {
	unsigned long long class_timeslot_overlap;
	unsigned long long no_break;
	unsigned long long exceed_workload;
};

struct sectionViolation {
	unsigned long long early_break;
	unsigned long long small_break_gap;
	unsigned long long late_break;
};

struct Bee {
	Timetable timetable;
	std::vector<teacherViolation> teacher_violations;
	std::vector<sectionViolation> section_violations;
	unsigned long long total_cost;

	void resetTeacherViolation(int teacher_id) {
		teacher_violations[teacher_id].class_timeslot_overlap = 0;
		teacher_violations[teacher_id].no_break = 0;
		teacher_violations[teacher_id].exceed_workload = 0;
	}

	void resetSectionViolation(int section_id) {
		section_violations[section_id].early_break = 0;
		section_violations[section_id].small_break_gap = 0;
		section_violations[section_id].late_break = 0;
	}

	Bee(int num_teachers,
	    int num_sections,
	    std::unordered_map<int, Section> sections,
	    std::unordered_map<int, Teacher> teachers) : teacher_violations(num_teachers),
	                                                 section_violations(num_sections),
	                                                 total_cost(std::numeric_limits<int>::max()) {
		timetable.sections = sections;
		timetable.teachers = teachers;
	}
};

#endif  // BEE_H.