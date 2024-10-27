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

void logResults(std::ofstream& txt_file,
                double total_cost,
                std::string timelapse,
                std::string date_issued,
                std::string time_issued,
                int iteration_count,
                int max_iterations,
                int num_teachers,
                int total_section_subjects,
                int total_section,
                int teacher_subjects_length,
                int bees_population,
                int bees_employed,
                int bees_onlooker,
                int bees_scout,
                int limit,
                int work_week,
                int max_teacher_work_load,
                int break_time_duration,
                int break_timeslot_allowance,
                int teacher_break_threshold,
                int min_total_class_duration_for_two_breaks,
                int default_class_duration,
                int result_buff_length,
                int offset_duration,
                bool enable_logging) {
	txt_file << "----------------------------------------------------------------------" << std::endl;
	txt_file << "Best solution: " << std::endl;
	txt_file << "Total cost: " << total_cost << std::endl;
	txt_file << "Total process duration: " << timelapse << std::endl;
	txt_file << "Iteration count: " << iteration_count << std::endl;
	txt_file << "max_iterations: " << max_iterations << std::endl;
	txt_file << "num_teachers: " << num_teachers << std::endl;
	txt_file << "total_section_subjects: " << total_section_subjects << std::endl;
	txt_file << "total_section: " << total_section << std::endl;
	txt_file << "teacher_subjects_length: " << teacher_subjects_length << std::endl;
	txt_file << "bees_population: " << bees_population << std::endl;
	txt_file << "bees_employed: " << bees_employed << std::endl;
	txt_file << "bees_onlooker: " << bees_onlooker << std::endl;
	txt_file << "bees_scout: " << bees_scout << std::endl;
	txt_file << "limit: " << limit << std::endl;
	txt_file << "work_week: " << work_week << std::endl;
	txt_file << "max_teacher_work_load: " << max_teacher_work_load << std::endl;
	txt_file << "break_time_duration: " << break_time_duration << std::endl;
	txt_file << "break_timeslot_allowance: " << break_timeslot_allowance << std::endl;
	txt_file << "teacher_break_threshold: " << teacher_break_threshold << std::endl;
	txt_file << "min_total_class_duration_for_two_breaks: " << min_total_class_duration_for_two_breaks << std::endl;
	txt_file << "default_class_duration: " << default_class_duration << std::endl;
	txt_file << "result_buff_length: " << result_buff_length << std::endl;
	txt_file << "offset_duration: " << offset_duration << std::endl;
	txt_file << "enable_logging: " << (enable_logging ? "true" : "false") << std::endl;

	txt_file << "Date Issued: " << date_issued << std::endl;
	txt_file << "Time Issued: " << time_issued << std::endl;
	txt_file << "----------------------------------------------------------------------" << std::endl;
}