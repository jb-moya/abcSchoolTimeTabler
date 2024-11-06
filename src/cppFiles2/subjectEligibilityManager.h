#ifndef SUBJECTELIGIBILITYMANAGER_H
#define SUBJECTELIGIBILITYMANAGER_H

#include <unordered_map>
#include <vector>
#include "random_util.h"

class SubjectEligibilityManager {
   private:
	std::unordered_map<int, std::vector<int>> eligible_teachers_in_subject;
	std::unordered_map<int, std::uniform_int_distribution<>> dis_map;

   public:
	void addTeacher(int subjectId, int teacherId) {
		eligible_teachers_in_subject[subjectId].push_back(teacherId);
	}

	const std::vector<int>& getEligibleTeachers(int subjectId) const {
		return eligible_teachers_in_subject.at(subjectId);
	}

	int getRandomTeacher(int subjectId) {
		const auto& eligibleTeachers = getEligibleTeachers(subjectId);
		std::uniform_int_distribution<> dis(0, eligibleTeachers.size() - 1);
		return eligibleTeachers[dis(randomizer_engine)];
	}
};

#endif  // SUBJECTELIGIBILITYMANAGER_H