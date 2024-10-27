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