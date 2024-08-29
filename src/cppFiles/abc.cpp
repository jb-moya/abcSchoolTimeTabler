#include "abc.h"

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
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

// Define ANSI color codes
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

std::vector<int> calculatePositions(
    std::vector<std::pair<int16_t, int16_t>> subjects_duration_map,
    int divisions) {
	std::vector<int> positions;

	int total_length = 0;

	for (int i = 0; i < subjects_duration_map.size(); ++i) {
		total_length += subjects_duration_map[i].second;
	}

	if (divisions == 1) {
		positions.push_back(static_cast<int>(std::round(total_length / 2.0)));
	} else {
		double interval = static_cast<double>(total_length) / (divisions + 1);

		for (int i = 1; i <= divisions; ++i) {
			positions.push_back(static_cast<int>(std::round(i * interval)));
		}
	}

	return positions;
}

bool isAround(int number, int target, int range = 5) {
	return std::abs(number - target) <= range;
}

Timetable::Timetable(int num_school_class) {
	schoolClasses.reserve(num_school_class);
};

void Timetable::initializeRandomTimetable(
    std::mt19937& gen,
    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
    std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
    std::unordered_map<int, int>& section_num_breaks,
    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
    std::uniform_int_distribution<int8_t>& random_workday) {
	int16_t offset = 0;

	// iterate all possible order in each section



	for (const auto& entry : section_subjects) {
		int16_t section_id = entry.first;
		const std::vector<int16_t>& subjects = entry.second;
		int16_t num_subjects = static_cast<int16_t>(subjects.size());

		for (const auto& subject_id : subjects) {
			int16_t school_class_id = offset + subject_id;
			// std::cout << "school id : " << school_class_id << std::endl;
			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

			int16_t timeslot = class_timeslot_distributions[section_id](gen);
			int16_t teacher = eligible_teachers_in_subject[subject_id][dis(gen)];
			int16_t num_unit = section_subjects_units_map[section_id][subject_id].second;

			// std::cout << "section_id : " << section_id << " subject : " << subject_id << " units : " << unit << "  -  " << std::endl;

			if (num_unit == 0) {
				// std::cout << "HEHEHEHEHEH" << std::endl;
				schoolClasses.push_back({school_class_id, section_id, subject_id, teacher, timeslot, 0});
			} else {
				for (int16_t i = 0; i < num_unit; ++i) {
					int8_t workday = random_workday(gen);
					schoolClasses.push_back({static_cast<int16_t>(school_class_id + i), section_id, subject_id, teacher, timeslot, workday});
				}

				offset += num_unit - 1;
			}
		}

		offset += num_subjects;

		// add break for each section
		for (int i = 0; i < section_num_breaks[section_id]; ++i) {
			int16_t timeslot = class_timeslot_distributions[section_id](gen);
			schoolClasses.push_back({static_cast<int16_t>(offset + i), section_id, -1, -1, timeslot, 0});
		}

		offset += section_num_breaks[section_id];
	}

	// for (int i = 0; i < schoolClasses.size(); ++i) {
	// 	std::cout << "school class id : " << schoolClasses[i].school_class_id << std::endl;
	// }
};

void Timetable::update(std::mt19937& gen,
                       std::uniform_int_distribution<int16_t>& distribution_field,
                       std::uniform_int_distribution<int16_t>& distribution_class_block,
                       std::uniform_int_distribution<int16_t>& distribution_section,
                       std::uniform_int_distribution<int8_t>& random_workday,
                       std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_units_map,
                       std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
                       std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions) {
	int16_t choice = distribution_field(gen);
	int16_t school_class_id = distribution_class_block(gen);

	// std::cout << "shcool class id " << school_class_id << std::endl;

	if (schoolClasses[school_class_id].subject_id == -1) {
		choice = 1;
	}

	if (choice == 2) {
		int16_t unit = section_subjects_units_map[schoolClasses[school_class_id].section_id][schoolClasses[school_class_id].subject_id].second;
		if (unit != 0) {
			int8_t workday = random_workday(gen);
			schoolClasses[school_class_id].day = workday;

			return;
		} else {
			std::uniform_int_distribution<> rechoice_dis(0, 1);
			choice = rechoice_dis(gen);
		}
	}

	if (choice == 0) {
		int16_t subject_id = schoolClasses[school_class_id].subject_id;

		std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

		int16_t teacher = eligible_teachers_in_subject[subject_id][dis(gen)];

		schoolClasses[school_class_id]
		    .teacher_id = teacher;

	} else if (choice == 1) {
		int16_t timeslot = class_timeslot_distributions[schoolClasses[school_class_id].section_id](gen);

		schoolClasses[school_class_id]
		    .timeslot = timeslot;
	}
};

int combine(int first, int second) {
	return (first << 16) | second;
};
int combine(int first, int second, int third) {
	return (first << 16) | (second << 8) | third;
}

int ObjectiveFunction::evaluate(
    Timetable& timetable,
    bool show_penalty,
    int& work_week,
    std::unordered_map<int16_t, std::vector<int>> section_possible_break_slot,
    std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>>& section_subjects_duration,
    int& max_teacher_work_load) {
	std::unordered_set<int> class_timeslot_set;
	std::unordered_set<int> teacher_timeslot_set;
	std::unordered_map<int, std::map<int, int>> section_timeslots;
	std::unordered_map<int, std::map<int, std::map<int, std::map<int, std::set<int>>>>> teacher_timeslots;
	std::unordered_map<int, std::map<int, std::unordered_set<int>>> teacher_class_count;

	int conflicting_timeslots = 0;
	int exceeding_assignments = 0;
	int early_break_violation = 0;

	// penalty is about prioritization but can also be a hindrance...
	// it is not so much about hard/soft type of constraints anymore...

	int total_class_block = static_cast<int>(timetable.schoolClasses.size());
	for (int i = 0; i < total_class_block; ++i) {
		const auto& school_class = timetable.schoolClasses[i];
		int school_class_id = static_cast<int>(school_class.school_class_id);
		int teacher_id = static_cast<int>(school_class.teacher_id);
		int subject_id = static_cast<int>(school_class.subject_id);
		int timeslot = static_cast<int>(school_class.timeslot);
		int section_id = static_cast<int>(school_class.section_id);
		int day = static_cast<int>(school_class.day);

		section_timeslots[section_id][timeslot] = subject_id;

		if (day != 0) {
			int class_timeslot_key = combine(section_id, timeslot, day);
			if (!class_timeslot_set.insert(class_timeslot_key).second) {
				conflicting_timeslots += 1000;
			}

			if (teacher_id != -1) {
				int teacher_timeslot_key = combine(teacher_id, timeslot, day);
				if (!teacher_timeslot_set.insert(teacher_timeslot_key).second) {
					conflicting_timeslots += 1000;
				}

				teacher_class_count[teacher_id][day].insert(school_class_id);
				teacher_timeslots[teacher_id][day][timeslot][section_id].insert(subject_id);
			}

		} else {
			for (int i = 1; i <= work_week; ++i) {
				int class_timeslot_key = combine(section_id, timeslot, i);
				if (!class_timeslot_set.insert(class_timeslot_key).second) {
					conflicting_timeslots += 1000;
				}

				if (teacher_id != -1) {
					int teacher_timeslot_key = combine(teacher_id, timeslot, i);
					if (!teacher_timeslot_set.insert(teacher_timeslot_key).second) {
						conflicting_timeslots += 1000;
					}

					teacher_class_count[teacher_id][i].insert(school_class_id);
					teacher_timeslots[teacher_id][i][timeslot][section_id].insert(subject_id);
				}
			}
		}
	}

	for (const auto& teacher : teacher_class_count) {
		if (teacher.second.size() > max_teacher_work_load) {
			exceeding_assignments += 1000;
		}
	}

	for (const auto& section : section_timeslots) {
		int section_id = section.first;
		const auto& timeslots = section.second;

		for (int i = 0; i < section_possible_break_slot[section_id].size(); ++i) {
			int total_duration = 0;
			bool possible = false;

			for (const auto& timeslot : timeslots) {
				int subject_id = timeslot.second;

				if (subject_id == -1) {
					if (isAround(total_duration, section_possible_break_slot[section_id][i])) {
						possible = true;
					}

				} else {
					total_duration += section_subjects_duration[section_id][subject_id].second;
				}
			}

			if (!possible) {
				early_break_violation += 11111;
			}
		}
	}

	if (show_penalty) {
		for (const auto& teacher : teacher_timeslots) {
			std::cout << "teacher : " << teacher.first << std::endl;
			for (const auto& day : teacher.second) {
				std::cout << "day : " << day.first << std::endl;
				for (const auto& timeslot : day.second) {
					std::cout << "timeslot : " << timeslot.first << std::endl;

					for (const auto& section : timeslot.second) {
						std::cout << "section : " << section.first << std::endl;
						for (const auto& subject : section.second) {
							std::cout << "subject : " << subject << std::endl;
						}
					}
				}
			}
			std::cout << std::endl;
		}
	}

	if (show_penalty) {
		std::cout << "conflicting_timeslots : " << conflicting_timeslots << std::endl;
		std::cout << "exceeding_assignments : " << exceeding_assignments << std::endl;
		std::cout << "early_break_violation : " << early_break_violation << std::endl;
	}

	return conflicting_timeslots + exceeding_assignments + early_break_violation;
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
	std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> section_subjects_duration_map = {};
	std::unordered_map<int16_t, std::vector<int>> section_possible_break_slot = {};
	std::unordered_map<int16_t, int> section_start_map = {};
	std::unordered_map<int16_t, std::vector<int16_t>> section_subjects_map = {};
	std::unordered_map<int, std::vector<int>> section_break_time_timeslots;
	std::unordered_map<int, int> section_num_of_class_block;
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

	std::cout << "eligible_teachers_in_subject" << std::endl;
	for (auto it = eligible_teachers_in_subject.begin(); it != eligible_teachers_in_subject.end(); it++) {
		// std::cout << it->first << " ";

		for (int i = 0; i < it->second.size(); i++) {
			// std::cout << it->second[i] << " ";
		}

		// std::cout << std::endl;
	}

	std::cout << "eligible_teachers_in_subject end" << std::endl;

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
		section_subjects_duration_map[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_duration, unpacked_second_section_subjects_duration));

		section_num_of_class_block[unpacked_first_section_subjects] += unpacked_second_section_subjects_units == 0 ? 5 : unpacked_second_section_subjects_units;
	}

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

	std::unordered_map<int16_t, std::uniform_int_distribution<int>> class_timeslot_distributions;

	// std::cout << "class_timeslot_distributions" << std::endl;
	std::cout << "class_timeslot_distributions" << std::endl;

	// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
	for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;

		std::cout << " xx x xxxxxxxxxxxf : " << (((it->second + work_week - 1) / work_week) - 1) << std::endl;
		int timeslots = (((it->second + work_week - 1) / work_week) - 1);
		int num_breaks = timeslots < 10 ? 1 : 2;
		std::cout << "ehhe " << timeslots + num_breaks << std::endl;
		class_timeslot_distributions[it->first] = std::uniform_int_distribution<int>(0, timeslots + num_breaks);
		// below 10 - 1, 2 equal or above

		section_num_breaks[it->first] = num_breaks;
		section_possible_break_slot[it->first] = calculatePositions(section_subjects_duration_map[it->first], num_breaks);

		total_class_block += num_breaks;
	}

	std::cout << "section_possible_break_slot" << std::endl;
	for (auto it = section_possible_break_slot.begin(); it != section_possible_break_slot.end(); it++) {
		std::cout << it->first << " " << std::endl;

		for (int i = 0; i < it->second.size(); i++) {
			std::cout << it->second[i] << " ";
		}

		std::cout << std::endl;
	}

	// class_timeslot_distributions[0] = std::uniform_int_distribution<int>(0, 2);

	std::uniform_int_distribution<int16_t>
	    random_field(0, 2);
	std::uniform_int_distribution<int16_t> random_class_block(0, total_class_block - 1);
	std::uniform_int_distribution<int16_t> random_section(0, total_section - 1);
	std::uniform_int_distribution<int8_t> random_workDay(1, work_week);

	ObjectiveFunction optimizableFunction;

	printf("For function abcTestMine: %d iterations for each experiment. \n", max_iterations);

	Bee bestSolution(total_class_block);
	bestSolution.timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map, section_num_breaks, section_subjects_units_map, random_workDay);
	bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, false, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);

	auto start = std::chrono::high_resolution_clock::now();

	vector<Bee> beesVector(beesPopulation, Bee(total_class_block));

	for (int i = 0; i < beesPopulation; i++) {
		beesVector[i].timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map, section_num_breaks, section_subjects_units_map, random_workDay);

		beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);
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

			Bee newBee(total_class_block);
			newBee = beesVector[randomBeesIndex];
			newBee.timetable.update(gen, random_field, random_class_block, random_section, random_workDay, section_subjects_units_map, eligible_teachers_in_subject, class_timeslot_distributions);

			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);

			// #pragma omp critical
			{
				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}
		}

		// return;

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

			Bee newBee(total_class_block);
			newBee = beesVector[randomBeesIndex];
			newBee.timetable.update(gen, random_field, random_class_block, random_section, random_workDay, section_subjects_units_map, eligible_teachers_in_subject, class_timeslot_distributions);

			newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);

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
					Bee newBee(total_class_block);
					newBee.timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map, section_num_breaks, section_subjects_units_map, random_workDay);

					beesVector[i] = newBee;
					beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load);

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

	std::cout << "Best solution: cost " << bestSolution.cost << " size " << bestSolution.timetable.schoolClasses.size() << endl;
	for (int i = 0; i < bestSolution.timetable.schoolClasses.size(); i++) {
		std::cout
		    << RED << std::setw(4) << bestSolution.timetable.schoolClasses[i].school_class_id << RESET
		    << GREEN << std::setw(4) << bestSolution.timetable.schoolClasses[i].section_id << RESET
		    << YELLOW << std::setw(4) << bestSolution.timetable.schoolClasses[i].subject_id << RESET
		    << BLUE << std::setw(4) << bestSolution.timetable.schoolClasses[i].teacher_id << RESET
		    << CYAN << std::setw(4) << bestSolution.timetable.schoolClasses[i].timeslot << RESET
		    << MAGENTA << std::setw(4) << static_cast<int>(bestSolution.timetable.schoolClasses[i].day) << RESET << std::endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable, true, work_week, section_possible_break_slot, section_subjects_duration_map, max_teacher_work_load) << endl;

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;

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