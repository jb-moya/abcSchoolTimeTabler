#include "log.h"

#include <fstream>  // Required for file handling

#include "print.h"

void logSchoolClasses(Timetable& timetable, std::ofstream& file) {
	if (!file.is_open()) {
		print(RED_B, "Error opening file", RESET);
		return;
	}

	//   teacher                     days          time section
	std::map<int, std::unordered_map<int, std::map<int, int>>> teacher_class;

	std::unordered_map<int, int> section_breaks_distribution;

	for (const auto& [section_id, section] : timetable.sections) {
		file << "--------- - - Section: " << section.id << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : section.classes) {
			for (const auto& [day, schoolClass] : classMap) {
				int subject_id = schoolClass.subject_id;
				int teacher_id = schoolClass.teacher_id;

				file << "" << std::setw(4) << timeslot;
				file << "  d: " << std::setw(2) << ((day == 0) ? (std::to_string(day)) : (std::to_string(day)));

				file << " t: "
				     << std::setw(3)
				     << ((teacher_id == -1) ? (std::string(" ") + "/\\") : std::to_string(teacher_id));

				file << " s: "
				     << std::setw(3)
				     << ((subject_id == -1) ? (std::string(" ") + "/\\") : std::to_string(subject_id));

				if (teacher_id != -1) {
					for (int i = section.time_range.at(timeslot).start; i < section.time_range.at(timeslot).end; i++) {
						teacher_class[teacher_id][day][i] = section.id;
					}

				} else {
					section_breaks_distribution[timeslot]++;
				}

				file << " r: " << std::setw(4) << section.time_range.at(timeslot).start << " ";
				file << std::setw(4) << section.time_range.at(timeslot).end << " ";
				file << std::setw(4) << ++inner_count;

				file << std::endl;
			}
		}
		file << std::endl;
	}

	for (const auto& [teacher_id, days] : teacher_class) {
		file << "t: " << std::setw(3) << teacher_id << std::endl;

		for (const auto& [day, school_class] : days) {
			file << " d: " << day << " | ";

			int begin = school_class.begin()->first;
			int end = school_class.rbegin()->first;

			for (int i = begin; i <= end; i++) {
				bool found = school_class.find(i) != school_class.end();

				if (found) {
					file << " " << std::setw(4) << " " + std::to_string(i);
				} else {
					file << " " << std::setw(4) << "." + std::to_string(i);
				}
			}

			file << std::endl;
		}

		file << std::setw(3) << std::endl;
	}

	file << std::endl;
	file << "Breaks Distribution:" << std::endl;

	for (const auto& [timeslot, count] : section_breaks_distribution) {
		file << "b: " << std::setw(3) << timeslot << " c: " << std::setw(3) << std::to_string(count) << std::endl;
	}

	file << std::endl;
}

void logCosts(std::map<int, int>& nums, std::ofstream& file) {
	file << std::endl
	     << "Costs:" << std::endl;

	for (const auto& num : nums) {
		file << num.first << " : " << num.second << std::endl;
	}
}