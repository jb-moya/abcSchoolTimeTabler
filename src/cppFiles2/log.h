#pragma once

#include <fstream>
#include <map>

#include "bee.h"
#include "print.h"

inline void logSchoolClasses(Timetable& timetable, std::ofstream& file) {
	if (!file.is_open()) {
		print(RED_B, "Error opening file", RESET);
		return;
	}

	std::map<TeacherID, std::unordered_map<ScheduledDay, std::map<TimePoint, SectionID>>> teacher_class;

	std::unordered_map<Timeslot, int> section_breaks_distribution;

	std::map<Timeslot, std::vector<TeacherID>> teachers_in_timeslot;

	const auto& section_set = Timetable::getSectionsSet();

	for (const auto& section_id : section_set) {
		Section section = timetable.getSectionById(section_id);

		const auto& classes = section.getClasses();

		file << "--------- - - Section: " << section_id << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : classes) {
			for (const auto& [day, schoolClass] : classMap) {
				SubjectID subject_id = schoolClass.subject_id;
				TeacherID teacher_id = schoolClass.teacher_id;

				teachers_in_timeslot[timeslot].push_back(teacher_id);

				file << "" << std::setw(4) << timeslot;
				file << "  d: " << std::setw(2) << ((day == ScheduledDay::EVERYDAY) ? (std::to_string(static_cast<int>(day))) : (std::to_string(static_cast<int>(day))));

				file << " t: "
				     << std::setw(3)
				     << ((teacher_id == -1) ? (std::string(" ") + "/\\") : std::to_string(teacher_id));

				file << " s: "
				     << std::setw(3)
				     << ((subject_id == -1) ? (std::string(" ") + "/\\") : std::to_string(subject_id));

				if (teacher_id != -1) {
					for (TimePoint time_point = section.getTimeslotStart(timeslot); time_point < section.getTimeslotEnd(timeslot); time_point++) {
						teacher_class[teacher_id][day][time_point] = section_id;
					}

				} else {
					section_breaks_distribution[timeslot]++;
				}

				file << " r: " << std::setw(4) << section.getTimeslotStart(timeslot) << " ";
				file << std::setw(4) << section.getTimeslotEnd(timeslot) << " ";
				file << std::setw(4) << ++inner_count;

				file << std::endl;
			}
		}
		file << std::endl;
	}

	for (auto& [timeslot, teacher] : teachers_in_timeslot) {
		file << "t: " << std::setw(3);

		for (auto& teacher_id : teacher) {
			file << std::setw(3) << teacher_id << " ";
		}

		file << std::endl;
	}

	file << std::endl;

	for (const auto& [teacher_id, days] : teacher_class) {
		file << "t: " << std::setw(3) << teacher_id << std::endl;

		for (const auto& [day, school_class] : days) {
			file << " d: " << static_cast<int>(day) << " | ";

			TimePoint lowest_time_point = school_class.begin()->first;
			TimePoint hihest_time_point = school_class.rbegin()->first;

			for (TimePoint time_point = lowest_time_point; time_point <= hihest_time_point; time_point++) {
				bool found = school_class.find(time_point) != school_class.end();

				if (found) {
					file << " " << std::setw(4) << " " + std::to_string(time_point);
				} else {
					file << " " << std::setw(4) << "." + std::to_string(time_point);
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

inline void logCosts(std::map<int, int>& nums, std::ofstream& file) {
	file << std::endl
	     << "Costs:" << std::endl;

	for (const auto& num : nums) {
		file << num.first << " : " << num.second << std::endl;
	}
}

inline void logResults(std::ofstream& txt_file,
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
                       int break_time_duration,
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
	txt_file << "break_time_duration: " << break_time_duration << std::endl;
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

inline void logConflicts(
    Bee* bee,
    std::ofstream& log_file) {
	// auto& teachers_timetable = bee->timetable.teachers;

	if (bee == nullptr) {
		print("Bee is null or timetable is null");
		exit(1);
	}

	teacherViolation overall_total_teacher_violation{};
	sectionViolation overall_total_section_violation{};

	std::map<TeacherID, teacherViolation> teachers_total_violation;
	std::map<SectionID, sectionViolation> sections_total_violation;

	const auto& teacher_set = bee->timetable.getTeachersSet();

	for (TeacherID teacher_id : teacher_set) {
		Teacher teacher = bee->timetable.getTeacherById(teacher_id);

		const auto& daily_class_schedule = teacher.getUtilizedTime();
		const auto& total_day_work_load = teacher.getDayTotalWorkLoad();

		const TimeDuration max_teacher_work_load = teacher.getMaxWorkLoad();
		const TimeDuration min_teacher_work_load = teacher.getMinWorkLoad();

		const TimeDuration break_time_duration = bee->timetable.getBreakTimeDuration();

		for (const auto& [day, time_points_class_count] : daily_class_schedule) {
			if (total_day_work_load.at(day) > max_teacher_work_load) {
				overall_total_teacher_violation.exceed_workload++;
				teachers_total_violation[teacher_id].exceed_workload++;
			}

			if (total_day_work_load.at(day) < min_teacher_work_load) {
				overall_total_teacher_violation.below_min_workload++;
				teachers_total_violation[teacher_id].below_min_workload++;
			}

			if (time_points_class_count.size() == 0) {
				continue;
			}

			auto last_time_point = --time_points_class_count.end();
			float middle_time_point = (time_points_class_count.begin()->first + last_time_point->first) / 2;

			float min_time_point_allowance = middle_time_point - (bee->timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());
			float max_time_point_allowance = middle_time_point + (bee->timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());

			int rounded_min_time_point_allowance = static_cast<int>(std::floor(min_time_point_allowance));
			int rounded_max_time_point_allowance = static_cast<int>(std::ceil(max_time_point_allowance));

			bool break_found = false;

			auto it = time_points_class_count.begin();
			auto nextIt = std::next(it);
			while (it != time_points_class_count.end()) {
				TimePoint time_point = it->first;
				int time_point_class_count = it->second;

				if (nextIt != time_points_class_count.end()) {
					TimePoint next_time_point = nextIt->first;
					TimePoint difference = next_time_point - time_point - 1;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_time_point_allowance <= time_point + 1 && time_point + 1 <= rounded_max_time_point_allowance) ||
						    (rounded_min_time_point_allowance <= next_time_point - 1 && next_time_point - 1 <= rounded_max_time_point_allowance)) {
							break_found = true;
						}
					}
				}

				if (time_point_class_count > 1) {
					overall_total_teacher_violation.class_timeslot_overlap += time_point_class_count;

					print("class_count", time_point_class_count);
					teachers_total_violation[teacher_id]
					    .class_timeslot_overlap += time_point_class_count;
				}

				it = nextIt;
				if (nextIt != time_points_class_count.end()) {
					++nextIt;
				}
			}

			if (!break_found && total_day_work_load.at(day) >= bee->timetable.getTeacherBreakThreshold()) {
				overall_total_teacher_violation.no_break++;
				teachers_total_violation[teacher_id].no_break++;
			}
		}
	}

	const auto& section_set = bee->timetable.getSectionsSet();

	for (SectionID section_id : section_set) {
		Section section = bee->timetable.getSectionById(section_id);

		TimePoint early_not_allowed_break_duration_gap = section.getNotAllowedBreakslotGap() * bee->timetable.getDefaultClassDuration();
		TimePoint late_not_allowed_break_duration_gap = (section.getNotAllowedBreakslotGap() + 1) * bee->timetable.getDefaultClassDuration();

		TimePoint max_time = section.getStartTime() + section.getTotalDuration();

		const auto& break_slots = section.getBreakSlots();

		if (section.getNumberOfBreak() == 1) {
			// Check if break_slots is not empty
			if (!break_slots.empty()) {
				Timeslot break_time = *break_slots.begin();

				if (section.getTimeslotEnd(break_time) > max_time - late_not_allowed_break_duration_gap) {
					overall_total_section_violation.late_break++;
					sections_total_violation[section_id].late_break++;
				}

				if (section.getTimeslotEnd(break_time) < early_not_allowed_break_duration_gap) {
					overall_total_section_violation.early_break++;
					sections_total_violation[section_id].early_break++;
				}
			} else {
				print("Break slots is empty");
			}
		} else {
			if (break_slots.size() >= 2) {
				auto it = break_slots.begin();
				Timeslot first_break_time = *it;
				++it;
				Timeslot last_break_time = *it;

				TimePoint first_start = section.getTimeslotStart(first_break_time);
				TimePoint last_end = section.getTimeslotEnd(last_break_time);

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
			} else {
				print("Break slots size is not 2");
			}
		}
	}

	log_file << "- + - + - + - + - TOTAL COST: Conflicts: - + - + - + - + - +" << std::endl;
	log_file << "Teacher: " << std::endl;
	log_file << "class timeslot overlap: " << overall_total_teacher_violation.class_timeslot_overlap << std::endl;
	log_file << "no break: " << overall_total_teacher_violation.no_break << std::endl;
	log_file << "exceed workload: " << overall_total_teacher_violation.exceed_workload << std::endl;
	log_file << "below min workload: " << overall_total_teacher_violation.below_min_workload << std::endl;
	log_file << std::endl;

	log_file << "Section: " << std::endl;
	log_file << "late break: " << overall_total_section_violation.late_break << std::endl;
	log_file << "early break: " << overall_total_section_violation.early_break << std::endl;
	log_file << "small break gap: " << overall_total_section_violation.small_break_gap << std::endl;
	log_file << "- + - + - + - + - + - + - + - + - + - + - + - + - + - + - + - +" << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	// log_file << "............................teachers total class:....................." << std::endl;

	// std::vector<int> days;
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

		if (teacher_violation.below_min_workload > 0) {
			log_file << "." << std::setw(4) << " below min workload: " << teacher_violation.below_min_workload << std::endl;
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