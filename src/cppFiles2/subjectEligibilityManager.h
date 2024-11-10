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
		if (eligible_teachers_in_subject.find(subjectId) == eligible_teachers_in_subject.end()) {
			throw std::runtime_error("No eligible teachers available for subject." + std::to_string(subjectId));
		}

		return eligible_teachers_in_subject.at(subjectId);
	}

	int getNewRandomTeacher(int subjectId, int old_teacher = -1) {
		const auto& eligibleTeachers = getEligibleTeachers(subjectId);
		if (eligibleTeachers.empty()) {
			throw std::runtime_error("No eligible teachers available for subject.");
		}

		if (eligibleTeachers.size() == 1) {
			return eligibleTeachers[0];
		}

		std::uniform_int_distribution<> dis(0, eligibleTeachers.size() - 1);

		int new_teacher;
		do {
			new_teacher = eligibleTeachers[dis(randomizer_engine)];
		} while (new_teacher == old_teacher && old_teacher != -1);

		return new_teacher;
	}
};