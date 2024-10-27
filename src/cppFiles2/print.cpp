// print.cpp
#include "print.h"

void print() {
	// No parameters left to print, base case for variadic template recursion
}

void printSchoolClasses(Timetable& timetable) {
	for (const auto& [section_id, section] : timetable.sections) {
		std::cout << BLUE << "--------- - - Section: " << section.id << RESET << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : section.classes) {
			for (const auto& [day, schoolClass] : classMap) {
				int subject_id = schoolClass.subject_id;
				int teacher_id = schoolClass.teacher_id;

				std::cout << GREEN << "" << std::setw(4) << timeslot << RESET;
				std::cout << YELLOW << DIM << "  d: " << RESET << YELLOW << std::setw(2) << ((day == 0) ? (CYAN + std::to_string(day)) : (std::string(YELLOW) + BOLD + std::to_string(day))) << RESET;

				// For teacher_id
				std::cout << MAGENTA << DIM << " t: " << RESET << MAGENTA
				          << std::setw(3)  // Set width for the output
				          << ((teacher_id == -1) ? (std::string(" ") + DIM + "/\\") : std::to_string(teacher_id))
				          << RESET;

				std::cout << RED << DIM << " s: " << RESET << RED
				          << std::setw(3)  // Set width for the output
				          << ((subject_id == -1) ? (std::string(" ") + DIM + "/\\") : std::to_string(subject_id))
				          << RESET;

				std::cout << DIM << " r: " << RESET << std::setw(4) << section.time_range.at(timeslot).start << " ";
				std::cout << std::setw(4) << section.time_range.at(timeslot).end << " " << RESET;
				std::cout << BLUE_B << std::setw(4) << ++inner_count << RESET;

				std::cout << std::endl;
			}
		}
		std::cout << RESET << std::endl;
	}
	std::cout << std::endl;
}

void printConfiguration(int max_iterations,
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
                        bool enable_logging,
                        std::string time_issued) {
	print("Configuration: ");
	print("max_iterations", max_iterations);
	print("num_teachers", num_teachers);
	print("total_section_subjects", total_section_subjects);
	print("total_section", total_section);
	print("teacher_subjects_length", teacher_subjects_length);
	print("bees_population", bees_population);
	print("bees_employed", bees_employed);
	print("bees_onlooker", bees_onlooker);
	print("bees_scout", bees_scout);
	print("limit", limit);
	print("work_week", work_week);
	print("max_teacher_work_load", max_teacher_work_load);
	print("break_time_duration", break_time_duration);
	print("break_timeslot_allowance", break_timeslot_allowance);
	print("teacher_break_threshold", teacher_break_threshold);
	print("min_total_class_duration_for_two_breaks", min_total_class_duration_for_two_breaks);
	print("default_class_duration", default_class_duration);
	print("result_buff_length", result_buff_length);
	print("offset_duration", offset_duration);
	print("enable_logging", enable_logging);
	print("time_issued", time_issued);
}