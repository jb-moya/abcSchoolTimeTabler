#ifndef PRINT_H
#define PRINT_H
#include <iomanip>
#include <iostream>

#include "timetable.h"

#define BLACK "\033[30m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN "\033[36m"
#define WHITE "\033[37m"
#define BLACK_B "\033[90m"
#define RED_B "\033[91m"
#define GREEN_B "\033[92m"
#define YELLOW_B "\033[93m"
#define BLUE_B "\033[94m"
#define MAGENTA_B "\033[95m"
#define CYAN_B "\033[96m"
#define WHITE_B "\033[97m"

#define BLACK_BG "\033[40m"
#define RED_BG "\033[41m"
#define GREEN_BG "\033[42m"
#define YELLOW_BG "\033[43m"
#define BLUE_BG "\033[44m"
#define MAGENTA_BG "\033[45m"
#define CYAN_BG "\033[46m"
#define WHITE_BG "\033[47m"
#define BLACK_BG_B "\033[100m"
#define RED_BG_B "\033[101m"
#define GREEN_BG_B "\033[102m"
#define YELLOW_BG_B "\033[103m"
#define BLUE_BG_B "\033[104m"
#define MAGENTA_BG_B "\033[105m"
#define CYAN_BG_B "\033[106m"
#define WHITE_BG_B "\033[107m"

#define BOLD "\033[1m"
#define DIM "\033[2m"
#define UNDERLINE "\033[4m"
#define BLINK "\033[5m"
#define REVERSE "\033[7m"
#define HIDDEN "\033[8m"
#define STRIKETHROUGH "\033[9m"
#define RESET "\033[0m"

template <typename T, typename... Args>
inline void print(T first, Args... args) {
	std::cout << first;
	if constexpr (sizeof...(args) > 0) {
		std::cout << " - ";
		print(args...);
	} else {
		std::cout << RESET << std::endl;
	}
};

inline void print() {}

inline void printSchoolClasses(Timetable& timetable) {
	int total_section = timetable.getTotalSection();

	for (int i = 0; i < total_section; i++) {
		auto section = timetable.getSectionById(i);

		std::cout << BLUE << "--------- - - Section: " << section.getId() << RESET << std::endl;
		int inner_count = 0;

		const auto& classes = section.getClasses();

		for (const auto& [timeslot, classMap]: classes) {
			for (const auto& [day, schoolClass] : classMap) {
				int subject_id = schoolClass.subject_id;
				int teacher_id = schoolClass.teacher_id;

				std::cout << GREEN << "" << std::setw(4) << timeslot << RESET;
				std::cout << YELLOW << DIM << "  d: " << RESET << YELLOW << std::setw(2) << ((day == ScheduledDay::EVERYDAY) ? (CYAN + std::to_string(static_cast<int>(day))) : (std::string(YELLOW) + BOLD + std::to_string(static_cast<int>(day)))) << RESET;

				std::cout << MAGENTA << DIM << " t: " << RESET << MAGENTA
				          << std::setw(3)
				          << ((teacher_id == -1) ? (std::string(" ") + DIM + "/\\") : std::to_string(teacher_id))
				          << RESET;

				std::cout << RED << DIM << " s: " << RESET << RED
				          << std::setw(3)
				          << ((subject_id == -1) ? (std::string(" ") + DIM + "/\\") : std::to_string(subject_id))
				          << RESET;

				// std::cout << DIM << " r: " << RESET << std::setw(4) << section.time_range.at(timeslot).start << " ";
				std::cout << DIM << " r: " << RESET << std::setw(4) << section.getTimeslotStart(timeslot) << " ";
				// std::cout << std::setw(4) << section.time_range.at(timeslot).end << " " << RESET;
				std::cout << std::setw(4) << section.getTimeslotEnd(timeslot) << " " << RESET;
				std::cout << BLUE_B << std::setw(4) << ++inner_count << RESET;

				std::cout << std::endl;
			}
		}
		std::cout << RESET << std::endl;
	}

	std::cout << std::endl;
}

inline void printConfiguration(int max_iterations,
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
	print("teacher_break_threshold", teacher_break_threshold);
	print("min_total_class_duration_for_two_breaks", min_total_class_duration_for_two_breaks);
	print("default_class_duration", default_class_duration);
	print("result_buff_length", result_buff_length);
	print("offset_duration", offset_duration);
	print("enable_logging", enable_logging);
	print("time_issued", time_issued);
}

#endif  // PRINT_H
