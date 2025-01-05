#pragma once

#include <stdexcept>
#include <unordered_map>
#include <vector>

#include "random_util.h"
#include "types.h"

class SubjectEligibilityManager {
   private:
	std::unordered_map<SubjectID, std::vector<TeacherID>> eligible_teachers_in_subject;

   public:
	static inline const std::vector<TeacherID> empty = {};

	void addTeacher(SubjectID subjectId, TeacherID teacherId) {
		eligible_teachers_in_subject[subjectId].push_back(teacherId);
	}

	const std::vector<TeacherID>& getEligibleTeachers(SubjectID subjectId) const {
		if (eligible_teachers_in_subject.find(subjectId) == eligible_teachers_in_subject.end()) {
			return empty;
		}

		return eligible_teachers_in_subject.at(subjectId);
	}

	TeacherID getNewRandomTeacher(SubjectID subjectId, TeacherID old_teacher = -1) {
		const auto& eligibleTeachers = getEligibleTeachers(subjectId);
		if (eligibleTeachers.empty()) {
			return -1;
		}

		if (eligibleTeachers.size() == 1) {
			return eligibleTeachers[0];
		}

		std::uniform_int_distribution<> dis(0, eligibleTeachers.size() - 1);

		TeacherID new_teacher;
		do {
			new_teacher = eligibleTeachers[dis(randomizer_engine)];
		} while (new_teacher == old_teacher && old_teacher != -1);

		return new_teacher;
	}
};