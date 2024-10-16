#include "abc2.h"

#include <math.h>
// #include <omp.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>  // For system()
#include <deque>    // Include deque
#include <fstream>  // Required for file handling
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <optional>
#include <random>
#include <set>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

using namespace std;

std::random_device rd;
std::mt19937 randomizer_engine(rd());

// #define LOG_FOLDER = "logs/";
#define LOG_FOLDER "logs2/"

void print() {
	// No parameters left to print
}

template <typename T, typename... Args>
void print(T first, Args... args) {
	std::cout << first;
	if constexpr (sizeof...(args) > 0) {
		std::cout << " - ";
		print(args...);
	} else {
		std::cout << RESET << std::endl;
	}
}

void printSchoolClasses(Timetable& timetable) {
	for (const auto& [grade, gradeMap] : timetable.school_classes) {
		std::cout << BLUE << "--------- - - Section: " << grade << RESET << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : gradeMap) {
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

				std::cout << DIM << " r: " << RESET << std::setw(4) << timetable.school_class_time_range[grade][timeslot].start << " ";
				std::cout << std::setw(4) << timetable.school_class_time_range[grade][timeslot].end << " " << RESET;
				std::cout << BLUE_B << std::setw(4) << ++inner_count << RESET;

				std::cout << std::endl;
			}
		}
		std::cout << RESET << std::endl;
	}
	std::cout << std::endl;
}

void printSchoolClasses(Timetable& timetable, std::ofstream& file) {
	if (!file.is_open()) {
		print(RED_B, "Error opening file", RESET);
		return;
	}

	//   teacher                     days          time section
	std::map<int, std::unordered_map<int, std::map<int, int>>> teacher_class;

	std::unordered_map<int, int> section_breaks_distribution;

	for (const auto& [grade, gradeMap] : timetable.school_classes) {
		file << "--------- - - Section: " << grade << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : gradeMap) {
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
					for (int i = timetable.school_class_time_range[grade][timeslot].start; i < timetable.school_class_time_range[grade][timeslot].end; i++) {
						teacher_class[teacher_id][day][i] = grade;
					}

				} else {
					section_breaks_distribution[timeslot]++;
				}

				file << " r: " << std::setw(4) << timetable.school_class_time_range[grade][timeslot].start << " ";
				file << std::setw(4) << timetable.school_class_time_range[grade][timeslot].end << " ";
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

void printCosts(std::map<int, int>& nums, std::ofstream& file) {
	file << std::endl
	     << "Costs:" << std::endl;

	for (const auto& num : nums) {
		file << num.first << " : " << num.second << std::endl;
	}
}

std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> Timetable::s_section_subjects_units;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_duration;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_order;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_eligible_teachers_in_subject;
std::unordered_set<int16_t> Timetable::s_section_dynamic_subject_consistent_duration;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_section_subjects;
std::unordered_map<int16_t, int> Timetable::s_section_total_duration;
std::unordered_map<int16_t, int> Timetable::s_section_fixed_subject;
std::unordered_map<int16_t, int> Timetable::s_section_timeslot;
std::unordered_map<int16_t, int> Timetable::s_section_start;
std::unordered_set<int16_t> Timetable::s_teachers_set;
std::unordered_set<int16_t> Timetable::s_sections_set;
std::vector<int> Timetable::s_section_num_breaks;
int Timetable::s_break_timeslot_allowance;
int Timetable::s_teacher_break_threshold;
int Timetable::s_default_class_duration;
int Timetable::s_max_teacher_work_load;
int Timetable::s_break_time_duration;
int Timetable::s_work_week;

std::uniform_int_distribution<int16_t> Timetable::s_random_section;
std::uniform_int_distribution<int8_t> Timetable::s_random_workDay;
std::uniform_int_distribution<int16_t> Timetable::s_random_field;

void Timetable::reset() {
	s_eligible_teachers_in_subject.clear();
	s_section_subjects_duration.clear();
	s_section_subjects_units.clear();
	s_section_num_breaks.clear();
	s_section_subjects.clear();
	s_section_timeslot.clear();
	s_section_start.clear();
	s_teachers_set.clear();
	s_sections_set.clear();

	s_break_time_duration = 0;
	s_work_week = 0;

	initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

void Timetable::initializeTeachersClass(int teachers) {
	for (int day = 1; day <= s_work_week; ++day) {
		teachers_class_count[day].resize(teachers);
		for (int i = 0; i < teachers; ++i) {
			teachers_class_count[day][i] = 0;
		}
	}
}

void Timetable::initializeTeacherSet(int teachers) {
	s_teachers_set.clear();

	for (int i = 0; i < teachers; ++i) {
		s_teachers_set.insert(i);
	}
}

void Timetable::initializeSectionsSet(int sections) {
	s_sections_set.clear();

	for (int i = 0; i < sections; ++i) {
		s_sections_set.insert(i);
	}
}
void Timetable::initializeRandomSectionDistribution(int min, int max) {
	s_random_section = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomFieldDistribution(int min, int max) {
	s_random_field = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	s_random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}

// std::set<int> getRandomBreakSlot(int timeslot_count, int break_count, int gap) {
// 	std::set<int> breaks;

// 	for (int i = 0; i < break_count; ++i) {
// 		std::uniform_int_distribution<int> dis(gap + 1, timeslot_count - gap);

// 		int break_slot = dis(randomizer_engine);
// 		bool small_gap = false;

// 		do {
// 			break_slot = dis(randomizer_engine);

// 			for (auto it = breaks.begin(); it != breaks.end(); ++it) {
// 				if (std::abs(*it - break_slot) < gap) {
// 					small_gap = true;
// 					break;
// 				}
// 			}

// 		} while (breaks.find(break_slot) != breaks.end() || small_gap);
// 	}
// }

void Timetable::updateTeachersAndSections(
    std::unordered_set<int16_t>& update_teachers,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    int16_t random_section,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);

	auto beginning = school_classes[random_section].begin();

	int start = Timetable::s_section_start[random_section];

	for (auto it = itLow; it != itUp; ++it) {
		if (it->first == itLow->first + 1 && is_skipping_between) {
			it = itUpPrev;
		}

		auto& day_schedule = school_classes[random_section][it->first];
		auto day_zero = day_schedule.find(0);

		if (it != beginning) {
			start = school_class_time_range[random_section][std::prev(it)->first].end;
		}

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;
			int duration = (subject == -1) ? Timetable::s_break_time_duration : Timetable::s_section_subjects_duration[random_section][subject];

			int teacher = day_zero->second.teacher_id;

			if (!is_reset) {
				school_class_time_range[random_section][it->first].start = start;
				school_class_time_range[random_section][it->first].end = start + duration;
			}

			if (subject != -1) {
				auto& teacher_timeslot = teachers_timeslots[teacher];

				if (is_returning_teachers) {
					update_teachers.insert(teacher);
				}

				for (int i = 1; i <= Timetable::s_work_week; ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							// print(is_reset, "is reset", teacher, i, j + start);
							if (--teacher_timeslot[i][j + start] <= 0) {
								teacher_timeslot[i].erase(j + start);

								if (teacher_timeslot[i].empty()) {
									teacher_timeslot.erase(i);
								}
							};
						} else {
							// print(is_reset, "is reset", teacher, i, j + start);
							teacher_timeslot[i][j + start]++;
						}
					}
				}
			};
		} else {
			int max_duration = 0;

			for (const auto& day : it->second) {
				int subject = day.second.subject_id;
				int duration = Timetable::s_section_subjects_duration[random_section][subject];
				max_duration = std::max(max_duration, duration);
				int teacher = day.second.teacher_id;

				auto& teacher_timeslot = teachers_timeslots[teacher];

				if (is_returning_teachers) {
					update_teachers.insert(teacher);
				}

				for (int j = 0; j < duration; ++j) {
					if (is_reset) {
						// print("is reset", teacher);
						if (--teacher_timeslot[day.first][start + j] <= 0) {
							// can i use: std::optional<T>::swap on this

							teacher_timeslot[day.first].erase(start + j);

							if (teacher_timeslot[day.first].empty()) {
								teacher_timeslot.erase(day.first);
							}
						}
					} else {
						// print("is reset", teacher, day.first, j + start);
						teacher_timeslot[day.first][start + j]++;
					}
				}
			}

			if (!is_reset) {
				school_class_time_range[random_section][it->first].start = start;
				school_class_time_range[random_section][it->first].end = start + max_duration;
			}
		}
	}
}

std::vector<std::vector<int>> getAllBreaksCombination(int slot_count, int break_count, int gap) {
	std::set<int> breaks;
	std::set<int> possible_breaks;

	for (int i = gap; i < slot_count - gap; ++i) {
		// std::cout << "zz" << i << std::endl;
		possible_breaks.insert(i);
	}

	// print("break count", break_count);

	if (break_count == 1) {
		std::vector<std::vector<int>> combinations;

		for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
			combinations.push_back({*it});
		}

		return combinations;
	}

	std::vector<std::vector<int>> combinations;

	for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
		// std::cout << "allowed_break " << *it << std::endl;
		int first = *it;

		for (auto it2 = it; it2 != possible_breaks.end(); ++it2) {
			if (std::abs(first + 1 - *it2) >= gap) {
				// std::cout << "combination : " << first << " " << *it2 << std::endl;
				combinations.push_back({first, *it2});
			}
		}
	}

	return combinations;
}

void Timetable::initializeRandomTimetable(std::unordered_set<int16_t>& update_teachers) {
	// print("initializaing");
	// print("1");
	for (const auto& entry : s_section_subjects) {
		// print("2");

		int16_t section_id = entry.first;
		std::vector<int16_t> random_subjects = entry.second;

		std::map<int, int> timeslots;

		// std::vector<int> timeslot_keys;
		std::deque<int> timeslot_keys;
		for (int i = 0; i < Timetable::s_section_timeslot[section_id]; ++i) {
			// print("i i i", i);
			timeslots[i] = Timetable::s_work_week;
			timeslot_keys.push_back(i);
		}
		// print("3");

		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		std::map<int, int> fixed_subject_order;
		std::set<int> non_dynamic_order_start;
		std::set<int> non_dynamic_order_end;
		std::set<int> reserved_timeslots;

		std::shuffle(random_subjects.begin(), random_subjects.end(), randomizer_engine);

		const auto& units_map = Timetable::s_section_subjects_units[section_id];

		for (const auto& subject_id : random_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			if (units_map.at(subject_id).second == 0) {
				if (order != 0) {
					full_week_day_subjects.insert(full_week_day_subjects.begin(), subject_id);

					if (order < 0) {
						non_dynamic_order_start.insert(order);
					} else {
						non_dynamic_order_end.insert(order);
					}

				} else {
					full_week_day_subjects.push_back(subject_id);


				}



			} else {
				if (order != 0) {
					special_unit_subjects.insert(special_unit_subjects.begin(), subject_id);

					if (order < 0) {
						non_dynamic_order_start.insert(order);
					} else {
						non_dynamic_order_end.insert(order);
					}
				} else {
					special_unit_subjects.push_back(subject_id);
				}
			}
		}

		// for (int i = 0; i < num_breaks; ++i) {
		// 	// TODO: have some way of optimizing this
		// 	// int break_slot = (Timetable::s_section_timeslot[section_id] / (num_breaks + 1)) * (i + 1);
		// 	std::uniform_int_distribution<> dist(1, timeslot_keys.size() - 2);  // ignore first and last
		// 	int random_index = dist(randomizer_engine);
		// 	int timeslot_key = timeslot_keys[random_index];
		// 	timeslot_keys.erase(timeslot_keys.begin() + random_index);
		// 	school_classes[section_id][timeslot_key][0] = SchoolClass{-1, -1};
		// 	section_break_slots[section_id].insert(timeslot_key);
		// 	timeslots.erase(timeslot_key);
		// }

		int num_breaks = Timetable::s_section_num_breaks[section_id];
		int not_allowed_break_gap = Timetable::s_section_timeslot[section_id] > 10 ? 3 : 2;

		std::vector<std::vector<int>>
		    breaks_combination = getAllBreaksCombination(Timetable::s_section_timeslot[section_id], num_breaks, not_allowed_break_gap);  // will not work on special program
		std::uniform_int_distribution<> dis_break_combination(0, breaks_combination.size() - 1);

		int random_index = dis_break_combination(randomizer_engine);

		for (size_t i = 0; i < breaks_combination[random_index].size(); ++i) {
			int break_slot = breaks_combination[random_index][i];
			// print("break slot : ", break_slot);
			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
			school_classes[section_id][break_slot][0] = SchoolClass{-1, -1};
			section_break_slots[section_id].insert(break_slot);
			timeslots.erase(break_slot);
		}

		auto timeslot_it = timeslot_keys.begin();
		for (auto itr : non_dynamic_order_start) {
			fixed_subject_order[itr] = *timeslot_it;
			reserved_timeslots.insert(*timeslot_it);
			print("F 1 ", itr, *timeslot_it);
			++timeslot_it;
		}

		auto timeslot_it_reverse = timeslot_keys.rbegin();
		for (auto it = non_dynamic_order_end.rbegin(); it != non_dynamic_order_end.rend(); ++it) {
			fixed_subject_order[*it] = *timeslot_it_reverse;
			reserved_timeslots.insert(*timeslot_it_reverse);
			print("F 2 ", *timeslot_it_reverse);
			++timeslot_it_reverse;
		}

		// std::unordered_set<int> used_break_slots;  // To keep track of already assigned break slots
		// for (int i = 0; i < num_breaks; ++i) {
		// 	int break_slot;
		// 	std::uniform_int_distribution<> dis(1, Timetable::s_section_timeslot[section_id] - 1);  // ignore first and last
		// 	// Generate a unique break_slot
		// 	do {
		// 		break_slot = dis(randomizer_engine);
		// 	} while (used_break_slots.find(break_slot) != used_break_slots.end());  // Repeat if break_slot is already used
		// 	// Now we have a unique break_slot
		// 	used_break_slots.insert(break_slot);  // Mark this break_slot as used
		// 	// Remove the selected timeslot key
		// 	timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
		// 	// Assign the break slot to the timetable
		// 	school_classes[section_id][break_slot][0] = SchoolClass{-1, -1};  // Mark as break
		// 	section_break_slots[section_id].insert(break_slot);               // Store this break slot
		// 	timeslots.erase(break_slot);                                      // Remove from available timeslots
		// }
		// print("5");

		std::shuffle(timeslot_keys.begin(), timeslot_keys.end(), randomizer_engine);

		// print("fasjkdljf", timeslot_keys.size(), "Fcv", full_week_day_subjects.size(), "Fcv", special_unit_subjects.size(), "Fcv");
		for (const auto& subject_id : full_week_day_subjects) {
			// std::uniform_int_distribution<> dis(0, Timetable::s_eligible_teachers_in_subject[subject_id].size() - 1);
			// int16_t selected_teacher = Timetable::s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			std::vector<int16_t>& eligible_teachers = Timetable::s_eligible_teachers_in_subject[subject_id];

			// print("5.a");

			// // Find the teacher who has been assigned the fewest sections
			int min_assignments = 999;  // maximum possible number of sections
			std::vector<int16_t> least_assigned_teachers;

			// // Identify teachers with the minimum number of assignments
			for (int16_t teacher : eligible_teachers) {
				int assignment_count = 0;

				for (int day = 1; day <= s_work_week; ++day) {
					if (assignment_count < teachers_class_count[day][teacher]) {
						assignment_count = teachers_class_count[day][teacher];
					}
				}

				if (assignment_count < min_assignments) {
					min_assignments = assignment_count;
					least_assigned_teachers.clear();
					least_assigned_teachers.push_back(teacher);
				} else if (assignment_count == min_assignments) {
					least_assigned_teachers.push_back(teacher);
				}
			}

			// print("5.b", subject_id, least_assigned_teachers.size());

			// // Randomly select a teacher from the least assigned list
			std::uniform_int_distribution<> dis(0, least_assigned_teachers.size() - 1);
			int16_t selected_teacher = least_assigned_teachers[dis(randomizer_engine)];

			// print("selected: ", selected_teacher, " subject: ", subject_id, least_assigned_teachers.size());

			for (int day = 1; day <= s_work_week; ++day) {
				teachers_class_count[day][selected_teacher]++;
			}
			// print("5.c");

			if (order == 0) {
				// int timeslot_key = timeslot_keys.back();

				// print("xxx timeslot key: ", timeslot_key);

				// timeslot_keys.pop_back();

				std::uniform_int_distribution<> dist(0, timeslot_keys.size() - 1);
				int timeslot_key = timeslot_keys[dist(randomizer_engine)];

				// TODO: a way to optimize this?
				do {
					timeslot_key = timeslot_keys[dist(randomizer_engine)];
				} while (reserved_timeslots.find(timeslot_key) != reserved_timeslots.end());

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				school_classes[section_id][timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				timeslots.erase(timeslot_key);
			} else {
				int timeslot_key = fixed_subject_order[order];

				print("aaaaaaa timeslot key: ", timeslot_key);

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
				school_classes[section_id][timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				section_fixed_timeslot_day[section_id][timeslot_key].insert(0);

				timeslots.erase(timeslot_key);
			}
		}

		// print("6");

		for (auto& timeslot : timeslots) {
			print("zz  timeslot: ", timeslot.first, " value: ", timeslot.second);
		}

		int day = 1;
		// print(" -ffffffff- - - ff--  -- -");
		for (const auto& subject_id : special_unit_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			// print(BLUE, "W H A T", RESET);
			// std::uniform_int_distribution<> dis(0, Timetable::s_eligible_teachers_in_subject[subject_id].size() - 1);
			// int16_t random_teacher = Timetable::s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];

			std::vector<int16_t>& eligible_teachers = Timetable::s_eligible_teachers_in_subject[subject_id];

			// // Find the teacher who has been assigned the fewest sections
			int min_assignments = 999;  // maximum possible number of sections
			std::vector<int16_t> least_assigned_teachers;

			// // Identify teachers with the minimum number of assignments
			for (int16_t teacher : eligible_teachers) {
				int assignment_count = teachers_class_count[day][teacher];

				if (assignment_count < min_assignments) {
					min_assignments = assignment_count;
					least_assigned_teachers.clear();
					least_assigned_teachers.push_back(teacher);
				} else if (assignment_count == min_assignments) {
					least_assigned_teachers.push_back(teacher);
				}
			}

			// // Randomly select a teacher from the least assigned list
			std::uniform_int_distribution<> dis(0, least_assigned_teachers.size() - 1);
			int16_t selected_teacher = least_assigned_teachers[dis(randomizer_engine)];

			int16_t num_unit = units_map.at(subject_id).second;

			teachers_class_count[day][selected_teacher]++;

			for (int iter = 1; iter <= num_unit; ++iter) {
				if (order == 0) {
					auto it = std::find_if(timeslot_keys.rbegin(), timeslot_keys.rend(),
					                       [&timeslots](int key) { return timeslots[key] > 0; });

					if (it == timeslot_keys.rend()) {
						// print("no more timeslots");
						break;
					}

					int timeslot = *it;

					// print("timeslot: ", timeslot);

					school_classes[section_id][timeslot][day] = SchoolClass{subject_id, selected_teacher};
					section_segmented_timeslot[section_id].insert(timeslot);

					if (--timeslots[timeslot] == 0) {
						auto regularIt = it.base();
						timeslot_keys.erase(--regularIt);
						timeslots.erase(timeslot);
					}
				} else {
					int timeslot_key = fixed_subject_order[order];

					// print("timeslot: ", timeslot_key);

					school_classes[section_id][timeslot_key][day] = SchoolClass{subject_id, selected_teacher};
					section_segmented_timeslot[section_id].insert(timeslot_key);

					section_fixed_timeslot_day[section_id][timeslot_key].insert(day);

					if (--timeslots[timeslot_key] == 0) {
						timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
						timeslots.erase(timeslot_key);
					}
				}

				if (++day > s_work_week) day = 1;
			}
		}

		int class_start = Timetable::s_section_start[section_id];

		for (const auto& pair : school_classes[section_id]) {
			// std::cout << "Key: " << pair.first << ", Value: " << pair.second.count(0) << std::endl;

			if (pair.second.count(0)) {
				const SchoolClass& schoolClass = pair.second.at(0);
				int16_t subject_id = schoolClass.subject_id;

				int duration = (subject_id == -1) ? Timetable::s_break_time_duration : Timetable::s_section_subjects_duration[section_id][subject_id];

				school_class_time_range[section_id][pair.first] = ClassStartEnd{class_start, class_start + duration};
				class_start += duration;

				// print("XXX", class_start);
			} else {
				// print("HJHHHHHHHHHHHHH");
				int max_duration = 0;

				for (int i = 1; i <= s_work_week; ++i) {
					if (pair.second.count(i)) {
						int subject_id = pair.second.at(i).subject_id;

						if (Timetable::s_section_subjects_duration[section_id][subject_id] > max_duration) {
							max_duration = Timetable::s_section_subjects_duration[section_id][subject_id];
						}
					}
				}

				// print("hHh 2", class_start, max_duration);

				// print(RED, "napupunta", class_start);
				school_class_time_range[section_id][pair.first] = ClassStartEnd{class_start, class_start + max_duration};

				class_start += max_duration;
			}
		}

		Timetable::s_section_total_duration[section_id] = class_start - Timetable::s_section_start[section_id];

		updateTeachersAndSections(update_teachers, school_classes[section_id].begin(), school_classes[section_id].end(), true, false, section_id, false);
	}
}

int Timetable::getRandomInRange(int n) {
	std::uniform_int_distribution<int> distribution(0, n);
	return distribution(randomizer_engine);
}

std::pair<int, int> Timetable::pickRandomTimeslots(int selected_section, int field) {
	int selected_timeslot_1;
	int selected_timeslot_2;

	if (field == 0) {
		bool is_timeslot_1_at_start_or_end_of_schedule = false;
		bool is_timeslot_2_at_start_or_end_of_schedule = false;

		bool is_timeslot_1_break = false;
		bool is_timeslot_2_break = false;

		bool is_fixed_subject = false;

		bool ignore_break_slots = false;

		bool is_consistent_duration = Timetable::s_section_dynamic_subject_consistent_duration.find(selected_section) != Timetable::s_section_dynamic_subject_consistent_duration.end();

		do {
			selected_timeslot_1 = getRandomInRange(s_section_timeslot[selected_section] - 1);
			selected_timeslot_2 = getRandomInRange(s_section_timeslot[selected_section] - 1);

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == s_section_timeslot[selected_section] - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == s_section_timeslot[selected_section] - 1;

			is_timeslot_1_break = section_break_slots[selected_section].find(selected_timeslot_1) != section_break_slots[selected_section].end();
			is_timeslot_2_break = section_break_slots[selected_section].find(selected_timeslot_2) != section_break_slots[selected_section].end();

			if (is_consistent_duration && (is_timeslot_1_break || is_timeslot_2_break)) {
				ignore_break_slots = true;
			} else {
				ignore_break_slots = false;
			}

			// TODO: instead of blindly selecting a random timeslot that is not fixed, the selection must already be viable
			is_fixed_subject = section_fixed_timeslot_day[selected_section].find(selected_timeslot_1) != section_fixed_timeslot_day[selected_section].end();
			is_fixed_subject |= section_fixed_timeslot_day[selected_section].find(selected_timeslot_2) != section_fixed_timeslot_day[selected_section].end();

			// print("is_fixed_subject", is_fixed_subject, selected_timeslot_1, selected_timeslot_2);

		} while (selected_timeslot_1 == selected_timeslot_2 ||
		         (is_timeslot_1_at_start_or_end_of_schedule && is_timeslot_2_break) ||
		         (is_timeslot_2_at_start_or_end_of_schedule && is_timeslot_1_break) ||
		         is_fixed_subject || ignore_break_slots);

	} else if (field == 1) {
		selected_timeslot_1 = getRandomInRange(s_section_timeslot[selected_section] - 1);
		selected_timeslot_2 = selected_timeslot_1;
	} else if (field == 2) {
		std::vector<int16_t> timeslots;
		for (const auto& entry : section_segmented_timeslot[selected_section]) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);
		selected_timeslot_1 = timeslots[dis2(randomizer_engine)];
		selected_timeslot_2 = timeslots[dis2(randomizer_engine)];

		// print("selected_timeslot_1", selected_timeslot_1, "selected_timeslot_2", selected_timeslot_2);
	}

	return {selected_timeslot_1, selected_timeslot_2};
}

int16_t Timetable::pickRandomSection() {
	// return Timetable::s_random_section(randomizer_engine);

	if (sections_with_conflicts.empty()) {
		// exit(0);
		// throw std::runtime_error("The unordered_set is empty.");
		// print("empty", sections_with_conflicts.size());
		return Timetable::s_random_section(randomizer_engine);
	} else {
		// system("clear");
		// return Timetable::s_random_section(randomizer_engine);
		std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

		int random_index = dis(randomizer_engine);

		auto it = sections_with_conflicts.begin();
		std::advance(it, random_index);

		// print("section picked;", *it, sections_with_conflicts.size());

		return *it;
	}
}

int16_t Timetable::pickRandomField(int16_t selected_section) {
	auto it = section_segmented_timeslot.find(selected_section);

	if (it != section_segmented_timeslot.end()) {
		return Timetable::s_random_field(randomizer_engine);
	} else {
		std::uniform_int_distribution<> dis(0, 1);

		return dis(randomizer_engine);
	}
}

void Timetable::modify(std::unordered_set<int16_t>& update_teachers, std::unordered_set<int16_t>& update_sections) {
	// if (sections_with_conflicts.size() >= 1) {
	// 	print(RED, "j");
	// 	print(RED, "conflicts count", sections_with_conflicts.size());
	// }

	int16_t selected_section = Timetable::pickRandomSection();
	int16_t choice = Timetable::pickRandomField(selected_section);
	// print(RED, "choice ", choice);

	if (choice == 0) {
		update_sections.insert(selected_section);
	}

	auto selected_timeslots = pickRandomTimeslots(selected_section, choice);

	int selected_timeslot_1 = selected_timeslots.first;
	int selected_timeslot_2 = selected_timeslots.second;

	auto itLow = school_classes[selected_section].lower_bound(std::min(selected_timeslot_1, selected_timeslot_2));
	auto itUp = school_classes[selected_section].upper_bound(std::max(selected_timeslot_1, selected_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	int duration_1 = school_class_time_range[selected_section][selected_timeslot_1].end - school_class_time_range[selected_section][selected_timeslot_1].start;
	int duration_2 = school_class_time_range[selected_section][selected_timeslot_2].end - school_class_time_range[selected_section][selected_timeslot_2].start;

	bool is_skipping_between = duration_1 == duration_2;

	updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);

	auto& section = school_classes[selected_section];

	if (choice == 0) {
		// swapping of classes between timeslots in the same section

		// std::cout << "swapping " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		// print("bool", is_itLow_break, "bool", is_itUpPrev_break, "xx", random_timeslot_1, random_timeslot_2);

		auto& break_slots = section_break_slots[selected_section];

		if (break_slots.find(itLow->first) != break_slots.end() && break_slots.find(itUpPrev->first) == break_slots.end()) {
			break_slots.erase(itLow->first);
			break_slots.insert(itUpPrev->first);
		} else if (break_slots.find(itUpPrev->first) != break_slots.end() && break_slots.find(itLow->first) == break_slots.end()) {
			break_slots.erase(itUpPrev->first);
			break_slots.insert(itLow->first);
		}

		std::swap(section[selected_timeslot_1], section[selected_timeslot_2]);

		// Check if the random_section exists
		auto it = section_segmented_timeslot.find(selected_section);

		if (it != section_segmented_timeslot.end()) {
			// random_section exists, proceed with the logic
			auto& timeslot_set = it->second;

			if (timeslot_set.count(selected_timeslot_1) > 0 && timeslot_set.count(selected_timeslot_2) == 0) {
				timeslot_set.erase(selected_timeslot_1);
				timeslot_set.insert(selected_timeslot_2);
			} else if (timeslot_set.count(selected_timeslot_2) > 0 && timeslot_set.count(selected_timeslot_1) == 0) {
				timeslot_set.erase(selected_timeslot_2);
				timeslot_set.insert(selected_timeslot_1);
			}
		}

	} else if (choice == 1) {
		// 	// changing teachers
		auto& section_timeslot = section[selected_timeslot_1];

		if (section_timeslot.count(0) > 0) {
			int16_t subject_id = section_timeslot[0].subject_id;
			int16_t old_teacher = section_timeslot[0].teacher_id;
			std::uniform_int_distribution<> dis(0, s_eligible_teachers_in_subject[subject_id].size() - 1);

			if (subject_id != -1) {
				int16_t random_teacher;

				do {
					random_teacher = s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
				} while (random_teacher == old_teacher && s_eligible_teachers_in_subject[subject_id].size() > 1);

				for (int day = 1; day <= s_work_week; day++) {
					teachers_class_count[day][old_teacher]--;
					teachers_class_count[day][random_teacher]++;
				}

				update_teachers.insert(old_teacher);
				update_teachers.insert(random_teacher);

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- zero day :" << "Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
				section_timeslot[0] = SchoolClass{subject_id, random_teacher};
			};
		} else {
			std::uniform_int_distribution<> dis_work_day(0, section_timeslot.size() - 1);

			int randomIndex = dis_work_day(randomizer_engine);

			auto it = section_timeslot.begin();
			std::advance(it, randomIndex);

			int16_t subject_id = section_timeslot[it->first].subject_id;
			int16_t old_teacher = section_timeslot[it->first].teacher_id;

			std::uniform_int_distribution<> dis(0, s_eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher;

			do {
				random_teacher = s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
			} while (random_teacher == old_teacher && s_eligible_teachers_in_subject[subject_id].size() > 1);

			for (int day = 1; day <= s_work_week; day++) {
				teachers_class_count[day][old_teacher]--;
				teachers_class_count[day][random_teacher]++;
			}

			// std::cout << subject_id << " old teacher : " << old_teacher << " <- workday : " << _staticcast<int>(workday) << " Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
			section_timeslot[it->first] = SchoolClass{subject_id, random_teacher};
		}
	} else if (choice == 2) {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		int day_1, day_2;

		auto& section_timeslot_1 = section[selected_timeslot_1];
		auto& section_timeslot_2 = section[selected_timeslot_2];

		do {
			day_1 = Timetable::s_random_workDay(randomizer_engine);
			day_2 = Timetable::s_random_workDay(randomizer_engine);

			// FIXME: this will cause infinite loop with fixed timeslot day:
			// is_fixed_timeslot_day = section_fixed_timeslot_day[selected_section][selected_timeslot_1].find(day_1) != section_fixed_timeslot_day[selected_section][selected_timeslot_1].end();
			// is_fixed_timeslot_day |= section_fixed_timeslot_day[selected_section][selected_timeslot_2].find(day_2) != section_fixed_timeslot_day[selected_section][selected_timeslot_2].end();

			// might important:
			// } while ((day_1 == day_2 && selected_timeslot_1 == selected_timeslot_2) ||
			//          (section_timeslot_1.find(day_1) == section_timeslot_1.end() &&
			//           section_timeslot_2.find(day_2) == section_timeslot_2.end()));
		} while ((day_1 == day_2 && selected_timeslot_1 == selected_timeslot_2));

		auto it1 = section_timeslot_1.find(day_1);
		auto it2 = section_timeslot_2.find(day_2);

		if (it1 != section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			int16_t teacher_id_1 = it1->second.teacher_id;
			int16_t teacher_id_2 = it2->second.teacher_id;

			teachers_class_count[day_1][teacher_id_1]--;
			teachers_class_count[day_2][teacher_id_1]++;

			teachers_class_count[day_1][teacher_id_2]++;
			teachers_class_count[day_2][teacher_id_2]--;

			std::swap(it1->second, it2->second);
		} else if (it1 != section_timeslot_1.end() && it2 == section_timeslot_2.end()) {
			int16_t teacher_id = it1->second.teacher_id;

			teachers_class_count[day_1][teacher_id]--;
			teachers_class_count[day_2][teacher_id]++;

			section_timeslot_2[day_2] = std::move(it1->second);
			section_timeslot_1.erase(it1);
		} else if (it1 == section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			int16_t teacher_id = it2->second.teacher_id;

			teachers_class_count[day_1][teacher_id]++;
			teachers_class_count[day_2][teacher_id]--;

			section_timeslot_1[day_1] = std::move(it2->second);
			section_timeslot_2.erase(it2);
		}
	}

	updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
};

void ObjectiveFunction::evaluate(
    Bee& bee,
    std::unordered_set<int16_t>& update_teachers,
    std::unordered_set<int16_t>& update_sections,
    bool show_penalty,
    bool is_initial) {
	int counter = 0;

	auto& teachers_timetable = bee.timetable.teachers_timeslots;

	if (is_initial) {
		bee.total_cost = 0;
	}

	// for (const int& teacher_id : update_teachers) {
	for (const int16_t& teacher_id_16 : update_teachers) {
		int teacher_id = static_cast<int>(teacher_id_16);
		// Now you can use teacher_id as an int

		auto it = teachers_timetable.find(teacher_id);

		if (!is_initial) {
			bee.total_cost -= bee.teacher_violations[teacher_id].class_timeslot_overlap;
			bee.total_cost -= bee.teacher_violations[teacher_id].no_break;
			bee.total_cost -= bee.teacher_violations[teacher_id].exceed_workload;
			bee.total_cost -= bee.teacher_violations[teacher_id].class_gap;
		}

		bee.resetTeacherViolation(teacher_id);

		if (it == teachers_timetable.end()) {
			continue;
		}

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id);

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (bee.timetable.teachers_class_count[day][teacher_id] > max_teacher_work_load) {
				bee.teacher_violations[teacher_id].exceed_workload += 2;
			}

			if (show_penalty) {
				print(YELLOW, "ff day", day, "size timeslot", timeslot.size(), RESET);
			}

			if (timeslot.size() == 0) {
				continue;
			}

			auto it = timeslot.begin();
			auto nextIt = std::next(it);

			std::set<int> teacher_available_timeslot;

			auto lastElement = --timeslot.end();
			int middle = (timeslot.begin()->first + lastElement->first) / 2;

			int allowance_multiplier = 3;

			int min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			int max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);
			// int gap = 0;
			bool break_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (show_penalty) {
					print(BLUE, "teacher", teacher_id, day, "U timeslot", timeslot_key, class_count, BLUE_B, ++counter, RESET);
				}

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - 1 - timeslot_key;
					// gap += difference;
					if ((difference >= break_time_duration) && !break_found) {
						if ((min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= max_allowance) ||
						    (min_allowance <= nextKey - 1 && nextKey - 1 <= max_allowance)) {
							break_found = true;
						}
					}
				}

				if (class_count > 1) {
					if (show_penalty) {
						print(RED, "teacher", teacher_id, "day", day, "timeslot", it->first, "value", class_count, RESET);
					}
					bee.teacher_violations[teacher_id].class_timeslot_overlap += (class_count - 1) * 3;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			if (!break_found && bee.timetable.teachers_class_count[day][teacher_id] >= bee.timetable.s_teacher_break_threshold) {
				if (show_penalty) {
					print(GREEN_B, "teacher with no break", teacher_id, "day", day, RESET);
				}
				bee.teacher_violations[teacher_id].no_break++;
			}
		}

		if (show_penalty) {
			print("teacher", teacher_id);
			print("a", bee.teacher_violations[teacher_id].class_timeslot_overlap);
			print("a", bee.teacher_violations[teacher_id].no_break);
			print("a", bee.teacher_violations[teacher_id].exceed_workload);
			print("a", bee.teacher_violations[teacher_id].class_gap);
		}

		bee.total_cost += bee.teacher_violations[teacher_id].class_timeslot_overlap;
		bee.total_cost += bee.teacher_violations[teacher_id].no_break;
		bee.total_cost += bee.teacher_violations[teacher_id].exceed_workload;
		bee.total_cost += bee.teacher_violations[teacher_id].class_gap;

		if (bee.teacher_violations[teacher_id].class_timeslot_overlap == 0 &&
		    bee.teacher_violations[teacher_id].no_break == 0 &&
		    bee.teacher_violations[teacher_id].exceed_workload == 0 &&
		    bee.teacher_violations[teacher_id].class_gap == 0) {
			bee.timetable.teachers_with_conflicts.erase(static_cast<int16_t>(teacher_id));
		} else {
			bee.timetable.teachers_with_conflicts.insert(static_cast<int16_t>(teacher_id));
		}
	}

	// auto& sections_timetable = bee.timetable.school_classes;
	auto& section_class_start_end = bee.timetable.school_class_time_range;
	auto& section_break_time = bee.timetable.section_break_slots;

	for (const int16_t& section_id_16 : update_sections) {
		int section_id = static_cast<int>(section_id_16);
		// for (const int& section_id : update_sections) {
		if (Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != Timetable::s_section_dynamic_subject_consistent_duration.end()) {
			continue;
		}

		// auto it = sections_timetable.find(section_id);
		// print(BOLD, "section", section_id, "size", it->second.size());

		if (!is_initial) {
			bee.total_cost -= bee.section_violations[section_id].early_break;
			bee.total_cost -= bee.section_violations[section_id].small_break_gap;
			bee.total_cost -= bee.section_violations[section_id].late_break;
		}

		bee.resetSectionViolation(section_id);

		int max_time = bee.timetable.s_section_start[section_id] + bee.timetable.s_section_total_duration[section_id];

		if (section_break_time[section_id].size() == 1) {
			// print("TITEEEEEEEEEEEEEEEE", section_id);

			int break_time = *section_break_time[section_id].begin();

			if (section_class_start_end[section_id][break_time].end > max_time - bee.timetable.s_break_timeslot_allowance) {
				bee.section_violations[section_id].late_break += 100000;
			}

			if (section_class_start_end[section_id][break_time].start < bee.timetable.s_break_timeslot_allowance) {
				bee.section_violations[section_id].early_break += 100000;
			}
		} else {
			int first_break_time = *section_break_time[section_id].begin();
			int last_break_time = *section_break_time[section_id].rbegin();

			int first_start = section_class_start_end[section_id][first_break_time].start;
			int last_end = section_class_start_end[section_id][last_break_time].end;

			if (last_end > max_time - bee.timetable.s_break_timeslot_allowance) {
				bee.section_violations[section_id].late_break += 100000;
			}

			if (first_start < bee.timetable.s_break_timeslot_allowance) {
				bee.section_violations[section_id].early_break += 100000;
			}

			// print("DD", section_id, last_end - first_start);

			if (last_end - first_start <= bee.timetable.s_break_timeslot_allowance) {
				bee.section_violations[section_id].small_break_gap += 100000;
			}
		}

		bee.total_cost += bee.section_violations[section_id].early_break;
		bee.total_cost += bee.section_violations[section_id].small_break_gap;
		bee.total_cost += bee.section_violations[section_id].late_break;

		// bool has_teacher_with_conflicts = false;

		// auto& section_subjects = bee.timetable.school_classes[section_id];

		// for (const auto& [timeslot, days] : section_subjects) {
		// 	// std::cout << "  Class ID: " << class_id << std::endl;

		// 	for (const auto& [day, school_class] : days) {
		// 		// std::cout << "    Timeslot ID: " << timeslot_id << std::endl;
		// 		// std::cout << "      SchoolClass ID: " << school_class.subject_id << std::endl;
		// 		// std::cout << "      SchoolClass Name: " << school_class.teacher_id << std::endl;

		// 		int16_t teacher_id = school_class.teacher_id;

		// 		if (bee.teacher_violations[teacher_id].class_timeslot_overlap > 0 ||
		// 		    bee.teacher_violations[teacher_id].no_break > 0 ||
		// 		    bee.teacher_violations[teacher_id].exceed_workload > 0 ||
		// 		    bee.teacher_violations[teacher_id].class_gap > 0) {
		// 			has_teacher_with_conflicts = true;
		// 			break;
		// 		}
		// 	}
		// }

		// if (bee.section_violations[section_id].early_break == 0 &&
		//     bee.section_violations[section_id].small_break_gap == 0 &&
		//     bee.section_violations[section_id].late_break == 0 &&
		//     has_teacher_with_conflicts == false) {
		// 	bee.timetable.sections_with_conflicts.erase(static_cast<int16_t>(section_id));
		// } else {
		// 	bee.timetable.sections_with_conflicts.insert(static_cast<int16_t>(section_id));
		// }

		// print("fdf 1", bee.section_violations[section_id].early_break);
		// print("fdf 2", bee.section_violations[section_id].small_break_gap);
		// print("fdf 3", bee.section_violations[section_id].late_break);

		if (bee.section_violations[section_id].early_break == 0 &&
		    bee.section_violations[section_id].small_break_gap == 0 &&
		    bee.section_violations[section_id].late_break == 0) {
			// print(GREEN_B, "erasing ", bee.timetable.sections_with_conflicts.size(), section_id);
			// print(GREEN_B, bee.timetable.sections_with_conflicts.size());
			bee.timetable.sections_with_conflicts.erase(static_cast<int16_t>(section_id));
		} else {
			// print("inserting ", bee.timetable.sections_with_conflicts.size(), section_id);
			bee.timetable.sections_with_conflicts.insert(static_cast<int16_t>(section_id));
			// print(bee.timetable.sections_with_conflicts.size());
		}
	}
};

void ObjectiveFunction::logConflicts(
    Bee& bee,
    std::ofstream& log_file) {
	auto& teachers_timetable = bee.timetable.teachers_timeslots;

	teacherViolation overall_total_teacher_violation = {0, 0, 0, 0};
	sectionViolation overall_total_section_violation = {0, 0, 0};

	std::map<int16_t, teacherViolation> teachers_total_violation;
	std::map<int16_t, sectionViolation> sections_total_violation;

	for (const int16_t& teacher_id_16 : bee.timetable.s_teachers_set) {
		const int teacher_id = static_cast<int>(teacher_id_16);

		auto it = teachers_timetable.find(teacher_id);

		if (it == teachers_timetable.end()) {
			continue;
		}

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id);

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (bee.timetable.teachers_class_count[day][teacher_id] > max_teacher_work_load) {
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
			int middle = (timeslot.begin()->first + lastElement->first) / 2;

			int allowance_multiplier = 3;

			int min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			int max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);
			// int gap = 0;
			bool break_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - timeslot_key - 1;
					// gap += difference;
					if ((difference >= break_time_duration) && !break_found) {
						if ((min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= max_allowance) ||
						    (min_allowance <= nextKey - 1 && nextKey - 1 <= max_allowance)) {
							break_found = true;
						}
					}
				}

				if (class_count > 1) {
					overall_total_teacher_violation.class_timeslot_overlap += class_count;
					teachers_total_violation[teacher_id].class_timeslot_overlap += class_count;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			// if (gap - break_time_duration > 1) {
			// 	total_teacher_violation.class_gap += gap - break_time_duration;
			// }

			if (!break_found && bee.timetable.teachers_class_count[day][teacher_id] >= bee.timetable.s_teacher_break_threshold) {
				overall_total_teacher_violation.no_break++;
				teachers_total_violation[teacher_id].no_break++;
			}
		}
	}

	// auto& sections_timetable = bee.timetable.school_classes;
	auto& section_class_start_end = bee.timetable.school_class_time_range;
	auto& section_break_time = bee.timetable.section_break_slots;

	for (const int16_t& section_id_16 : bee.timetable.s_sections_set) {
		const int section_id = static_cast<int>(section_id_16);

		if (section_break_time[section_id].size() == 1) {
			int break_time = *section_break_time[section_id].begin();

			if (section_class_start_end[section_id][break_time].end > bee.timetable.s_section_total_duration[section_id] - bee.timetable.s_break_timeslot_allowance) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (section_class_start_end[section_id][break_time].start < bee.timetable.s_break_timeslot_allowance) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}
		} else {
			int first_break_time = *section_break_time[section_id].begin();
			int last_break_time = *section_break_time[section_id].rbegin();

			int first_start = section_class_start_end[section_id][first_break_time].start;
			int last_end = section_class_start_end[section_id][last_break_time].end;

			if (last_end > bee.timetable.s_section_total_duration[section_id] - bee.timetable.s_break_timeslot_allowance) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (first_start < bee.timetable.s_break_timeslot_allowance) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}

			if (last_end - first_start <= bee.timetable.s_break_timeslot_allowance) {
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
	log_file << "class gap: " << overall_total_teacher_violation.class_gap << std::endl;
	log_file << std::endl;

	log_file << "Section: " << std::endl;
	log_file << "late break: " << overall_total_section_violation.late_break << std::endl;
	log_file << "early break: " << overall_total_section_violation.early_break << std::endl;
	log_file << "small break gap: " << overall_total_section_violation.small_break_gap << std::endl;
	log_file << "- + - + - + - + - + - + - + - + - + - + - + - + - + - + - + - +" << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	log_file << "............................teachers total class:....................." << std::endl;

	std::vector<int16_t> days;
	for (const auto& [day, _] : bee.timetable.teachers_class_count) {
		days.push_back(day);
	}

	// Output column headers (the days)
	log_file << std::setw(6) << "id";
	for (const auto& day : days) {
		log_file << std::setw(6) << "d " + std::to_string(day);
	}
	log_file << std::endl;

	// Find the maximum number of teachers to iterate over.
	// int max_teacher_count = 0;
	// for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
	// 	if (teacher.size() > max_teacher_count) {
	// 		max_teacher_count = teacher.size();
	// 	}
	// }
	int max_teacher_count = 0;
	for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
		if (static_cast<int>(teacher.size()) > max_teacher_count) {
			max_teacher_count = static_cast<int>(teacher.size());
		}
	}

	// Output each teacher and their class count for each day.
	for (int teacher_id = 0; teacher_id < max_teacher_count; ++teacher_id) {
		log_file << std::endl;
		log_file << std::setw(6) << teacher_id;  // Print teacher ID in the first column.

		bool is_consistent = true;
		int first_day_count = -1;  // Initialize to an invalid value for comparison.

		// For each day, print the corresponding class count for this teacher.
		for (const auto& day : days) {
			const auto& teachers = bee.timetable.teachers_class_count.at(day);

			if (teacher_id < static_cast<int>(teachers.size())) {
				int current_count = teachers[teacher_id];

				// Check if this is the first valid count we're seeing for this teacher.
				if (first_day_count == -1) {
					first_day_count = current_count;  // Set first day's class count.
				} else if (current_count != first_day_count) {
					is_consistent = false;  // Inconsistent if current count doesn't match the first day.
				}

				log_file << std::setw(6) << current_count;
			} else {
				log_file << std::setw(6) << "-";  // Print a dash if no teacher exists for this day.
			}
		}

		log_file << std::setw(6) << " | " << (is_consistent ? "Consistent" : "not consistent") << std::endl;
		log_file << std::endl;
	}

	log_file << "......................................................................" << std::endl;

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
};

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e) {
	int64_t result = 0;
	result |= (static_cast<int64_t>(a) & 0xFFFF) << 48;
	result |= (static_cast<int64_t>(b) & 0xFFFF) << 32;
	result |= (static_cast<int64_t>(c) & 0xFFFF) << 16;
	result |= (static_cast<int64_t>(d) & 0xFF) << 8;
	result |= (static_cast<int64_t>(e) & 0xFF);
	return result;
}

int32_t packInt16ToInt32(int16_t first, int16_t second) {
	int32_t result = (static_cast<int32_t>(first) << 16) | (static_cast<uint16_t>(second));
	return result;
}

void getResult(Bee& bee, int64_t* result, int64_t* result_2, int offset_duration) {
	print("Getting result...");

	int iter = 0;
	for (const auto& [grade, gradeMap] : bee.timetable.school_classes) {
		for (const auto& [timeslot, classMap] : gradeMap) {
			for (const auto& [day, schoolClass] : classMap) {
				// print("class xx",
				//       grade,
				//       schoolClass.subject_id,
				//       schoolClass.teacher_id,
				//       static_cast<int8_t>(timeslot),
				//       day);

				int64_t packed = pack5IntToInt64(
				    grade,
				    schoolClass.subject_id,
				    schoolClass.teacher_id,
				    static_cast<int8_t>(timeslot),
				    day);
				// std::cout << "packed : " << packed << std::endl;

				int start = bee.timetable.school_class_time_range[grade][timeslot].start + offset_duration * timeslot;
				int end = bee.timetable.school_class_time_range[grade][timeslot].end + offset_duration * (timeslot + 1);

				result[iter] = packed;
				result_2[iter] = pack5IntToInt64(start, end, 0, 0, 0);

				iter++;
			}
		}
	}

	result[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);
	result_2[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);

	print("...Done getting result!");
}

extern "C" {

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,

    int32_t* section_subjects,
    int32_t* section_subject_duration,
    int32_t* section_subject_order,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* section_subject_units,

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
    int64_t* result,
    int64_t* result_2,

    bool enable_logging) {
	Timetable::reset();
	print(CYAN, "RESET", RESET);

	{
		std::unordered_map<int, int> section_num_of_class_block;

		Timetable::s_break_timeslot_allowance = break_timeslot_allowance;
		Timetable::s_teacher_break_threshold = teacher_break_threshold;
		Timetable::s_default_class_duration = default_class_duration;
		Timetable::s_max_teacher_work_load = max_teacher_work_load;
		Timetable::s_break_time_duration = break_time_duration;
		Timetable::s_work_week = work_week;

		Timetable::s_section_num_breaks.resize(total_section);
		Timetable::initializeSectionsSet(total_section);
		Timetable::initializeTeacherSet(num_teachers);

		for (int i = 0; i < total_section; i++) {
			Timetable::s_section_start[i] = section_start[i];
		}

		for (int i = 0; i < teacher_subjects_length; i++) {
			if (teacher_subjects[i] == -1) continue;

			int16_t teacher, subject;
			teacher = static_cast<int16_t>(teacher_subjects[i] >> 16);
			subject = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
			Timetable::s_eligible_teachers_in_subject[subject].push_back(teacher);
		}

		// std::cout << "section_subjects_map" << std::endl;
		for (int i = 0; i < total_section_subjects; i++) {
			int16_t unpacked_first_section_subjects, unpacked_second_section_subjects;
			int16_t unpacked_first_section_subjects_units, unpacked_second_section_subjects_units;
			int16_t unpacked_first_section_subjects_duration, unpacked_second_section_subjects_duration;
			int16_t unpacked_first_section_subjects_order, unpacked_second_section_subjects_order;

			unpacked_first_section_subjects = static_cast<int16_t>(section_subjects[i] >> 16);
			unpacked_second_section_subjects = static_cast<int16_t>(section_subjects[i] & 0xFFFF);

			unpacked_first_section_subjects_units = static_cast<int16_t>(section_subject_units[i] >> 16);
			unpacked_second_section_subjects_units = static_cast<int16_t>(section_subject_units[i] & 0xFFFF);

			unpacked_first_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] >> 16);
			unpacked_second_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] & 0xFFFF);

			unpacked_first_section_subjects_order = static_cast<int16_t>(section_subject_order[i] >> 16);
			unpacked_second_section_subjects_order = static_cast<int16_t>(section_subject_order[i] & 0xFFFF);

			Timetable::s_section_subjects[unpacked_first_section_subjects].push_back(unpacked_second_section_subjects);

			// std::cout << "a : " << unpacked_first_section_subjects << " b : " << unpacked_second_section_subjects << std::endl;
			Timetable::s_section_subjects_units[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_units, unpacked_second_section_subjects_units));
			Timetable::s_section_subjects_duration[unpacked_first_section_subjects][unpacked_first_section_subjects_duration] = unpacked_second_section_subjects_duration;
			Timetable::s_section_subjects_order[unpacked_first_section_subjects][unpacked_first_section_subjects_order] = unpacked_second_section_subjects_order;

			if (unpacked_first_section_subjects_order != 0) {
				Timetable::s_section_fixed_subject[unpacked_first_section_subjects] = unpacked_first_section_subjects_order;
			}

			section_num_of_class_block[unpacked_first_section_subjects] += unpacked_second_section_subjects_units == 0 ? work_week : unpacked_second_section_subjects_units;
		}

		for (int i = 0; i < total_section; i++) {
			auto& section_subjects_order = Timetable::s_section_subjects_order[i];

			bool is_consistent_duration = true;
			for (auto it = section_subjects_order.begin(); it != section_subjects_order.end(); it++) {
				if (it->second != 0) {
					continue;
				}

				print(RED, "section ", i, it->first, Timetable::s_section_subjects_duration[i][it->first], default_class_duration);

				if (Timetable::s_section_subjects_duration[i][it->first] != default_class_duration) {
					is_consistent_duration = false;
					break;
				}
			}

			if (is_consistent_duration) {
				Timetable::s_section_dynamic_subject_consistent_duration.insert(i);
			} else {
				print(RED, "section " + std::to_string(i) + " has inconsistent duration");
			}
		}

		// std::cout << "section_subjects_units_map" << std::endl;
		for (auto it = Timetable::s_section_subjects_units.begin(); it != Timetable::s_section_subjects_units.end(); it++) {
			// std::cout << it->first << " g: ";
			for (int i = 0; i < static_cast<int>(it->second.size()); i++) {
				// std::cout << it->second[i].first << " h: " << it->second[i].second << " ";
			}

			// std::cout << std::endl;
		}

		// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
		// 10-12 why?
		for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
			// std::cout << it->first << " " << it->second << std::endl;

			// std::cout << " xx x xxxxxxxxxxxf : " << (((it->second + work_week - 1) / work_week)) << std::endl;
			int timeslots = (((it->second + work_week - 1) / work_week));

			int section_total_duration = 0;

			for (auto it2 = Timetable::s_section_subjects_duration[it->first].begin(); it2 != Timetable::s_section_subjects_duration[it->first].end(); it2++) {
				section_total_duration += it2->second;
			}

			int num_breaks = section_total_duration <= min_total_class_duration_for_two_breaks ? 1 : 2;
			// std::cout << "ehhe " << section_total_duration << " " << timeslots << " " << num_breaks << " " << timeslots + num_breaks << std::endl;
			Timetable::s_section_timeslot[it->first] = timeslots + num_breaks;
			// below 10 - 1, 2 equal or above

			Timetable::s_section_num_breaks[it->first] = num_breaks;
		}
	}

	// return;

	// std::cout << "eligible_teachers_in_subject" << std::endl;
	// for (auto it = eligible_teachers_in_subject.begin(); it != eligible_teachers_in_subject.end(); it++) {
	// 	std::cout << it->first << " ";

	// 	for (int i = 0; i < it->second.size(); i++) {
	// 		std::cout << it->second[i] << " ";
	// 	}

	// 	std::cout << std::endl;
	// }

	// std::cout << "eligible_teachers_in_subject end" << std::endl;
	// std::cout << "ff : " << eligible_teachers_in_subject.size() - 1 << std::endl;

	Timetable::initializeRandomSectionDistribution(0, total_section - 1);
	Timetable::initializeRandomFieldDistribution(0, 2);
	Timetable::initializeRandomWorkDayDistribution(1, work_week);

	ObjectiveFunction evaluator;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");

	Bee best_solution(num_teachers);

	std::unordered_set<int16_t> affected_teachers;
	std::unordered_set<int16_t> affected_sections;

	affected_teachers.reserve(num_teachers);
	affected_sections.reserve(total_section);

	print(MAGENTA_B, " -- FIRSTTTTTTTTTTTTT -- ");
	best_solution.timetable.initializeRandomTimetable(affected_teachers);
	printSchoolClasses(best_solution.timetable);
	evaluator.evaluate(best_solution, affected_teachers, Timetable::s_sections_set, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);

	{
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
	}

	vector<Bee>
	    bees_vector(bees_population, Bee(num_teachers));

	for (int i = 0; i < bees_population; i++) {
		affected_teachers.clear();

		bees_vector[i].timetable.initializeRandomTimetable(affected_teachers);

		evaluator.evaluate(bees_vector[i], affected_teachers, Timetable::s_sections_set, false, true);

		if (bees_vector[i].total_cost <= best_solution.total_cost) {
			best_solution = bees_vector[i];
		}
	}

	vector<int> bees_abandoned(bees_population, 0);
	std::unordered_set<int> above_limit_abandoned_bees;
	std::uniform_int_distribution<>
	    dist_bees_employed(0, bees_employed - 1);

	int iteration_count = max_iterations;
	auto generation_start = std::chrono::high_resolution_clock::now();

	std::map<int, int> costs;

	// return;

	print(YELLOW, "starting iteration");
	for (int iter = 0; iter < max_iterations; iter++) {
		// print("haha", iter);

		if (iter % 10 == 0) {
			costs[best_solution.total_cost]++;
		}

		int total_cost = 0;

		for (int i = 0; i < bees_employed; i++) {
			int random_bee;
			do {
				random_bee = dist_bees_employed(randomizer_engine);
			} while (random_bee == i);

			Bee new_bee = bees_vector[random_bee];

			affected_teachers.clear();
			affected_sections.clear();

			new_bee.timetable.modify(affected_teachers, affected_sections);
			evaluator.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					above_limit_abandoned_bees.insert(i);
				}
			}

			total_cost += bees_vector[i].total_cost;
		}

		double averageCost = total_cost / bees_employed;

		vector<double> fitness_values(bees_employed, 0);
		double fSum = 0;
		for (int i = 0; i < bees_employed; i++) {
			fitness_values[i] = exp(-bees_vector[i].total_cost / averageCost);
			fSum += fitness_values[i];
		}

		vector<double> prob(bees_employed, 0);
		for (int i = 0; i < bees_employed; i++) {
			prob[i] = fitness_values[i] / fSum;
		}

		auto fitness_proportionate_selection = [&](const vector<double>& prob) {
			std::uniform_real_distribution<> dis(0.0, 1.0);
			double r = dis(randomizer_engine);
			double cumulative = 0.0;
			for (int i = 0; i < static_cast<int>(prob.size()); i++) {
				cumulative += prob[i];
				if (r <= cumulative) {
					return i;
				}
			}
			return static_cast<int>(prob.size() - 1);
		};

		for (int m = 0; m < bees_onlooker; m++) {
			int i = fitness_proportionate_selection(prob);

			int random_bee;
			do {
				random_bee = rand() % bees_employed;
			} while (random_bee == i);

			Bee new_bee = bees_vector[random_bee];
			affected_teachers.clear();
			affected_sections.clear();

			new_bee.timetable.modify(affected_teachers, affected_sections);
			evaluator.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					above_limit_abandoned_bees.insert(i);
				}
			}
		}

		for (int itScout = 0; itScout < bees_scout; itScout++) {
			for (auto it = above_limit_abandoned_bees.begin(); it != above_limit_abandoned_bees.end();) {
				Bee new_bee(num_teachers);
				affected_teachers.clear();

				new_bee.timetable.initializeRandomTimetable(affected_teachers);

				bees_vector[*it] = new_bee;

				evaluator.evaluate(bees_vector[*it], affected_teachers, Timetable::s_sections_set, false, true);

				bees_abandoned[*it] = 0;

				it = above_limit_abandoned_bees.erase(it);
			}
		}

		for (int i = 0; i < bees_employed; i++) {
			if (bees_vector[i].total_cost <= best_solution.total_cost) {
				best_solution = bees_vector[i];
			}
		}

		if (best_solution.total_cost == 0) {
			print(CYAN_BG, BOLD, "EARLY BREAK Best solution: cost ", best_solution.total_cost, " at ", iter, RESET);
			iteration_count = iter;
			break;
		}
	}

	auto generation_end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = generation_end - generation_start;

	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);

	auto now = std::chrono::system_clock::now();
	std::time_t now_time = std::chrono::system_clock::to_time_t(now);
	std::tm* localTime = std::localtime(&now_time);
	std::string date = std::to_string(localTime->tm_year - 100) + "-" + std::to_string(localTime->tm_mon + 1) + "-" + std::to_string(localTime->tm_mday);
	std::string time = std::to_string(localTime->tm_hour) + "-" + std::to_string(localTime->tm_min) + "-" + std::to_string(localTime->tm_sec);

	int duration_in_seconds = static_cast<int>(duration.count());

	int hours = duration_in_seconds / 3600;
	int minutes = (duration_in_seconds % 3600) / 60;
	int seconds = duration_in_seconds % 60;

	printSchoolClasses(best_solution.timetable);

	if (enable_logging) {
		std::string name_file = std::string(LOG_FOLDER) + std::string(date) + "-" + time + "---" +
		                        std::to_string(num_teachers) + "_" + std::to_string(total_section) + "_" + std::to_string(best_solution.total_cost) + "---" + "timetable.txt";
		std::ofstream txt_file(name_file);
		printSchoolClasses(best_solution.timetable, txt_file);
		evaluator.logConflicts(best_solution, txt_file);
		txt_file << "----------------------------------------------------------------------" << std::endl;
		txt_file << "Best solution: " << std::endl;
		txt_file << "Total cost: " << best_solution.total_cost << std::endl;
		txt_file << "Total process duration: " << duration.count() << " seconds (" << hours << "h " << minutes << "m " << seconds << "s)" << std::endl;
		txt_file << "Iteration count: " << iteration_count << std::endl;
		txt_file << "Teachers count: " << Timetable::s_teachers_set.size() << std::endl;
		txt_file << "Sections count: " << Timetable::s_sections_set.size() << std::endl;
		txt_file << "Work week: " << Timetable::s_work_week << std::endl;
		txt_file << "Break time duration: " << Timetable::s_break_time_duration << std::endl;
		txt_file << "Teachers work load: " << max_teacher_work_load << std::endl;
		txt_file << "Max iterations: " << max_iterations << std::endl;

		txt_file << "Date: " << date << std::endl;
		txt_file << "Time: " << time << std::endl;
		txt_file << "----------------------------------------------------------------------" << std::endl;

		printCosts(costs, txt_file);

		print("----------------------------");
		print("result log file: ", name_file);
		print("----------------------------");

		txt_file.close();
	}

	evaluator.evaluate(best_solution, Timetable::s_teachers_set, Timetable::s_sections_set, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(iteration_count == max_iterations ? RED_BG : CYAN_BG, BOLD, iteration_count == max_iterations ? "MAXIMUM ITERATIONS REACHED" : "EARLY BREAK Best solution: cost ", best_solution.total_cost, " at ", iteration_count, RESET);

	print("Time taken: ", duration.count(), "seconds");
	print("Time taken: ", hours, ":", minutes, ":", seconds);

	getResult(best_solution, result, result_2, offset_duration);
	return;
}
}
