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
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <random>
#include <set>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

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
#define RESET "\033[0m"

using namespace std;

// #define TEST_MODE
#define _DEBUG

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
		std::cout << std::endl;
	}
}

void printSchoolClasses(const std::unordered_map<int16_t, std::map<int, std::unordered_map<int, SchoolClass>>>& schoolClasses) {
	for (const auto& [grade, gradeMap] : schoolClasses) {
		std::cout << BLUE << "--------- - - Section: " << grade << RESET << std::endl;
		for (const auto& [timeslot, classMap] : gradeMap) {
			// std::cout << "size :  " << classMap.size() << std::endl;
			for (const auto& [day, schoolClass] : classMap) {
				std::cout << GREEN << "Timeslot: " << std::setw(3) << timeslot << RESET;
				std::cout << YELLOW << "  d: " << std::setw(3) << day << RESET;
				std::cout << RED << "  s : " << std::setw(3) << schoolClass.subject_id << RESET;
				std::cout << MAGENTA << "  t : " << std::setw(3) << schoolClass.teacher_id << RESET << std::endl;
			}
		}
	}

	std::cout << std::endl;
}

std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> Timetable::section_subjects_units;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::section_subjects_duration;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::eligible_teachers_in_subject;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::section_subjects;
std::unordered_map<int16_t, int> Timetable::section_timeslot;
std::unordered_map<int16_t, int> Timetable::section_start;
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
	work_week = 0;
	break_time_duration = 0;

	// Reinitialize the distributions with default ranges
	initializeRandomClassBlockDistribution(0, 0);
	initializeRandomSectionDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
}

void Timetable::initializeTeachersClass(int teachers) {
	teachers_class_count.resize(teachers);

	for (int i = 0; i < teachers; ++i) {
		teachers_class_count[i] = 0;
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
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
    bool is_skipping_between,
    int16_t random_section,
    bool is_reset) {

	// print("a", is_reset);
	int start = Timetable::section_start[random_section];
	for (auto it = schoolClasses[random_section].begin(); it != itUp; ++it) {
		// print(" x ", it->first);

		auto& day_schedule = schoolClasses[random_section][it->first];
		auto day_zero = day_schedule.find(0);

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;
			int duration = (subject == -1) ? Timetable::break_time_duration : Timetable::section_subjects_duration[random_section][subject];

			int teacher = day_zero->second.teacher_id;

			if (subject != -1 && it->first >= itLow->first) {
				auto& teacher_timeslot = teachers_timeslots[teacher];
				for (int i = 1; i <= Timetable::work_week; ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							// print(is_reset, "is reset", teacher, i, j + start);
							if (--teacher_timeslot[i][j + start] <= 0) {
								// can i use: std::optional<T>::swap on this

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
			// 0167 10
			start += duration;
		} else {
			int max_duration = 0;

			for (const auto& day : it->second) {
				int subject = day.second.subject_id;
				int duration = Timetable::section_subjects_duration[random_section][subject];
				max_duration = std::max(max_duration, duration);
				int teacher = day.second.teacher_id;
				auto& teacher_timeslot = teachers_timeslots[teacher];

				if (it->first < itLow->first) {
					continue;
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

			start += max_duration;
		}
	}
}

void Timetable::initializeRandomTimetable() {
	for (const auto& entry : section_subjects) {
		int16_t section_id = entry.first;
		std::vector<int16_t> random_subjects = entry.second;

		std::map<int, int> timeslots;
		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		std::shuffle(random_subjects.begin(), random_subjects.end(), randomizer_engine);

		int total_duration = 0;

		const auto& units_map = Timetable::section_subjects_units[section_id];

		for (const auto& subject_id : random_subjects) {
			if (units_map.at(subject_id).second == 0) {
				full_week_day_subjects.push_back(subject_id);
				total_duration += Timetable::section_subjects_duration[section_id][subject_id];
			} else {
				special_unit_subjects.push_back(subject_id);
			}
		}

		std::vector<int> timeslot_keys;
		for (int i = 0; i < Timetable::section_timeslot[section_id]; ++i) {
			timeslots[i] = Timetable::work_week;
			timeslot_keys.push_back(i);
		}

		// std::shuffle(timeslot_keys.begin(), timeslot_keys.end(), randomizer_engine);
		std::shuffle(std::begin(timeslot_keys), std::end(timeslot_keys), randomizer_engine);

		// print("fasjkdljf", timeslot_keys.size(), "Fcv", full_week_day_subjects.size(), "Fcv", special_unit_subjects.size(), "Fcv");
		for (const auto& subject_id : full_week_day_subjects) {
			std::uniform_int_distribution<> dis(0, Timetable::eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher = Timetable::eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];

			teachers_class_count[random_teacher]++;

			int timeslot_key = timeslot_keys.back();
			timeslot_keys.pop_back();
			schoolClasses[section_id][timeslot_key][0] = SchoolClass{subject_id, random_teacher};

			timeslots.erase(timeslot_key);
		}

		// print("after ", timeslot_keys.size(), "Fcv");

		int day = 1;
		// print(" -ffffffff- - - ff--  -- -");
		for (const auto& subject_id : special_unit_subjects) {
			// print(BLUE, "W H A T", RESET);
			std::uniform_int_distribution<> dis(0, Timetable::eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher = Timetable::eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
			int16_t num_unit = units_map.at(subject_id).second;

			teachers_class_count[random_teacher]++;

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

		// print(" - break time ", timeslot_keys.size(), " - break time ", RESET);
		for (const auto& timeslot : timeslot_keys) {
			// print(RED, " - break time ", timeslot, " - break time ", RESET);
			if (timeslots[timeslot] == Timetable::work_week) {
				schoolClasses[section_id][timeslot][0] = SchoolClass{-1, -1};
			}
		}

		// print("updating teachers");
		updateTeachersTimeslots(schoolClasses[section_id].begin(), schoolClasses[section_id].end(), false, section_id, false);
	}
}

int getRandomInRange(int n) {
	// print("section timeslot", n);
	std::uniform_int_distribution<int> distribution(0, n);
	// print("v", distribution(engine));
	return distribution(randomizer_engine);
}

void Timetable::update() {
	int16_t choice = Timetable::random_field(randomizer_engine);
	int16_t random_section;
	int random_timeslot_1;
	int random_timeslot_2;

	// print(RED, "choice ", choice, RESET);

	// getting random section
	if (choice == 2) {
		return;
		// std::cout << GREEN << "CHOICE 2" << RESET << std::endl;
		print("size", section_segmented_timeslot.size());

		if (section_segmented_timeslot.size() == 0) {
			std::uniform_int_distribution<> dis(0, 1);
			random_section = Timetable::random_section(randomizer_engine);
			choice = dis(randomizer_engine);
		} else {
			print("eh ?");
			std::uniform_int_distribution<> dis(0, section_segmented_timeslot.size() - 1);
			auto it = section_segmented_timeslot.begin();
			std::advance(it, dis(randomizer_engine));

			random_section = it->first;
			print("random fffffffsection ", random_section);
		}

	} else {
		random_section = Timetable::random_section(randomizer_engine);
	}

	// getting random timeslot
	if (choice == 0) {
		random_timeslot_1 = getRandomInRange(section_timeslot[random_section] - 1);

		do {
			random_timeslot_2 = getRandomInRange(section_timeslot[random_section] - 1);
		} while (random_timeslot_1 == random_timeslot_2);
	} else if (choice == 1) {
		random_timeslot_1 = getRandomInRange(section_timeslot[random_section] - 1);
		random_timeslot_2 = random_timeslot_1;
	} else if (choice == 2) {
		std::vector<int16_t> timeslots;

		for (const auto& entry : section_segmented_timeslot[random_section]) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);

		int timeslot_index_1 = dis2(randomizer_engine);
		int timeslot_index_2 = dis2(randomizer_engine);

		random_timeslot_1 = timeslots[timeslot_index_1];
		random_timeslot_2 = timeslots[timeslot_index_2];
	}

	auto itLow = schoolClasses[random_section].lower_bound(std::min(random_timeslot_1, random_timeslot_2));
	auto itUp = schoolClasses[random_section].upper_bound(std::max(random_timeslot_1, random_timeslot_2));

	// print(schoolClasses[random_section][random_timeslot_1])

	// print("Updating teachers timeslots", random_section, random_timeslot_1, random_timeslot_2, itLow->first, std::prev(itUp)->first);

	int16_t random_timeslot_1_max_duration = 0;
	int16_t random_timeslot_2_max_duration = 0;

	// Compute max duration for random_timeslot_1
	if (auto itLowDayZero = schoolClasses[random_section][itLow->first].find(0); itLowDayZero != schoolClasses[random_section][itLow->first].end()) {
		int subject = itLowDayZero->second.subject_id;
		random_timeslot_1_max_duration = (subject == -1) ? Timetable::break_time_duration : section_subjects_duration[random_section][subject];
	} else {
		for (const auto& day : itLow->second) {
			if (day.second.subject_id != -1) {
				random_timeslot_1_max_duration = std::max(random_timeslot_1_max_duration, section_subjects_duration[random_section][day.second.subject_id]);
			}
		}
	}

	auto itUpPrev = std::prev(itUp);
	if (auto itUpDayZero = schoolClasses[random_section][itUpPrev->first].find(0); itUpDayZero != schoolClasses[random_section][itUpPrev->first].end()) {
		int subject = itUpDayZero->second.subject_id;
		random_timeslot_2_max_duration = (subject == -1) ? Timetable::break_time_duration : section_subjects_duration[random_section][subject];
	} else {
		for (const auto& day : itUpPrev->second) {
			if (day.second.subject_id != -1) {
				random_timeslot_2_max_duration = std::max(random_timeslot_2_max_duration, section_subjects_duration[random_section][day.second.subject_id]);
			}
		}
	}

	bool is_skipping_between = (random_timeslot_1_max_duration == random_timeslot_2_max_duration);

	// if (!is_skipping_between) {
	// 	print("HA");
	// 	std::exit(1);
	// }

	// print("he", itLow->first, itUpPrev->first);
	updateTeachersTimeslots(itLow, itUp, is_skipping_between, random_section, true);

	auto& section = schoolClasses[random_section];

	// print("choice", choice);
	// print("choice", choice);

	if (choice == 0) {
		// swapping of classes between timeslots in the same section

		// std::cout << "swapping " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;

		std::swap(section[random_timeslot_1], section[random_timeslot_2]);

		auto& timeslot_set = section_segmented_timeslot[random_section];

		if (timeslot_set.count(random_timeslot_1) > 0 && timeslot_set.count(random_timeslot_2) > 0) {
			// return;
		} else if (timeslot_set.count(random_timeslot_1) > 0 && timeslot_set.count(random_timeslot_2) == 0) {
			timeslot_set.erase(random_timeslot_1);
			timeslot_set.insert(random_timeslot_2);

		} else if (timeslot_set.count(random_timeslot_2) > 0 && timeslot_set.count(random_timeslot_1) == 0) {
			timeslot_set.erase(random_timeslot_2);
			timeslot_set.insert(random_timeslot_1);
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

				teachers_class_count[old_teacher]--;
				teachers_class_count[random_teacher]++;

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

				teachers_class_count[old_teacher]--;
				teachers_class_count[random_teacher]++;

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- workday : " << static_cast<int>(workday) << " Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
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

		// can i use: std::optional<T>::swap on this

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

	updateTeachersTimeslots(itLow, itUp, is_skipping_between, random_section, false);
};

int ObjectiveFunction::evaluate(
    Timetable& timetable,
    bool show_penalty,
    int& work_week,
    int& max_teacher_work_load,
    int& break_time_duration) {
	int class_timeslot_overlap = 0;
	int teacher_have_no_break = 0;
	int teacher_exceed_workload = 0;

	// std::cout << "Evaluating ........" << std::endl;

	int counter = 0;
	for (const auto& [teacher_id, days] : timetable.teachers_timeslots) {
		// print("teacher", teacher_id, days.size());
		// if (timetable.teachers_class_count[teacher_id] > max_teacher_work_load) {
		// 	teacher_exceed_workload++;
		// }

		for (const auto& [day, timeslot] : days) {
			if (show_penalty) {
				// print(YELLOW, "size timeslot", timeslot.size(), RESET);
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
					class_timeslot_overlap += class_count;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			// if (timetable.teachers_class_count[teacher_id] <= 4) {
			// 	if (show_penalty) {
			// 		print("no need to check teacher's break", teacher_id, "class count", timetable.teachers_class_count[teacher_id]);
			// 	}

			// 	continue;
			// }

			int middle = (min + max) / 2;
			int allowance = 4;
			bool is_there_break = false;

			if (show_penalty) {
				// print("middle", middle, middle - allowance, middle + allowance);
			}

			// This only find the first occurence of consecutive slots
			// !! TO DO future: check all the consecutive slots !!
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
					if (show_penalty) {
						for (int i = 0; i < break_time_duration; i++) {
							print("teacher", teacher_id, num + i);
						}
					}

					// Check if any of the consecutive slots are within the range of the allowance around the middle
					bool in_allowance_range = false;
					for (int i = 0; i < break_time_duration; i++) {
						if (middle - allowance <= num + i && num + i <= middle + allowance) {
							in_allowance_range = true;
							break;
						}
					}

					if (in_allowance_range) {
						is_there_break = true;
						break;
					}
				}

				// if (show_penalty) {
				// 	print("teacher", teacher_id, num, num + 1, num + 2);
				// }

				// if (teacher_available_timeslot.count(num + 1) && teacher_available_timeslot.count(num + 2)) {
				// 	if (show_penalty) {
				// 		// print(BLACK_B, "hehe");
				// 	}
				// 	if ((middle - allowance <= num && num <= middle + allowance) ||
				// 	    (middle - allowance <= num + 1 && num + 1 <= middle + allowance) ||
				// 	    (middle - allowance <= num + 2 && num + 2 <= middle + allowance)) {
				// 		is_there_break = true;
				// 		break;
				// 	}
				// }
			}

			if (!is_there_break) {
				if (show_penalty) {
					print(GREEN_B, "teacher with no break", teacher_id, "day", day, RESET);
				}
				teacher_have_no_break++;
			}
		}
	}

	if (show_penalty) {
		print(GREEN, "--------------------------------", RESET);
		print(GREEN, "Cost: ", "class_timeslot_overlap", class_timeslot_overlap);
		print(GREEN, "Cost: ", "teacher_have_no_break", teacher_have_no_break);
		print(GREEN, "Cost: ", "teacher_exceed_workload", teacher_exceed_workload);
		print(GREEN, "--------------------------------", RESET);
	}

	return class_timeslot_overlap + teacher_have_no_break + teacher_exceed_workload;
	// return teacher_exceed_workload;
	// return teacher_have_no_break;
	// return class_timeslot_overlap;
};
;

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
    int result_buff_length,
    int64_t* result) {
	Timetable::reset();
	print(CYAN, "RESET", RESET);

	std::vector<int> section_with_segmented_timeslots;
	std::unordered_map<int, int> section_num_of_class_block;
	std::unordered_map<int, int> section_num_breaks;

	std::unordered_map<int16_t, int> class_num_of_subjects = {};

	Timetable::work_week = work_week;
	Timetable::break_time_duration = break_time_duration;

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
		int num_breaks = timeslots < 10 ? 1 : 2;
		std::cout << "ehhe " << timeslots << " " << num_breaks << " " << timeslots + num_breaks << std::endl;
		Timetable::section_timeslot[it->first] = timeslots + num_breaks;
		// below 10 - 1, 2 equal or above

		section_num_breaks[it->first] = num_breaks;
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

	Bee bestSolution;
	bestSolution.timetable.initializeTeachersClass(num_teachers);
	print("cc.");
	// bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration;
	// printSchoolClasses(bestSolution.timetable.schoolClasses);

	// DEBUGGING
	// return;

	std::cout << "FIRSTTTTTTTTTTTTT" << std::endl;
	// bestSolution.timetable.update();
	// bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	bestSolution.timetable.initializeRandomTimetable();
	// printSchoolClasses(bestSolution.timetable.schoolClasses);
	// bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	bestSolution.timetable.update();
	
	printSchoolClasses(bestSolution.timetable.schoolClasses);
	bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

	// std::cout << bestSolution.cost << std::endl;
	// printSchoolClasses(bestSolution.timetable.schoolClasses);
	std::cout << "FIRSTTTTTTTTTTTTT" << std::endl;

	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;
	// return;

	print("For dfffffffffffffffff.");
	print("For dfffffffffffffffff.");

	if (bestSolution.cost == 0) {
		std::cout << RED << "JACKPOT FIRST TIME BRUH" << bestSolution.cost << " size " << RESET << endl;
		printSchoolClasses(bestSolution.timetable.schoolClasses);
		std::cout << RED << "JACKPOT FIRST TIME BRUH" << bestSolution.cost << " size " << RESET << endl;
		system("cls");
		runExperiment(
		    max_iterations,
		    num_teachers,
		    total_section_subjects,
		    total_class_block,
		    total_section,
		    section_subjects,
		    section_subject_duration,
		    section_start,
		    teacher_subjects,
		    section_subject_units,
		    teacher_subjects_length,
		    beesPopulation,
		    beesEmployed,
		    beesOnlooker,
		    beesScout,
		    limit,
		    work_week,
		    max_teacher_work_load,
		    break_time_duration,
		    result_buff_length,
		    result);

		return;
	}

	auto start = std::chrono::high_resolution_clock::now();

	vector<Bee> beesVector(beesPopulation, Bee());

	for (int i = 0; i < beesPopulation; i++) {
		beesVector[i].timetable.initializeTeachersClass(num_teachers);
		beesVector[i].timetable.initializeRandomTimetable();

		beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

		if (beesVector[i].cost == 0) {
			std::cout << RED << "JACKPOT " << i << " " << beesVector[i].cost << " size " << RESET << endl;
			printSchoolClasses(beesVector[i].timetable.schoolClasses);
			std::cout << RED << "JACKPOT " << i << " " << beesVector[i].cost << " size " << RESET << endl;
			system("cls");
			runExperiment(
			    max_iterations,
			    num_teachers,
			    total_section_subjects,
			    total_class_block,
			    total_section,
			    section_subjects,
			    section_subject_duration,
			    section_start,
			    teacher_subjects,
			    section_subject_units,
			    teacher_subjects_length,
			    beesPopulation,
			    beesEmployed,
			    beesOnlooker,
			    beesScout,
			    limit,
			    work_week,
			    max_teacher_work_load,
			    break_time_duration,
			    result_buff_length,
			    result);

			return;
		}

		if (beesVector[i].cost <= bestSolution.cost) {
			bestSolution = beesVector[i];
		}
	}

	vector<int> abandonedBees(beesPopulation, 0);
	std::uniform_int_distribution<> dist_bees_employed(0, beesEmployed - 1);

	for (int iter = 0; iter < max_iterations; iter++) {
		// #pragma omp parallel for
		for (int i = 0; i < beesEmployed; i++) {
			int randomBeesIndex;
			do {
				randomBeesIndex = dist_bees_employed(randomizer_engine);
			} while (randomBeesIndex == i);

			Bee newBee;
			newBee = beesVector[randomBeesIndex];

			// std::cout << YELLOW << "update and evaluate " << RESET << endl;
			// print("Before");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.timetable.update();
			// print("After");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

			// #pragma omp critical
			{
				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}
		}

		double averageCost = 0;
		for (int i = 0; i < beesEmployed; i++) {
			averageCost += beesVector[i].cost;
		}
		averageCost /= beesEmployed;

		vector<double> fitnessValues(beesEmployed, 0);
		double fSum = 0;
		for (int i = 0; i < beesEmployed; i++) {
			fitnessValues[i] = exp(-beesVector[i].cost / averageCost);
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

		// #pragma omp parallel for
		for (int m = 0; m < beesOnlooker; m++) {
			int i = fitnessProportionateSelection(prob);

			int randomBeesIndex = rand() % beesEmployed;
			while (randomBeesIndex == i) {
				randomBeesIndex = rand() % beesEmployed;
			}

			Bee newBee;
			newBee = beesVector[randomBeesIndex];
			// std::cout << YELLOW << "update and evaluate " << RESET << endl;
			// print("Before");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.timetable.update();
			// print("After");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

			// #pragma omp critical
			{
				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}
		}

		// #pragma omp parallel for
		for (int itScout = 0; itScout < beesScout; itScout++) {
			for (int i = 0; i < beesEmployed; i++) {
				if (abandonedBees[i] >= limit) {
					Bee newBee;
					newBee.timetable.initializeTeachersClass(num_teachers);
					newBee.timetable.initializeRandomTimetable();

					beesVector[i] = newBee;
					beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);

					abandonedBees[i] = 0;
				}
			}
		}

		for (int i = 0; i < beesEmployed; i++) {
			if (beesVector[i].cost <= bestSolution.cost) {
				bestSolution = beesVector[i];
			}
		}

		// halt if cost is 0
		if (bestSolution.cost == 0) {
			std::cout << "EARLY BREAK Best solution: cost " << bestSolution.cost << " at " << iter << endl;
			// optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
			break;
		}
	}

	std::cout << "Best solution: cost " << bestSolution.cost << " size " << endl;

	printSchoolClasses(bestSolution.timetable.schoolClasses);
	optimizableFunction.evaluate(bestSolution.timetable, true, Timetable::work_week, max_teacher_work_load, Timetable::break_time_duration);
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	print("Time taken: ", duration.count(), "milliseconds");

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
	//     result_buff_length,
	//     result);

	// return;

	// for (int i = 0; i < result_buff_length; i++) {
	// 	int64_t packed = pack5IntToInt64(
	// 	    bestSolution.timetable.schoolClasses[i].section_id,
	// 	    bestSolution.timetable.schoolClasses[i].subject_id,
	// 	    bestSolution.timetable.schoolClasses[i].teacher_id,
	// 	    static_cast<int8_t>(bestSolution.timetable.schoolClasses[i].timeslot),
	// 	    bestSolution.timetable.schoolClasses[i].day);
	// 	// std::cout << "packed : " << packed << std::endl;

	// 	result[i] = packed;
	// }
}
}
