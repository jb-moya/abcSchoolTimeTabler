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

void logConflicts(
    Bee& bee,
    std::ofstream& log_file) {
	auto& teachers_timetable = bee.timetable.teachers;

	teacherViolation overall_total_teacher_violation = {0, 0, 0};
	sectionViolation overall_total_section_violation = {0, 0, 0};

	std::map<int16_t, teacherViolation> teachers_total_violation;
	std::map<int16_t, sectionViolation> sections_total_violation;

	for (const int16_t& teacher_id_16 : bee.timetable.s_teachers_set) {
		const int teacher_id = static_cast<int>(teacher_id_16);

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
		const auto& class_count = teachers_timetable.at(teacher_id).class_count;

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (class_count.at(day) > max_teacher_work_load) {
				overall_total_teacher_violation.exceed_workload++;
				teachers_total_violation[teacher_id].exceed_workload++;
			}

			if (timeslot.size() == 0) {
				continue;
			}

			auto it = timeslot.begin();
			auto nextIt = std::next(it);

			std::set<int> teacher_available_timeslot;

			auto lastElement = --timeslot.end();
			float middle = (timeslot.begin()->first + lastElement->first) / 2;

			int allowance_multiplier = 2;

			float min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			float max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);

			int rounded_min_allowance = static_cast<int>(std::floor(min_allowance));
			int rounded_max_allowance = static_cast<int>(std::ceil(max_allowance));

			bool break_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - timeslot_key - 1;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= rounded_max_allowance) ||
						    (rounded_min_allowance <= nextKey - 1 && nextKey - 1 <= rounded_max_allowance)) {
							break_found = true;
						}
					}
				}

				if (class_count > 1) {
					overall_total_teacher_violation.class_timeslot_overlap += class_count;

					print("class_count", class_count);
					teachers_total_violation[teacher_id]
					    .class_timeslot_overlap += class_count;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			if (!break_found && class_count.at(day) >= bee.timetable.s_teacher_break_threshold) {
				overall_total_teacher_violation.no_break++;
				teachers_total_violation[teacher_id].no_break++;
			}
		}
	}

	for (const int16_t& section_id_16 : bee.timetable.s_sections_set) {
		const int section_id = static_cast<int>(section_id_16);

		auto& section = bee.timetable.sections[section_id];

		int early_not_allowed_break_duration_gap = Timetable::s_section_not_allowed_breakslot_gap[section_id] * Timetable::s_default_class_duration;
		int late_not_allowed_break_duration_gap = (Timetable::s_section_not_allowed_breakslot_gap[section_id] + 1) * Timetable::s_default_class_duration;

		int max_time = Timetable::s_section_start[section_id] + Timetable::s_section_total_duration[section_id];

		if (section.break_slots.size() == 1) {
			int break_time = *section.break_slots.begin();

			if (section.time_range[break_time].end > max_time - late_not_allowed_break_duration_gap) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (section.time_range[break_time].start < early_not_allowed_break_duration_gap) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}
		} else {
			int first_break_time = *section.break_slots.begin();
			int last_break_time = *section.break_slots.rbegin();

			int first_start = section.time_range[first_break_time].start;
			int last_end = section.time_range[last_break_time].end;

			if (last_end > max_time - late_not_allowed_break_duration_gap) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (first_start < early_not_allowed_break_duration_gap) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}

			if (last_end - first_start <= early_not_allowed_break_duration_gap) {
				overall_total_section_violation.small_break_gap++;
				sections_total_violation[section_id].small_break_gap++;
			}
		}
	}

	log_file << "- + - + - + - + - TOTAL COST: Conflicts: - + - + - + - + - +" << std::endl;
	log_file << "Teacher: " << std::endl;
	log_file << "class timeslot overlap: " << overall_total_teacher_violation.class_timeslot_overlap << std::endl;
	log_file << "no break: " << overall_total_teacher_violation.no_break << std::endl;
	log_file << "exceed workload: " << overall_total_teacher_violation.exceed_workload << std::endl;
	log_file << std::endl;

	log_file << "Section: " << std::endl;
	log_file << "late break: " << overall_total_section_violation.late_break << std::endl;
	log_file << "early break: " << overall_total_section_violation.early_break << std::endl;
	log_file << "small break gap: " << overall_total_section_violation.small_break_gap << std::endl;
	log_file << "- + - + - + - + - + - + - + - + - + - + - + - + - + - + - + - +" << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	// log_file << "............................teachers total class:....................." << std::endl;

	// std::vector<int16_t> days;
	// for (const auto& [day, _] : bee.timetable.teachers_class_count) {
	// 	days.push_back(day);
	// }

	// // Output column headers (the days)
	// log_file << std::setw(6) << "id";
	// for (const auto& day : days) {
	// 	log_file << std::setw(6) << "d " + std::to_string(day);
	// }
	// log_file << std::endl;

	// // Find the maximum number of teachers to iterate over.
	// // int max_teacher_count = 0;
	// // for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
	// // 	if (teacher.size() > max_teacher_count) {
	// // 		max_teacher_count = teacher.size();
	// // 	}
	// // }
	// int max_teacher_count = 0;
	// for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
	// 	if (static_cast<int>(teacher.size()) > max_teacher_count) {
	// 		max_teacher_count = static_cast<int>(teacher.size());
	// 	}
	// }

	// // Output each teacher and their class count for each day.
	// for (int teacher_id = 0; teacher_id < max_teacher_count; ++teacher_id) {
	// 	log_file << std::endl;
	// 	log_file << std::setw(6) << teacher_id;  // Print teacher ID in the first column.

	// 	bool is_consistent = true;
	// 	int first_day_count = -1;  // Initialize to an invalid value for comparison.

	// 	// For each day, print the corresponding class count for this teacher.
	// 	for (const auto& day : days) {
	// 		const auto& teachers = bee.timetable.teachers_class_count.at(day);

	// 		if (teacher_id < static_cast<int>(teachers.size())) {
	// 			int current_count = teachers[teacher_id];

	// 			// Check if this is the first valid count we're seeing for this teacher.
	// 			if (first_day_count == -1) {
	// 				first_day_count = current_count;  // Set first day's class count.
	// 			} else if (current_count != first_day_count) {
	// 				is_consistent = false;  // Inconsistent if current count doesn't match the first day.
	// 			}

	// 			log_file << std::setw(6) << current_count;
	// 		} else {
	// 			log_file << std::setw(6) << "-";  // Print a dash if no teacher exists for this day.
	// 		}
	// 	}

	// 	log_file << std::setw(6) << " | " << (is_consistent ? "Consistent" : "not consistent") << std::endl;
	// 	log_file << std::endl;
	// }

	// log_file << "......................................................................" << std::endl;

	log_file << "/ / / / / / / teachers that have violations: / / / / / / / " << std::endl;

	for (const auto& [teacher_id, teacher_violation] : teachers_total_violation) {
		log_file << "Teacher: " << teacher_id << std::endl;

		if (teacher_violation.class_timeslot_overlap > 0) {
			log_file << "." << std::setw(4) << " class timeslot overlap: " << teacher_violation.class_timeslot_overlap << std::endl;
		}

		if (teacher_violation.no_break > 0) {
			log_file << "." << std::setw(4) << " no break: " << teacher_violation.no_break << std::endl;
		}

		if (teacher_violation.exceed_workload > 0) {
			log_file << "." << std::setw(4) << " exceed workload: " << teacher_violation.exceed_workload << std::endl;
		}
	}

	log_file << "/ / / / / / / / / / / / / / / / / / / / / / / / / / / / / " << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	log_file << "/ / / / / / / sections that have violations: / / / / / / / " << std::endl;

	for (const auto& [section_id, section_violation] : sections_total_violation) {
		log_file << "Section: " << section_id << std::endl;

		if (section_violation.late_break > 0) {
			log_file << "." << std::setw(4) << " late break: " << section_violation.late_break << std::endl;
		}

		if (section_violation.early_break > 0) {
			log_file << "." << std::setw(4) << " early break: " << section_violation.early_break << std::endl;
		}

		if (section_violation.small_break_gap > 0) {
			log_file << "." << std::setw(4) << " small break gap: " << section_violation.small_break_gap << std::endl;
		}
	}

	log_file << "/ / / / / / / / / / / / / / / / / / / / / / / / / / / / / " << std::endl;

	log_file << "\n\n\n\n\n\n\n";
}
