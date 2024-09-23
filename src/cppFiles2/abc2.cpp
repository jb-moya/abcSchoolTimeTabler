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

// std::vector<int16_t>& eligible_teachers = eligible_teachers_in_subject[subject_id];

// // Find the teacher who has been assigned the fewest sections
// int min_assignments = 999;  // maximum possible number of sections
// std::vector<int16_t> least_assigned_teachers;

// // Identify teachers with the minimum number of assignments
// for (int16_t teacher : eligible_teachers) {
// 	int assignment_count = teachers_class_count[teacher];
// 	if (assignment_count < min_assignments) {
// 		min_assignments = assignment_count;
// 		least_assigned_teachers.clear();
// 		least_assigned_teachers.push_back(teacher);
// 	} else if (assignment_count == min_assignments) {
// 		least_assigned_teachers.push_back(teacher);
// 	}
// }

// // Randomly select a teacher from the least assigned list
// std::uniform_int_distribution<> dis(0, least_assigned_teachers.size() - 1);
// int16_t selected_teacher = least_assigned_teachers[dis(randomizer_engine)];

std::random_device rd;
std::mt19937 randomizer_engine(rd());

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
	for (const auto& [grade, gradeMap] : timetable.schoolClasses) {
		std::cout << BLUE << "--------- - - Section: " << grade << RESET << std::endl;
		int inner_count = 0;
		for (const auto& [timeslot, classMap] : gradeMap) {
			// std::cout << "size :  " << classMap.size() << std::endl;
			for (const auto& [day, schoolClass] : classMap) {
				std::cout << GREEN << "" << std::setw(4) << timeslot << RESET;
				std::cout << YELLOW << "  d: " << std::setw(4) << day << RESET;
				std::cout << RED << " s : " << std::setw(4) << schoolClass.subject_id << RESET;
				std::cout << MAGENTA << " t : " << std::setw(4) << schoolClass.teacher_id << RESET;
				std::cout << " r : " << std::setw(4) << timetable.schoolClassStartEnd[grade][timeslot].start << "_" << timetable.schoolClassStartEnd[grade][timeslot].end << " ";
				std::cout << YELLOW_BG << std::setw(4) << ++inner_count << RESET << std::endl;
			}
		}

		std::cout << RESET << std::endl;
	}

	std::cout << std::endl;
}

std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> Timetable::section_subjects_units;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::section_subjects_duration;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::eligible_teachers_in_subject;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::section_subjects;
std::unordered_map<int16_t, int> Timetable::section_total_duration;
std::unordered_map<int16_t, int> Timetable::section_timeslot;
std::unordered_map<int16_t, int> Timetable::section_start;
std::unordered_set<int> Timetable::teachers_set;
std::unordered_set<int> Timetable::sections_set;
std::vector<int> Timetable::section_num_breaks;
int Timetable::break_timeslot_allowance;
int Timetable::teacher_break_threshold;
int Timetable::default_class_duration;
int Timetable::break_time_duration;
int Timetable::work_week;

std::uniform_int_distribution<int16_t> Timetable::random_class_block;
std::uniform_int_distribution<int16_t> Timetable::random_section;
std::uniform_int_distribution<int8_t> Timetable::random_workDay;
std::uniform_int_distribution<int16_t> Timetable::random_field;

void Timetable::reset() {
	section_subjects_units.clear();
	section_subjects_duration.clear();
	eligible_teachers_in_subject.clear();
	section_subjects.clear();
	section_timeslot.clear();
	section_start.clear();
	teachers_set.clear();
	sections_set.clear();
	section_num_breaks.clear();
	break_time_duration = 0;
	work_week = 0;

	// Reinitialize the distributions with default ranges
	initializeRandomClassBlockDistribution(0, 0);
	initializeRandomSectionDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
}

void Timetable::initializeTeachersClass(int teachers) {
	for (int day = 1; day <= work_week; ++day) {
		teachers_class_count[day].resize(teachers);
		for (int i = 0; i < teachers; ++i) {
			teachers_class_count[day][i] = 0;
		}
	}
}

void Timetable::initializeTeacherSet(int teachers) {
	teachers_set.clear();

	for (int i = 0; i < teachers; ++i) {
		teachers_set.insert(i);
	}
}

void Timetable::initializeSectionsSet(int sections) {
	sections_set.clear();

	for (int i = 0; i < sections; ++i) {
		sections_set.insert(i);
	}
}

void Timetable::initializeRandomClassBlockDistribution(int min, int max) {
	random_class_block = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomSectionDistribution(int min, int max) {
	random_section = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomFieldDistribution(int min, int max) {
	random_field = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}

void Timetable::updateTeachersTimeslots(
    std::unordered_set<int>& update_teachers,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    int16_t random_section,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);

	auto beginning = schoolClasses[random_section].begin();

	int start = Timetable::section_start[random_section];

	for (auto it = itLow; it != itUp; ++it) {
		if (it->first == itLow->first + 1 && is_skipping_between) {
			it = itUpPrev;
		}

		auto& day_schedule = schoolClasses[random_section][it->first];
		auto day_zero = day_schedule.find(0);

		if (it != beginning) {
			start = schoolClassStartEnd[random_section][std::prev(it)->first].end;
		}

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;
			int duration = (subject == -1) ? Timetable::break_time_duration : Timetable::section_subjects_duration[random_section][subject];

			int teacher = day_zero->second.teacher_id;

			if (!is_reset) {
				schoolClassStartEnd[random_section][it->first].start = start;
				schoolClassStartEnd[random_section][it->first].end = start + duration;
			}

			if (subject != -1) {
				auto& teacher_timeslot = teachers_timeslots[teacher];

				if (is_returning_teachers) {
					update_teachers.insert(teacher);
				}

				for (int i = 1; i <= Timetable::work_week; ++i) {
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
				int duration = Timetable::section_subjects_duration[random_section][subject];
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
				schoolClassStartEnd[random_section][it->first].start = start;
				schoolClassStartEnd[random_section][it->first].end = start + max_duration;
			}
		}
	}
}

void Timetable::initializeRandomTimetable(std::unordered_set<int>& update_teachers) {
	// print("hehe");
	for (const auto& entry : section_subjects) {
		// print("haha ha");
		int16_t section_id = entry.first;
		std::vector<int16_t> random_subjects = entry.second;

		std::map<int, int> timeslots;

		// std::vector<int> timeslot_keys;
		std::deque<int> timeslot_keys;
		for (int i = 0; i < Timetable::section_timeslot[section_id]; ++i) {
			// print("i i i", i);
			timeslots[i] = Timetable::work_week;
			timeslot_keys.push_back(i);
		}

		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		std::shuffle(random_subjects.begin(), random_subjects.end(), randomizer_engine);

		int total_duration = 0;

		const auto& units_map = Timetable::section_subjects_units[section_id];
		// print("hzhz hz");
		for (const auto& subject_id : random_subjects) {
			if (units_map.at(subject_id).second == 0) {
				full_week_day_subjects.push_back(subject_id);
				total_duration += Timetable::section_subjects_duration[section_id][subject_id];
			} else {
				special_unit_subjects.push_back(subject_id);
			}
		}

		int num_breaks = Timetable::section_num_breaks[section_id];

		for (int i = 0; i < num_breaks; ++i) {
			std::uniform_int_distribution<> dist(1, timeslot_keys.size() - 2);  // ignore first and last
			int random_index = dist(randomizer_engine);

			int timeslot_key = timeslot_keys[random_index];
			timeslot_keys.erase(timeslot_keys.begin() + random_index);

			schoolClasses[section_id][timeslot_key][0] = SchoolClass{-1, -1};

			section_break_timeslots[section_id].insert(timeslot_key);

			timeslots.erase(timeslot_key);
		}
		// print("tttttttttttt");

		std::shuffle(timeslot_keys.begin(), timeslot_keys.end(), randomizer_engine);

		// print("fasjkdljf", timeslot_keys.size(), "Fcv", full_week_day_subjects.size(), "Fcv", special_unit_subjects.size(), "Fcv");
		for (const auto& subject_id : full_week_day_subjects) {
			std::uniform_int_distribution<> dis(0, Timetable::eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t selected_teacher = Timetable::eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];

			for (int day = 1; day <= work_week; ++day) {
				teachers_class_count[day][selected_teacher]++;
			}

			int timeslot_key = timeslot_keys.back();
			timeslot_keys.pop_back();

			schoolClasses[section_id][timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

			timeslots.erase(timeslot_key);
		}

		// print("after ", timeslot_keys.size(), "Fcv");

		int day = 1;
		// print(" -ffffffff- - - ff--  -- -");
		for (const auto& subject_id : special_unit_subjects) {
			print(BLUE, "W H A T", RESET);
			std::uniform_int_distribution<> dis(0, Timetable::eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher = Timetable::eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
			int16_t num_unit = units_map.at(subject_id).second;

			teachers_class_count[day][random_teacher]++;

			for (int iter = 1; iter <= num_unit; ++iter) {
				auto it = std::find_if(timeslot_keys.rbegin(), timeslot_keys.rend(),
				                       [&timeslots](int key) { return timeslots[key] > 0; });

				if (it == timeslot_keys.rend()) break;

				int timeslot = *it;

				schoolClasses[section_id][timeslot][day] = SchoolClass{subject_id, random_teacher};

				section_segmented_timeslot[section_id].insert(timeslot);

				if (--timeslots[timeslot] == 0) {
					auto regularIt = it.base();
					timeslot_keys.erase(--regularIt);
					timeslots.erase(timeslot);
				}

				if (++day > work_week) day = 1;
			}
		}

		int class_start = Timetable::section_start[section_id];

		for (const auto& pair : schoolClasses[section_id]) {
			// std::cout << "Key: " << pair.first << ", Value: " << pair.second.count(0) << std::endl;

			if (pair.second.count(0)) {
				const SchoolClass& schoolClass = pair.second.at(0);
				int16_t subject_id = schoolClass.subject_id;

				int duration = (subject_id == -1) ? Timetable::break_time_duration : Timetable::section_subjects_duration[section_id][subject_id];

				schoolClassStartEnd[section_id][pair.first] = ClassStartEnd{class_start, class_start + duration};
				class_start += duration;

				// print("XXX", class_start);
			} else {
				// print("HJHHHHHHHHHHHHH");
				int max_duration = 0;

				for (int i = 1; i <= work_week; ++i) {
					if (pair.second.count(i)) {
						int subject_id = pair.second.at(i).subject_id;

						if (Timetable::section_subjects_duration[section_id][subject_id] > max_duration) {
							max_duration = Timetable::section_subjects_duration[section_id][subject_id];
						}
					}
				}

				// print("hHh 2", class_start, max_duration);

				// print(RED, "napupunta", class_start);
				schoolClassStartEnd[section_id][pair.first] = ClassStartEnd{class_start, class_start + max_duration};

				class_start += max_duration;
			}
		}

		Timetable::section_total_duration[section_id] = class_start;

		updateTeachersTimeslots(update_teachers, schoolClasses[section_id].begin(), schoolClasses[section_id].end(), true, false, section_id, false);
	}
}

int getRandomInRange(int n) {
	// print("section timeslot", n);
	std::uniform_int_distribution<int> distribution(0, n);
	// print("v", distribution(engine));
	return distribution(randomizer_engine);
}

void Timetable::update(std::unordered_set<int>& update_teachers, std::unordered_set<int>& update_sections) {
	int16_t choice = Timetable::random_field(randomizer_engine);
	int16_t selected_section;
	int random_timeslot_1;
	int random_timeslot_2;

	// print(RED, "choice ", choice);

	// getting random section
	if (choice == 2) {
		// std::cout << GREEN << "CHOICE 2" << RESET << std::endl;
		// print("size", section_segmented_timeslot.size());

		if (section_segmented_timeslot.size() == 0) {
			std::uniform_int_distribution<> dis(0, 1);
			selected_section = Timetable::random_section(randomizer_engine);
			choice = dis(randomizer_engine);
		} else {
			print("eh ?");
			std::uniform_int_distribution<> dis(0, section_segmented_timeslot.size() - 1);
			auto it = section_segmented_timeslot.begin();
			std::advance(it, dis(randomizer_engine));

			selected_section = it->first;
			print("random fffffffsection ", selected_section);
		}

	} else {
		selected_section = Timetable::random_section(randomizer_engine);
	}

	if (choice == 0) {
		update_sections.insert(selected_section);
	}

	// getting random timeslot
	if (choice == 0) {
		// int subject_id_1 = NULL;
		// int subject_id_2 = NULL;

		do {
			random_timeslot_1 = getRandomInRange(section_timeslot[selected_section] - 1);
			// subject_id_1 = schoolClasses[random_section][random_timeslot_1][0].subject_id;
			random_timeslot_2 = getRandomInRange(section_timeslot[selected_section] - 1);
			// subject_id_2 = schoolClasses[random_section][random_timeslot_2][0].subject_id;

			// print("random timeslot 1", random_timeslot_1, "random timeslot 2", random_timeslot_2, "subject id 1", subject_id_1, "subject id 2", subject_id_2);
		} while (random_timeslot_1 == random_timeslot_2);

		// ||
		//     ((subject_id_1 == -1 || subject_id_2 == -1) && ((random_timeslot_1 == 0 || random_timeslot_1 == section_timeslot[random_section] - 1) ||
		//                                                     (random_timeslot_2 == 0 || random_timeslot_2 == section_timeslot[random_section] - 1)))

		// print("hehe");
	} else if (choice == 1) {
		random_timeslot_1 = getRandomInRange(section_timeslot[selected_section] - 1);
		random_timeslot_2 = random_timeslot_1;
	} else if (choice == 2) {
		std::vector<int16_t> timeslots;

		for (const auto& entry : section_segmented_timeslot[selected_section]) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);

		int timeslot_index_1 = dis2(randomizer_engine);
		int timeslot_index_2 = dis2(randomizer_engine);

		random_timeslot_1 = timeslots[timeslot_index_1];
		random_timeslot_2 = timeslots[timeslot_index_2];
	}

	auto itLow = schoolClasses[selected_section].lower_bound(std::min(random_timeslot_1, random_timeslot_2));
	auto itUp = schoolClasses[selected_section].upper_bound(std::max(random_timeslot_1, random_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	int16_t random_timeslot_1_max_duration = 0;
	int16_t random_timeslot_2_max_duration = 0;

	bool is_itLow_break = false;
	bool is_itUpPrev_break = false;

	if (auto itLowDayZero = schoolClasses[selected_section][itLow->first].find(0); itLowDayZero != schoolClasses[selected_section][itLow->first].end()) {
		int subject = itLowDayZero->second.subject_id;

		if (subject == -1) {
			is_itLow_break = true;
		}

		random_timeslot_1_max_duration = is_itLow_break ? Timetable::break_time_duration : section_subjects_duration[selected_section][subject];
	} else {
		for (const auto& day : itLow->second) {
			random_timeslot_1_max_duration = std::max(random_timeslot_1_max_duration, section_subjects_duration[selected_section][day.second.subject_id]);
		}
	}

	if (auto itUpDayZero = schoolClasses[selected_section][itUpPrev->first].find(0); itUpDayZero != schoolClasses[selected_section][itUpPrev->first].end()) {
		int subject = itUpDayZero->second.subject_id;

		if (subject == -1) {
			is_itUpPrev_break = true;
		}

		random_timeslot_2_max_duration = is_itUpPrev_break ? Timetable::break_time_duration : section_subjects_duration[selected_section][subject];
	} else {
		for (const auto& day : itUpPrev->second) {
			random_timeslot_2_max_duration = std::max(random_timeslot_2_max_duration, section_subjects_duration[selected_section][day.second.subject_id]);
		}
	}

	bool is_skipping_between = (random_timeslot_1_max_duration == random_timeslot_2_max_duration);

	updateTeachersTimeslots(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);

	auto& section = schoolClasses[selected_section];

	if (choice == 0) {
		// swapping of classes between timeslots in the same section

		// std::cout << "swapping " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		// print("bool", is_itLow_break, "bool", is_itUpPrev_break, "xx", random_timeslot_1, random_timeslot_2);

		if (is_itLow_break && !is_itUpPrev_break) {
			section_break_timeslots[selected_section].erase(itLow->first);
			section_break_timeslots[selected_section].insert(itUpPrev->first);

			// print("erasing", itLow->first, "inserting", itUpPrev->first);

		} else if (is_itUpPrev_break && !is_itLow_break) {
			section_break_timeslots[selected_section].erase(itUpPrev->first);
			section_break_timeslots[selected_section].insert(itLow->first);

			// print("erasing", itUpPrev->first, "inserting", itLow->first);
		}

		std::swap(section[random_timeslot_1], section[random_timeslot_2]);

		// Check if the random_section exists
		auto it = section_segmented_timeslot.find(selected_section);

		if (it != section_segmented_timeslot.end()) {
			// random_section exists, proceed with the logic
			auto& timeslot_set = it->second;

			if (timeslot_set.count(random_timeslot_1) > 0 && timeslot_set.count(random_timeslot_2) > 0) {
				// Both timeslots exist, do nothing (or return)
			} else if (timeslot_set.count(random_timeslot_1) > 0 && timeslot_set.count(random_timeslot_2) == 0) {
				timeslot_set.erase(random_timeslot_1);
				timeslot_set.insert(random_timeslot_2);
			} else if (timeslot_set.count(random_timeslot_2) > 0 && timeslot_set.count(random_timeslot_1) == 0) {
				timeslot_set.erase(random_timeslot_2);
				timeslot_set.insert(random_timeslot_1);
			}
		}

	} else if (choice == 1) {
		// 	// changing teachers
		int random_timeslot = random_timeslot_1;
		auto& section_timeslot = section[random_timeslot];

		if (section_timeslot.count(0) > 0) {
			int16_t subject_id = section_timeslot[0].subject_id;
			int16_t old_teacher = section_timeslot[0].teacher_id;
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

			if (subject_id != -1) {
				int16_t random_teacher;

				do {
					random_teacher = eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
				} while (random_teacher == old_teacher && eligible_teachers_in_subject[subject_id].size() > 1);

				for (int day = 1; day <= work_week; day++) {
					teachers_class_count[day][old_teacher]--;
					teachers_class_count[day][random_teacher]++;
				}

				update_teachers.insert(old_teacher);
				update_teachers.insert(random_teacher);

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- zero day :" << "Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
				section_timeslot[0] = SchoolClass{subject_id, random_teacher};
			};
		} else {
			int8_t workday = Timetable::random_workDay(randomizer_engine);
			int16_t subject_id = section_timeslot[workday].subject_id;
			int16_t old_teacher = section_timeslot[workday].teacher_id;
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

			if (subject_id != -1) {
				int16_t random_teacher;

				do {
					random_teacher = eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
				} while (random_teacher == old_teacher && eligible_teachers_in_subject[subject_id].size() > 1);

				for (int day = 1; day <= work_week; day++) {
					teachers_class_count[day][old_teacher]--;
					teachers_class_count[day][random_teacher]++;
				}

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- workday : " << _staticcast<int>(workday) << " Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
				section_timeslot[workday] = SchoolClass{subject_id, random_teacher};
			}
		}
	} else if (choice == 2) {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		int day_1, day_2;

		auto& section_timeslot_1 = section[random_timeslot_1];
		auto& section_timeslot_2 = section[random_timeslot_2];

		do {
			day_1 = Timetable::random_workDay(randomizer_engine);
			day_2 = Timetable::random_workDay(randomizer_engine);
		} while ((day_1 == day_2 && random_timeslot_1 == random_timeslot_2) ||
		         (section_timeslot_1.find(day_1) == section_timeslot_1.end() &&
		          section_timeslot_2.find(day_2) == section_timeslot_2.end()));

		auto it1 = section_timeslot_1.find(day_1);
		auto it2 = section_timeslot_2.find(day_2);

		if (it1 != section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			std::swap(it1->second, it2->second);
		} else if (it1 != section_timeslot_1.end() && it2 == section_timeslot_2.end()) {
			section_timeslot_2[day_2] = std::move(it1->second);
			section_timeslot_1.erase(it1);
		} else if (it1 == section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			section_timeslot_1[day_1] = std::move(it2->second);
			section_timeslot_2.erase(it2);
		}
	}

	updateTeachersTimeslots(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
};

void ObjectiveFunction::evaluate(
    Bee& bee,
    std::unordered_set<int>& update_teachers,
    std::unordered_set<int>& update_sections,
    bool show_penalty,
    bool is_initial,
    int& work_week,
    int& max_teacher_work_load,
    int& break_time_duration) {
	// std::cout << "Evaluating ........" << std::endl;
	// print("titeng bee", bee.total_cost);

	int counter = 0;

	auto& teachers_timetable = bee.timetable.teachers_timeslots;

	if (is_initial) {
		bee.total_cost = 0;
	}

	for (const int& teacher_id : update_teachers) {
		// print("x teacher_id", teacher_id);
		auto it = teachers_timetable.find(teacher_id);

		if (!is_initial) {
			bee.total_cost -= bee.teacherViolations[teacher_id].class_timeslot_overlap;
			bee.total_cost -= bee.teacherViolations[teacher_id].teacher_have_no_break;
			bee.total_cost -= bee.teacherViolations[teacher_id].teacher_exceed_workload;
		}

		bee.resetTeacherViolation(teacher_id);

		if (it == teachers_timetable.end()) {
			continue;
		}

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id);

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (bee.timetable.teachers_class_count[day][teacher_id] > max_teacher_work_load) {
				bee.teacherViolations[teacher_id].teacher_exceed_workload++;
			}

			if (show_penalty) {
				print(YELLOW, "ff day", day, "size timeslot", timeslot.size(), RESET);
			}

			if (timeslot.size() == 0) {
				// print("no timeslot", teacher_id, day);
				continue;
			}

			auto it = timeslot.begin();
			auto nextIt = std::next(it);

			std::set<int> teacher_available_timeslot;

			int min = std::numeric_limits<int>::max();
			int max = 0;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (show_penalty) {
					print(BLUE, "teacher", teacher_id, day, "U timeslot", timeslot_key, class_count, BLUE_B, ++counter, RESET);
				}

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					for (int key = timeslot_key + 1; key < nextKey; ++key) {
						if (show_penalty) {
							print(MAGENTA_B, "teacher", teacher_id, day, "A timeslot", key, "value", class_count, RESET);
						}

						teacher_available_timeslot.insert(key);
					}
				}

				min = std::min(min, timeslot_key);
				max = std::max(max, timeslot_key);

				if (class_count > 1) {
					if (show_penalty) {
						print(RED, "teacher", teacher_id, "day", day, "timeslot", it->first, "value", class_count, RESET);
					}
					bee.teacherViolations[teacher_id].class_timeslot_overlap += class_count;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			if (bee.timetable.teachers_class_count[day][teacher_id] <= bee.timetable.teacher_break_threshold) {
				continue;
			}

			int middle = (min + max) / 2;
			int allowance = bee.timetable.default_class_duration;
			bool break_found = false;

			if (show_penalty) {
				// print("middle", middle, middle - allowance, middle + allowance);
			}

			for (int num : teacher_available_timeslot) {
				bool consecutive_found = true;

				// Check if there are 'consecutive_required' consecutive slots starting from 'num'
				for (int i = 0; i < break_time_duration; i++) {
					if (!teacher_available_timeslot.count(num + i)) {
						consecutive_found = false;
						break;
					}
				}

				if (consecutive_found) {
					// if (show_penalty) {
					// 	for (int i = 0; i < break_time_duration; i++) {
					// 		print("teacher", teacher_id, num + i);
					// 	}
					// }

					// Check if any of the consecutive slots are within the range of the allowance around the middle
					bool in_allowance_range = false;
					for (int i = 0; i < break_time_duration; i++) {
						if (middle - allowance <= num + i && num + i <= middle + allowance) {
							in_allowance_range = true;
							break;
						}
					}

					if (in_allowance_range) {
						break_found = true;
						break;
					}
				}
			}

			if (!break_found) {
				if (show_penalty) {
					print(GREEN_B, "teacher with no break", teacher_id, "day", day, RESET);
				}
				bee.teacherViolations[teacher_id].teacher_have_no_break++;
			}
		}

		if (show_penalty) {
			print("teacher", teacher_id);
			print("a", bee.teacherViolations[teacher_id].class_timeslot_overlap);
			print("a", bee.teacherViolations[teacher_id].teacher_have_no_break);
			print("a", bee.teacherViolations[teacher_id].teacher_exceed_workload);
		}

		bee.total_cost += bee.teacherViolations[teacher_id].class_timeslot_overlap;
		bee.total_cost += bee.teacherViolations[teacher_id].teacher_have_no_break;
		bee.total_cost += bee.teacherViolations[teacher_id].teacher_exceed_workload;
	}

	auto& sections_timetable = bee.timetable.schoolClasses;
	auto& section_class_start_end = bee.timetable.schoolClassStartEnd;
	auto& section_break_time = bee.timetable.section_break_timeslots;

	// print("--------------------", update_sections.size());
	// print("update sections", update_sections.size());
	// // print("update sections", update_sections.size());
	// // print("update sections", update_sections.size());
	// print("--------------------", update_sections.size());

	for (const int& section_id : update_sections) {
		auto it = sections_timetable.find(section_id);

		if (!is_initial) {
			bee.total_cost -= bee.sectionViolations[section_id].early_break;
			bee.total_cost -= bee.sectionViolations[section_id].small_break_gap;
			bee.total_cost -= bee.sectionViolations[section_id].late_break;
		}

		bee.resetSectionViolation(section_id);

		if (section_break_time[section_id].size() == 1) {
			// print("TITEEEEEEEEEEEEEEEE", section_id);

			int break_time = *section_break_time[section_id].begin();

			if (section_class_start_end[section_id][break_time].end > bee.timetable.section_total_duration[section_id] - bee.timetable.break_timeslot_allowance) {
				bee.sectionViolations[section_id].late_break++;
			}

			if (section_class_start_end[section_id][break_time].start < bee.timetable.break_timeslot_allowance) {
				bee.sectionViolations[section_id].early_break++;
			}
		} else {
			int first_break_time = *section_break_time[section_id].begin();
			int last_break_time = *section_break_time[section_id].rbegin();

			int first_start = section_class_start_end[section_id][first_break_time].start;
			int last_end = section_class_start_end[section_id][last_break_time].end;

			if (last_end > bee.timetable.section_total_duration[section_id] - bee.timetable.break_timeslot_allowance) {
				bee.sectionViolations[section_id].late_break++;
			}

			if (first_start < bee.timetable.break_timeslot_allowance) {
				bee.sectionViolations[section_id].early_break++;
			}

			// print("DD", section_id, last_end - first_start);

			if (last_end - first_start <= bee.timetable.break_timeslot_allowance) {
				bee.sectionViolations[section_id].small_break_gap++;
			}
		}

		// print("early_break", bee.sectionViolations[section_id].early_break);
		// print("small_break_gap", bee.sectionViolations[section_id].small_break_gap);
		// print("late_break", bee.sectionViolations[section_id].late_break);

		bee.total_cost += bee.sectionViolations[section_id].early_break;
		bee.total_cost += bee.sectionViolations[section_id].small_break_gap;
		bee.total_cost += bee.sectionViolations[section_id].late_break;
	}
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

void getResult(Bee& bee, int64_t* result) {
	int iter = 0;
	for (const auto& [grade, gradeMap] : bee.timetable.schoolClasses) {
		// std::cout << BLUE << "--------- - - Section: " << grade << RESET << std::endl;
		for (const auto& [timeslot, classMap] : gradeMap) {
			// std::cout << "size :  " << classMap.size() << std::endl;
			for (const auto& [day, schoolClass] : classMap) {
				int64_t packed = pack5IntToInt64(
				    grade,
				    schoolClass.subject_id,
				    schoolClass.teacher_id,
				    static_cast<int8_t>(timeslot),
				    day);
				// std::cout << "packed : " << packed << std::endl;

				result[iter] = packed;

				iter++;
			}
		}
	}
}

extern "C" {

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_class_block,
    int total_section,

    int32_t* section_subjects,
    int32_t* section_subject_duration,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* section_subject_units,

    int teacher_subjects_length,
    int beesPopulation,
    int beesEmployed,
    int beesOnlooker,
    int beesScout,
    int limit,
    int work_week,

    int max_teacher_work_load,
    int break_time_duration,
    int break_timeslot_allowance,
    int teacher_break_threshold,
    int min_classes_for_two_breaks,
    int default_class_duration,
    int result_buff_length,
    int64_t* result) {
	Timetable::reset();
	print(CYAN, "RESET", RESET);

	std::vector<int> section_with_segmented_timeslots;
	std::unordered_map<int, int> section_num_of_class_block;

	std::unordered_map<int16_t, int> class_num_of_subjects = {};

	Timetable::work_week = work_week;
	Timetable::break_time_duration = break_time_duration;
	Timetable::break_timeslot_allowance = break_timeslot_allowance;
	Timetable::teacher_break_threshold = teacher_break_threshold;
	Timetable::default_class_duration = default_class_duration;
	Timetable::initializeTeacherSet(num_teachers);
	Timetable::initializeSectionsSet(total_section);
	Timetable::section_num_breaks.resize(total_section);

	for (int i = 0; i < total_section; i++) {
		Timetable::section_start[i] = section_start[i];
	}

	for (int i = 0; i < teacher_subjects_length; i++) {
		if (teacher_subjects[i] == -1) continue;

		int16_t teacher, subject;
		teacher = static_cast<int16_t>(teacher_subjects[i] >> 16);
		subject = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
		Timetable::eligible_teachers_in_subject[subject].push_back(teacher);
	}

	// std::cout << "section_subjects_map" << std::endl;
	for (int i = 0; i < total_section_subjects; i++) {
		int16_t unpacked_first_section_subjects, unpacked_second_section_subjects;
		int16_t unpacked_first_section_subjects_units, unpacked_second_section_subjects_units;
		int16_t unpacked_first_section_subjects_duration, unpacked_second_section_subjects_duration;

		unpacked_first_section_subjects = static_cast<int16_t>(section_subjects[i] >> 16);
		unpacked_second_section_subjects = static_cast<int16_t>(section_subjects[i] & 0xFFFF);

		unpacked_first_section_subjects_units = static_cast<int16_t>(section_subject_units[i] >> 16);
		unpacked_second_section_subjects_units = static_cast<int16_t>(section_subject_units[i] & 0xFFFF);

		unpacked_first_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] >> 16);
		unpacked_second_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] & 0xFFFF);

		Timetable::section_subjects[unpacked_first_section_subjects].push_back(unpacked_second_section_subjects);

		std::cout << "a : " << unpacked_first_section_subjects << " b : " << unpacked_second_section_subjects << std::endl;

		Timetable::section_subjects_units[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_units, unpacked_second_section_subjects_units));
		Timetable::section_subjects_duration[unpacked_first_section_subjects][unpacked_first_section_subjects_duration] = unpacked_second_section_subjects_duration;

		section_num_of_class_block[unpacked_first_section_subjects] += unpacked_second_section_subjects_units == 0 ? work_week : unpacked_second_section_subjects_units;
	}

	std::cout << "section_with_segmented_timeslots" << std::endl;
	for (int i = 0; i < section_with_segmented_timeslots.size(); i++) {
		std::cout << section_with_segmented_timeslots[i] << " ";
	}
	std::cout << std::endl;
	std::cout << "section_with_segmented_timeslots end" << std::endl;

	std::cout << "section_subjects_units_map" << std::endl;
	for (auto it = Timetable::section_subjects_units.begin(); it != Timetable::section_subjects_units.end(); it++) {
		std::cout << it->first << " g: ";
		for (int i = 0; i < it->second.size(); i++) {
			std::cout << it->second[i].first << " h: " << it->second[i].second << " ";
		}

		std::cout << std::endl;
	}

	// cout all class_num_of_subjects
	std::cout
	    << "class_num_of_subjects" << std::endl;
	for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;
	}
	// std::cout << "class_num_of_subjects end" << std::endl;

	std::cout << " duplicated " << std::endl;
	for (int16_t i = 0; i < Timetable::section_subjects.size(); i++) {
		for (int j = 0; j < Timetable::section_subjects[i].size(); j++) {
			std::cout << Timetable::section_subjects[i][j] << " ";
		}

		std::cout << std::endl;
	}

	// std::cout << "class_timeslot_distributions" << std::endl;
	std::cout << "class_timeslot_distributions" << std::endl;

	// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
	for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;

		std::cout << " xx x xxxxxxxxxxxf : " << (((it->second + work_week - 1) / work_week)) << std::endl;
		int timeslots = (((it->second + work_week - 1) / work_week));
		int num_breaks = timeslots < min_classes_for_two_breaks ? 1 : 2;
		std::cout << "ehhe " << timeslots << " " << num_breaks << " " << timeslots + num_breaks << std::endl;
		Timetable::section_timeslot[it->first] = timeslots + num_breaks;
		// below 10 - 1, 2 equal or above

		Timetable::section_num_breaks[it->first] = num_breaks;
		total_class_block += num_breaks;
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

	Timetable::initializeRandomClassBlockDistribution(0, total_class_block - 1);
	Timetable::initializeRandomSectionDistribution(0, total_section - 1);
	Timetable::initializeRandomFieldDistribution(0, 2);
	Timetable::initializeRandomWorkDayDistribution(1, work_week);

	ObjectiveFunction optimizableFunction;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");

	Bee bestSolution(num_teachers);

	std::unordered_set<int> affected_teachers;
	std::unordered_set<int> affected_sections;

	affected_teachers.reserve(num_teachers);
	affected_sections.reserve(total_section);

	print(MAGENTA_B, " -- FIRSTTTTTTTTTTTTT -- ");
	bestSolution.timetable.initializeRandomTimetable(affected_teachers);
	// printSchoolClasses(bestSolution.timetable);
	optimizableFunction.evaluate(bestSolution, affected_teachers, Timetable::sections_set, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

	// affected_teachers.clear();
	// affected_sections.clear();

	// bestSolution.timetable.update(affected_teachers, affected_sections);

	// print(affected_sections.size(), " sections are affected.");

	// optimizableFunction.evaluate(bestSolution, affected_teachers, affected_sections, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	// affected_teachers.clear();
	// affected_sections.clear();
	// bestSolution.timetable.update(affected_teachers, affected_sections);
	// optimizableFunction.evaluate(bestSolution, affected_teachers, affected_sections, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	printSchoolClasses(bestSolution.timetable);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, bestSolution.total_cost, GREEN_B, " -- -- ", RESET);

	print("For dfffffffffffffffff.");
	// return;

	vector<Bee> beesVector(beesPopulation, Bee(num_teachers));

	for (int i = 0; i < beesPopulation; i++) {
		affected_teachers.clear();

		beesVector[i].timetable.initializeRandomTimetable(affected_teachers);

		optimizableFunction.evaluate(beesVector[i], affected_teachers, Timetable::sections_set, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

		print(beesVector[i].total_cost, "Fffff");
		if (beesVector[i].total_cost == 0) {
			print(RED, GREEN_BG, "JACKPOT ", i, beesVector[i].total_cost, " size ", RESET);
			printSchoolClasses(beesVector[i].timetable);
			print(RED, GREEN_BG, "JACKPOT ", i, beesVector[i].total_cost, " size ", RESET);
			// system("cls");
			// runExperiment(
			//     max_iterations,
			//     num_teachers,
			//     total_section_subjects,
			//     total_class_block,
			//     total_section,
			//     section_subjects,
			//     section_subject_duration,
			//     section_start,
			//     teacher_subjects,
			//     section_subject_units,
			//     teacher_subjects_length,
			//     beesPopulation,
			//     beesEmployed,
			//     beesOnlooker,
			//     beesScout,
			//     limit,
			//     work_week,
			//     max_teacher_work_load,
			//     break_time_duration,
			//     break_timeslot_allowance,
			//     teacher_break_threshold,
			//     min_classes_for_two_breaks,
			//     default_class_duration,
			//     result_buff_length,
			//     result);
			// getResult(beesVector[i], result);
			return;
		}

		if (beesVector[i].total_cost <= bestSolution.total_cost) {
			bestSolution = beesVector[i];
		}
	}

	vector<int> abandonedBees(beesPopulation, 0);
	std::unordered_set<int> above_limit_abandoned_bees;
	std::uniform_int_distribution<>
	    dist_bees_employed(0, beesEmployed - 1);

	int iteration_count = max_iterations;
	auto start = std::chrono::high_resolution_clock::now();

	for (int iter = 0; iter < max_iterations; iter++) {
		int total_cost = 0;

		for (int i = 0; i < beesEmployed; i++) {
			int randomBeesIndex;
			do {
				randomBeesIndex = dist_bees_employed(randomizer_engine);
			} while (randomBeesIndex == i);

			Bee newBee = beesVector[randomBeesIndex];

			affected_teachers.clear();
			affected_sections.clear();

			newBee.timetable.update(affected_teachers, affected_sections);
			optimizableFunction.evaluate(newBee, affected_teachers, affected_sections, false, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

			if (newBee.total_cost <= beesVector[i].total_cost) {
				beesVector[i] = newBee;
			} else {
				abandonedBees[i]++;

				if (abandonedBees[i] >= limit) {
					above_limit_abandoned_bees.insert(i);
				}
			}

			total_cost += beesVector[i].total_cost;
		}

		double averageCost = total_cost / beesEmployed;

		vector<double> fitnessValues(beesEmployed, 0);
		double fSum = 0;
		for (int i = 0; i < beesEmployed; i++) {
			fitnessValues[i] = exp(-beesVector[i].total_cost / averageCost);
			fSum += fitnessValues[i];
		}

		vector<double> prob(beesEmployed, 0);
		for (int i = 0; i < beesEmployed; i++) {
			prob[i] = fitnessValues[i] / fSum;
		}

		auto fitnessProportionateSelection = [&](const vector<double>& prob) {
			std::uniform_real_distribution<> dis(0.0, 1.0);
			double r = dis(randomizer_engine);
			double cumulative = 0.0;
			for (int i = 0; i < prob.size(); i++) {
				cumulative += prob[i];
				if (r <= cumulative) {
					return i;
				}
			}
			return static_cast<int>(prob.size() - 1);
		};

		for (int m = 0; m < beesOnlooker; m++) {
			int i = fitnessProportionateSelection(prob);

			int randomBeesIndex;
			do {
				randomBeesIndex = rand() % beesEmployed;
			} while (randomBeesIndex == i);

			Bee newBee = beesVector[randomBeesIndex];
			affected_teachers.clear();
			affected_sections.clear();

			newBee.timetable.update(affected_teachers, affected_sections);
			optimizableFunction.evaluate(newBee, affected_teachers, affected_sections, false, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

			if (newBee.total_cost <= beesVector[i].total_cost) {
				beesVector[i] = newBee;
			} else {
				abandonedBees[i]++;

				if (abandonedBees[i] >= limit) {
					above_limit_abandoned_bees.insert(i);
				}
			}
		}

		// #pragma omp parallel for
		for (int itScout = 0; itScout < beesScout; itScout++) {
			for (const int i : above_limit_abandoned_bees) {
				Bee newBee(num_teachers);
				affected_teachers.clear();

				newBee.timetable.initializeRandomTimetable(affected_teachers);

				beesVector[i] = newBee;
				optimizableFunction.evaluate(beesVector[i], affected_teachers, Timetable::sections_set, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

				abandonedBees[i] = 0;

				above_limit_abandoned_bees.erase(i);
			}
		}

		for (int i = 0; i < beesEmployed; i++) {
			if (beesVector[i].total_cost <= bestSolution.total_cost) {
				bestSolution = beesVector[i];
			}
		}

		if (bestSolution.total_cost == 0) {
			print(CYAN_BG, BOLD, "EARLY BREAK Best solution: cost ", bestSolution.total_cost, " at ", iter, RESET);
			iteration_count = iter;
			break;
		}
	}

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, bestSolution.total_cost, GREEN_B, " -- -- ", RESET);
	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);

	printSchoolClasses(bestSolution.timetable);

	optimizableFunction.evaluate(bestSolution, Timetable::teachers_set, Timetable::sections_set, false, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, bestSolution.total_cost, GREEN_B, " -- -- ", RESET);
	print(iteration_count == max_iterations ? RED_BG : CYAN_BG, BOLD, iteration_count == max_iterations ? "MAXIMUM ITERATIONS REACHED" : "EARLY BREAK Best solution: cost ", bestSolution.total_cost, " at ", iteration_count, RESET);
	int durationInSeconds = static_cast<int>(duration.count());

	int hours = durationInSeconds / 3600;           // 1 hour = 3600 seconds
	int minutes = (durationInSeconds % 3600) / 60;  // remaining seconds divided by 60 to get minutes
	int seconds = durationInSeconds % 60;           // remaining seconds after hours and minutes

	print("Time taken: ", duration.count(), "seconds");
	print("Time taken: ", hours, ":", minutes, ":", seconds);
	// runExperiment(
	//     max_iterations,
	//     num_teachers,
	//     total_section_subjects,
	//     total_class_block,
	//     total_section,
	//     section_subjects,
	//     section_subject_duration,
	//     section_start,
	//     teacher_subjects,
	//     section_subject_units,
	//     teacher_subjects_length,
	//     beesPopulation,
	//     beesEmployed,
	//     beesOnlooker,
	//     beesScout,
	//     limit,
	//     work_week,
	//     max_teacher_work_load,
	// 	   break_time_duration,
	//     break_timeslot_allowance,
	//	   teacher_break_threshold,
	//     min_classes_for_two_breaks,
	//     default_class_duration,
	//     result_buff_length,
	//     result);

	getResult(bestSolution, result);
	return;
}
}
