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

#define RESET "\033[0m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN "\033[36m"
#define WHITE "\033[37m"

using namespace std;

// #define TEST_MODE
#define _DEBUG

std::default_random_engine engine(std::chrono::system_clock::now().time_since_epoch().count());

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

void Timetable::initializeTeachersClass(int teachers, int work_week, int num_time_fragment) {
	teachers_class_count.resize(teachers);
	for (int i = 0; i < teachers; ++i) {
		teachers_class_count[i] = 0;
	}
}

void Timetable::initializeRandomTimetable(
    std::mt19937& gen,
    int& work_week,
    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
    std::unordered_map<int16_t, int>& section_timeslot,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
    std::unordered_map<int16_t, int>& section_start_map,
    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
    std::uniform_int_distribution<int8_t>& random_workday) {
	for (const auto& entry : section_subjects) {
		int16_t section_id = entry.first;
		std::vector<int16_t> random_subjects = entry.second;
		int16_t num_subjects = static_cast<int16_t>(random_subjects.size());

		std::map<int, int> timeslots;
		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
		std::default_random_engine engine(seed);
		std::shuffle(random_subjects.begin(), random_subjects.end(), engine);

		const auto& units_map = section_subjects_units_map[section_id];

		for (const auto& subject_id : random_subjects) {
			if (units_map.at(subject_id).second == 0) {
				full_week_day_subjects.push_back(subject_id);
			} else {
				special_unit_subjects.push_back(subject_id);
			}
		}

		// TODO: MORE RANDOMNESS, ONLY USE RANDOM_SUBJECTS, DON'T SEPARATE

		std::vector<int> timeslot_keys;
		for (int i = section_timeslot[section_id]; i >= 0; --i) {
			timeslots[i] = work_week;
			timeslot_keys.push_back(i);
		}

		int start = section_start_map[section_id];

		for (const auto& subject_id : full_week_day_subjects) {
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher = eligible_teachers_in_subject[subject_id][dis(engine)];

			teachers_class_count[random_teacher]++;

			int timeslot = timeslot_keys.back();
			timeslot_keys.pop_back();
			schoolClasses[section_id][timeslot][0] = SchoolClass{subject_id, random_teacher};

			int duration = section_subjects_duration_map[section_id][subject_id];

			for (int i = 1; i <= work_week; ++i) {
				for (int j = 0; j < duration; ++j) {
					teachers_timeslots[random_teacher][i][j + start]++;
				}
			}

			start += duration;
			timeslots.erase(timeslot);
		}

		int day = 1;
		for (const auto& subject_id : special_unit_subjects) {
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher = eligible_teachers_in_subject[subject_id][dis(engine)];
			int16_t num_unit = units_map.at(subject_id).second;

			teachers_class_count[random_teacher]++;

			int duration = section_subjects_duration_map[section_id][subject_id];

			for (int iter = 1; iter <= num_unit; ++iter) {
				auto it = std::find_if(timeslot_keys.rbegin(), timeslot_keys.rend(),
				                       [&timeslots](int key) { return timeslots[key] > 0; });

				if (it == timeslot_keys.rend()) break;

				int timeslot = *it;

				schoolClasses[section_id][timeslot][day] = SchoolClass{subject_id, random_teacher};

				for (int j = 0; j < duration; ++j) {
					teachers_timeslots[random_teacher][day][j + start]++;
				}

				section_segmented_timeslot[section_id].insert(timeslot);

				if (--timeslots[timeslot] == 0) {
					auto regularIt = it.base();
					timeslot_keys.erase(--regularIt);
					timeslots.erase(timeslot);
					start += duration;
				}

				if (++day > work_week) day = 1;
			}
		}

		for (const auto& timeslot : timeslot_keys) {
			if (timeslots[timeslot] == work_week) {
				schoolClasses[section_id][timeslot][0] = SchoolClass{-1, -1};
			}
		}
	}
};

int getRandomInRange(int n) {
	std::uniform_int_distribution<int> distribution(0, n);
	return distribution(engine);
}

void Timetable::updateTeachersTimeslots(
    std::unordered_map<int16_t, int>& section_start_map,
    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
    bool is_skipping_between,
    int random_timeslot_1,
    int random_timeslot_2,
    int16_t random_section,
    int work_week,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);
	// print("a", random_timeslot_1_max_duration, random_timeslot_2_max_duration, is_skipping_between);
	int start = section_start_map[random_section];
	for (auto it = schoolClasses[random_section].begin(); it != itUp; ++it) {
		// print(" x ", it->first);

		if (it->first == itLow->first + 1 && is_skipping_between) {
			// print("ff", it->first);
			it = itUpPrev;
		}

		auto& day_schedule = schoolClasses[random_section][it->first];
		auto day_zero = day_schedule.find(0);

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;
			int teacher = day_zero->second.teacher_id;
			int duration = (subject == -1) ? 3 : section_subjects_duration_map[random_section][subject];

			if (subject != -1 && it->first >= itLow->first) {
				for (int i = 1; i <= work_week; ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							if (--teachers_timeslots[teacher][i][j + start] <= 0) {
								teachers_timeslots[teacher][i].erase(j + start);

								if (teachers_timeslots[teacher][i].empty()) {
									teachers_timeslots[teacher].erase(i);
								}
							};
						} else {
							teachers_timeslots[teacher][i][j + start]++;
						}
					}
				}
			};

			start += duration;
		} else {
			int max_duration = 0;

			for (const auto& day : it->second) {
				int subject = day.second.subject_id;
				int teacher = day.second.teacher_id;
				int duration = section_subjects_duration_map[random_section][subject];
				max_duration = std::max(max_duration, duration);

				if (it->first < itLow->first) {
					continue;
				}

				for (int j = 0; j < duration; ++j) {
					if (is_reset) {
						if (--teachers_timeslots[teacher][day.first][start + j] <= 0) {
							teachers_timeslots[teacher][day.first].erase(start + j);

							if (teachers_timeslots[teacher][day.first].empty()) {
								teachers_timeslots[teacher].erase(day.first);
							}
						}
					} else {
						teachers_timeslots[teacher][day.first][start + j]++;
					}
				}
			}

			start += max_duration;
		}
	}
}

void Timetable::update(std::mt19937& gen,
                       int& work_week,
                       std::uniform_int_distribution<int16_t>& distribution_field,
                       std::unordered_map<int16_t, int>& section_timeslot,
                       std::unordered_map<int16_t, int>& section_start_map,
                       std::uniform_int_distribution<int16_t>& distribution_section,
                       std::uniform_int_distribution<int8_t>& random_workday,
                       std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
                       std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
                       std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
                       std::vector<int>& section_with_segmented_timeslots) {
	int16_t choice = distribution_field(gen);
	int16_t random_section;
	int random_timeslot_1;
	int random_timeslot_2;

	// getting random section
	if (choice == 2) {
		// std::cout << GREEN << "CHOICE 2" << RESET << std::endl;

		if (section_with_segmented_timeslots.size() == 0) {
			std::uniform_int_distribution<> dis(0, 1);
			random_section = distribution_section(gen);
			choice = dis(gen);
		} else {
			std::uniform_int_distribution<> dis(0, section_with_segmented_timeslots.size() - 1);
			int index = dis(gen);
			random_section = section_with_segmented_timeslots[index];
		}

	} else {
		random_section = distribution_section(gen);
	}

	// getting random timeslot
	if (choice == 0) {
		random_timeslot_1 = getRandomInRange(section_timeslot[random_section]);
		random_timeslot_2;

		do {
			random_timeslot_2 = getRandomInRange(section_timeslot[random_section]);
		} while (random_timeslot_1 == random_timeslot_2);
	} else if (choice == 1) {
		random_timeslot_1 = getRandomInRange(section_timeslot[random_section]);
		random_timeslot_2 = random_timeslot_1;
	} else if (choice == 2) {
		std::vector<int16_t> timeslots;

		for (const auto& entry : section_segmented_timeslot[random_section]) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);

		int timeslot_index_1 = dis2(gen);
		int timeslot_index_2 = dis2(gen);

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
		random_timeslot_1_max_duration = (subject == -1) ? 3 : section_subjects_duration_map[random_section][subject];
	} else {
		for (const auto& day : itLow->second) {
			if (day.second.subject_id != -1) {
				random_timeslot_1_max_duration = std::max(random_timeslot_1_max_duration, section_subjects_duration_map[random_section][day.second.subject_id]);
			}
		}
	}

	auto itUpPrev = std::prev(itUp);
	if (auto itUpDayZero = schoolClasses[random_section][itUpPrev->first].find(0); itUpDayZero != schoolClasses[random_section][itUpPrev->first].end()) {
		int subject = itUpDayZero->second.subject_id;
		random_timeslot_2_max_duration = (subject == -1) ? 3 : section_subjects_duration_map[random_section][subject];
	} else {
		for (const auto& day : itUpPrev->second) {
			if (day.second.subject_id != -1) {
				random_timeslot_2_max_duration = std::max(random_timeslot_2_max_duration, section_subjects_duration_map[random_section][day.second.subject_id]);
			}
		}
	}

	bool is_skipping_between = (random_timeslot_1_max_duration == random_timeslot_2_max_duration);

	updateTeachersTimeslots(section_start_map, section_subjects_duration_map, itLow, itUp, is_skipping_between, random_timeslot_1, random_timeslot_2, random_section, work_week, true);

	auto& section = schoolClasses[random_section];

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
					random_teacher = eligible_teachers_in_subject[subject_id][dis(gen)];
				} while (random_teacher == old_teacher && eligible_teachers_in_subject[subject_id].size() > 1);

				teachers_class_count[old_teacher]--;
				teachers_class_count[random_teacher]++;

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- zero day :" << "Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
				section_timeslot[0] = SchoolClass{subject_id, random_teacher};
			};
		} else {
			int8_t workday = random_workday(gen);
			int16_t subject_id = section_timeslot[workday].subject_id;
			int16_t old_teacher = section_timeslot[workday].teacher_id;
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

			if (subject_id != -1) {
				int16_t random_teacher;

				do {
					random_teacher = eligible_teachers_in_subject[subject_id][dis(gen)];
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
			day_1 = random_workday(gen);
			day_2 = random_workday(gen);
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

	updateTeachersTimeslots(section_start_map, section_subjects_duration_map, itLow, itUp, is_skipping_between, random_timeslot_1, random_timeslot_2, random_section, work_week, false);
};

int ObjectiveFunction::evaluate(
    Timetable& timetable,
    bool show_penalty,
    int& work_week,
    std::unordered_map<int16_t, int>& section_start_map,
    std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>>& section_subjects_duration_map,
    int& max_teacher_work_load) {
	int class_timeslot_overlap = 0;
	int teacher_have_no_break = 0;
	int teacher_exceed_workload = 0;

	// std::cout << "Evaluating ........" << std::endl;
	for (auto& [teacher_id, days] : timetable.teachers_timeslots) {
		if (timetable.teachers_class_count[teacher_id] > max_teacher_work_load) {
			teacher_exceed_workload++;
		}

		// print("teacher", teacher_id);

		for (auto& [day, timeslot] : days) {
			// print("size timeslot", timeslot.size());

			if (timeslot.size() == 0) {
				// print("no timeslot", teacher_id, day);
				continue;
			}

			auto it = timeslot.begin();
			auto nextIt = std::next(it);

			std::set<int> teacher_available_timeslot;

			int min, max;

			while (it != timeslot.end()) {
				int currentKey = it->first;

				if (show_penalty) {
					print("teacher", teacher_id, day, "timeslot", currentKey, it->second);
				}

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					for (int key = currentKey + 1; key < nextKey; ++key) {
						if (show_penalty) {
							print(GREEN, "teacher", teacher_id, day, "timeslot", key, "value", it->second, RESET);
						}
						
						teacher_available_timeslot.insert(key);
					}
				}

				min = std::min(min, currentKey);
				max = std::max(max, currentKey);

				if (it->second > 1) {
					if (show_penalty) {
						print("teacher", teacher_id, "day", day, "timeslot", it->first, "value", it->second);
					}
					class_timeslot_overlap += it->second;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			if (timetable.teachers_class_count[teacher_id] <= 4) {
				continue;
			}

			int middle = (min + max) / 2;
			int allowance = 4;
			bool is_there_break = false;

			for (int num : teacher_available_timeslot) {
				if (teacher_available_timeslot.count(num + 1) && teacher_available_timeslot.count(num + 2)) {
					if ((middle - allowance <= num && num <= middle + allowance) ||
					    (middle - allowance <= num + 1 && num + 1 <= middle + allowance) ||
					    (middle - allowance <= num + 2 && num + 2 <= middle + allowance)) {
						is_there_break = true;
						break;
					}
				}
			}

			if (!is_there_break) {
				if (show_penalty) {
					print("teacher", teacher_id, "day", day, is_there_break);
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
    int result_buff_length,
    int64_t* result) {
	random_device rd;
	mt19937 gen(rd());

	std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> section_subjects_units_map = {};
	std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> section_subjects_duration_map = {};
	std::vector<int> section_with_segmented_timeslots;
	std::unordered_map<int16_t, int> section_start_map = {};
	std::unordered_map<int16_t, std::vector<int16_t>> section_subjects_map = {};
	std::unordered_map<int, std::vector<int>> section_break_time_timeslots;
	std::unordered_map<int, int> section_num_of_class_block;
	std::unordered_map<int16_t, int> section_timeslot;
	std::unordered_map<int, int> section_num_breaks;

	std::unordered_map<int16_t, std::vector<int16_t>> eligible_teachers_in_subject;
	std::unordered_map<int16_t, int> class_num_of_subjects = {};

	for (int i = 0; i < total_section; i++) {
		section_start_map[i] = section_start[i];
	}

	for (int i = 0; i < teacher_subjects_length; i++) {
		if (teacher_subjects[i] == -1) continue;

		int16_t teacher, subject;
		teacher = static_cast<int16_t>(teacher_subjects[i] >> 16);
		subject = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
		eligible_teachers_in_subject[subject].push_back(teacher);
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

		section_subjects_map[unpacked_first_section_subjects].push_back(unpacked_second_section_subjects);

		std::cout << "a : " << unpacked_first_section_subjects << " b : " << unpacked_second_section_subjects << std::endl;

		section_subjects_units_map[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_units, unpacked_second_section_subjects_units));
		section_subjects_duration_map[unpacked_first_section_subjects][unpacked_first_section_subjects_duration] = unpacked_second_section_subjects_duration;

		section_num_of_class_block[unpacked_first_section_subjects] += unpacked_second_section_subjects_units == 0 ? work_week : unpacked_second_section_subjects_units;
	}

	std::cout << "section_with_segmented_timeslots" << std::endl;
	for (int i = 0; i < section_with_segmented_timeslots.size(); i++) {
		std::cout << section_with_segmented_timeslots[i] << " ";
	}
	std::cout << std::endl;
	std::cout << "section_with_segmented_timeslots end" << std::endl;

	std::cout << "section_subjects_units_map" << std::endl;
	for (auto it = section_subjects_units_map.begin(); it != section_subjects_units_map.end(); it++) {
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
	for (int16_t i = 0; i < section_subjects_map.size(); i++) {
		for (int j = 0; j < section_subjects_map[i].size(); j++) {
			std::cout << section_subjects_map[i][j] << " ";
		}

		std::cout << std::endl;
	}

	// std::cout << "class_timeslot_distributions" << std::endl;
	std::cout << "class_timeslot_distributions" << std::endl;

	// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
	for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;

		std::cout << " xx x xxxxxxxxxxxf : " << (((it->second + work_week - 1) / work_week) - 1) << std::endl;
		int timeslots = (((it->second + work_week - 1) / work_week) - 1);
		int num_breaks = timeslots < 10 ? 1 : 2;
		std::cout << "ehhe " << timeslots + num_breaks << std::endl;
		section_timeslot[it->first] = timeslots + num_breaks;
		// below 10 - 1, 2 equal or above

		section_num_breaks[it->first] = num_breaks;
		total_class_block += num_breaks;
	}

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

	std::uniform_int_distribution<int16_t> random_field(0, 2);
	std::uniform_int_distribution<int16_t> random_class_block(0, total_class_block - 1);
	std::uniform_int_distribution<int16_t> random_section(0, total_section - 1);
	std::uniform_int_distribution<int8_t> random_workDay(1, work_week);

	ObjectiveFunction optimizableFunction;

	printf("For function abcTestMine: %d iterations for each experiment. \n", max_iterations);

	int ewan = 10;

	Bee bestSolution;
	bestSolution.timetable.initializeTeachersClass(num_teachers, work_week, ewan);
	bestSolution.timetable.initializeRandomTimetable(gen, work_week, eligible_teachers_in_subject, section_timeslot, section_subjects_map, section_start_map, section_subjects_units_map, section_subjects_duration_map, random_workDay);
	// bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);
	// printSchoolClasses(bestSolution.timetable.schoolClasses);
	// printSchoolClasses(bestSolution.timetable.schoolClasses);

	// DEBUGGING

	// return;
	// return;
	// return;

	std::cout << "FIRSTTTTTTTTTTTTT" << std::endl;
	// bestSolution.timetable.update(gen, work_week, random_field, section_timeslot, section_start_map, random_section, random_workDay, section_subjects_units_map, eligible_teachers_in_subject, section_subjects_duration_map, section_with_segmented_timeslots);
	// bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);
	bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, false, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);
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
	// return;

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
		    result_buff_length,
		    result);

		return;
	}

	auto start = std::chrono::high_resolution_clock::now();

	vector<Bee> beesVector(beesPopulation, Bee());

	for (int i = 0; i < beesPopulation; i++) {
		beesVector[i].timetable.initializeTeachersClass(num_teachers, work_week, ewan);
		beesVector[i].timetable.initializeRandomTimetable(gen, work_week, eligible_teachers_in_subject, section_timeslot, section_subjects_map, section_start_map, section_subjects_units_map, section_subjects_duration_map, random_workDay);

		beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);

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
				randomBeesIndex = dist_bees_employed(gen);
			} while (randomBeesIndex == i);

			Bee newBee;
			newBee = beesVector[randomBeesIndex];

			// std::cout << YELLOW << "update and evaluate " << RESET << endl;
			// print("Before");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.timetable.update(gen, work_week, random_field, section_timeslot, section_start_map, random_section, random_workDay, section_subjects_units_map, eligible_teachers_in_subject, section_subjects_duration_map, section_with_segmented_timeslots);
			// print("After");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);

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
			double r = dis(gen);
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
			newBee.timetable.update(gen, work_week, random_field, section_timeslot, section_start_map, random_section, random_workDay, section_subjects_units_map, eligible_teachers_in_subject, section_subjects_duration_map, section_with_segmented_timeslots);
			// print("After");
			// printSchoolClasses(newBee.timetable.schoolClasses);
			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);

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
					newBee.timetable.initializeTeachersClass(num_teachers, work_week, ewan);
					newBee.timetable.initializeRandomTimetable(gen, work_week, eligible_teachers_in_subject, section_timeslot, section_subjects_map, section_start_map, section_subjects_units_map, section_subjects_duration_map, random_workDay);

					beesVector[i] = newBee;
					beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);

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
			break;
		}
	}

	std::cout << "Best solution: cost " << bestSolution.cost << " size " << endl;

	printSchoolClasses(bestSolution.timetable.schoolClasses);

	optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_subjects_duration_map, max_teacher_work_load);
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;
	// std::cout << "Objective function: " << optimizableFunction.evaluate(bestSolution.timetable, true, work_week, section_start_map, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << std::endl;

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	print("Time taken: ", duration.count(), "milliseconds");

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
