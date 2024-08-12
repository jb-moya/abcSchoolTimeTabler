#include "abc.h"

#include <math.h>
#include <omp.h>
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

Timetable::Timetable(int num_school_class) {
	schoolClasses.reserve(num_school_class);
};

void Timetable::initializeRandomTimetable(
    std::mt19937& gen,
    std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
    std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects) {
	int16_t offset = 0;

	for (const auto& entry : section_subjects) {
		int16_t section_id = entry.first;
		const std::vector<int16_t>& subjects = entry.second;
		int16_t num_subjects = static_cast<int16_t>(subjects.size());

		for (const auto& subject_id : subjects) {
			int16_t school_class_id = offset + subject_id;

			std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

			int16_t timeslot = class_timeslot_distributions[section_id](gen);
			int16_t teacher = eligible_teachers_in_subject[subject_id][dis(gen)];

			// std::cout << "Teacher: " << teacher << " subject " << subject_id << std::endl;

			schoolClasses.push_back({school_class_id, section_id, subject_id, teacher, timeslot});
		}

		offset += num_subjects;
	}
};

void Timetable::update(std::mt19937& gen,
                       std::uniform_int_distribution<int16_t>& distribution_field,
                       std::uniform_int_distribution<int16_t>& distribution_school_class,
                       std::uniform_int_distribution<int16_t>& distribution_section,
                       std::unordered_map<int16_t, std::vector<int16_t>>& eligible_teachers_in_subject,
                       std::unordered_map<int16_t, std::uniform_int_distribution<int>>& class_timeslot_distributions) {
	int16_t choice = distribution_field(gen);
	int16_t school_class_id = distribution_school_class(gen);

	// std::cout << "choice: " << choice << " school_class_id: " << school_class_id << std::endl;
	//  0   1   0   1   1
	//  1   1   1   1   0
	//  2   0   0   0   1
	//  3   0   1   1   0

	if (choice == 0) {
		int16_t subject_id = schoolClasses[school_class_id].subject_id;

		std::uniform_int_distribution<> dis(0, eligible_teachers_in_subject[subject_id].size() - 1);

		int16_t teacher = eligible_teachers_in_subject[subject_id][dis(gen)];

		schoolClasses[school_class_id]
		    .teacher_id = teacher;

		// std::cout << " subject " << subject_id << " Teacher: " << teacher << std::endl;

	} else if (choice == 1) {
		int16_t timeslot = class_timeslot_distributions[schoolClasses[school_class_id].section_id](gen);

		// std::cout << "timeslot: " << timeslot << std::endl;

		schoolClasses[school_class_id]
		    .timeslot = timeslot;
	}
};

int combine(int class_id, int time_slot) {
	return (class_id << 16) | time_slot;
};

void extractSectionSubjects(const std::vector<int32_t>& inputArray, std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects) {
	for (int32_t value : inputArray) {
		int16_t section_id = static_cast<int16_t>(value >> 16);
		int16_t subject_id = static_cast<int16_t>(value & 0xFFFF);
		section_subjects[section_id].push_back(subject_id);
	}
}

double ObjectiveFunction::evaluate(
    const Timetable& timetable,
    bool show_penalty) const {
	std::unordered_set<int> class_timeslot_set;
	std::unordered_set<int> teacher_timeslot_set;

	int16_t conflicting_timeslots = 0;

	for (int i = 0; i < timetable.schoolClasses.size(); ++i) {
		const auto& school_class = timetable.schoolClasses[i];
		int teacher_id = static_cast<int>(school_class.teacher_id);
		int timeslot = static_cast<int>(school_class.timeslot);
		int section_id = static_cast<int>(school_class.section_id);

		if (teacher_id == -1 || timeslot == -1) continue;

		int class_timeslot_key = combine(section_id, timeslot);
		if (!class_timeslot_set.insert(class_timeslot_key).second) {
			conflicting_timeslots++;
		}

		int teacher_timeslot_key = combine(teacher_id, timeslot);
		if (!teacher_timeslot_set.insert(teacher_timeslot_key).second) {
			conflicting_timeslots++;
		}
	}

	return conflicting_timeslots;
};

int64_t packInt16ToInt64(int16_t first, int16_t second, int16_t third, int16_t fourth) {
	int64_t result = 0;
	result |= (static_cast<int64_t>(first) & 0xFFFF) << 48;
	result |= (static_cast<int64_t>(second) & 0xFFFF) << 32;
	result |= (static_cast<int64_t>(third) & 0xFFFF) << 16;
	result |= (static_cast<int64_t>(fourth) & 0xFFFF);
	return result;
}

int32_t packInt16ToInt32(int16_t first, int16_t second) {
	int32_t result = (static_cast<int32_t>(first) << 16) | (static_cast<uint16_t>(second));
	return result;
}

extern "C" {

int sum(int a, int b) {
	printf("sum: %d\n", a + b);
	return a + b;
}

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_school_class,
    int total_section,
    int32_t* section_subjects,
    int32_t* teacher_subjects,
    int teacher_subjects_length,
    int beesPopulation,
    int beesEmployed,
    int beesOnlooker,
    int beesScout,
    int limit,
    int64_t* result) {
	// Set the number of threads to the number of logical processors available
	omp_set_num_threads(omp_get_max_threads());

#pragma omp parallel
	{
		int thread_id = omp_get_thread_num();
		int num_threads = omp_get_num_threads();
		if (thread_id == 0) {
			std::cout << "Total number of threads: " << num_threads << std::endl;
		}
		std::cout << "Thread " << thread_id << " is running" << std::endl;
	}

	int16_t nrOfExperiments = 1;

	random_device rd;
	mt19937 gen(rd());

	std::unordered_map<int16_t, std::vector<int16_t>> section_subjects_map = {};
	std::unordered_map<int16_t, std::vector<int16_t>> teacher_subjects_map = {};

	std::unordered_map<int16_t, std::vector<int16_t>> eligible_teachers_in_subject;

	for (int i = 0; i < teacher_subjects_length; i++) {
		if (teacher_subjects[i] == -1) continue;

		int16_t unpackedFirst, unpackedSecond;
		unpackedFirst = static_cast<int16_t>(teacher_subjects[i] >> 16);
		unpackedSecond = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
		std::cout << "eno to: " << unpackedFirst << " eno to 2: " << unpackedSecond << std::endl;

		teacher_subjects_map[unpackedFirst].push_back(unpackedSecond);

		eligible_teachers_in_subject[unpackedSecond].push_back(unpackedFirst);
	}

	std::cout << "eligible_teachers_in_subject" << std::endl;
	for (auto it = eligible_teachers_in_subject.begin(); it != eligible_teachers_in_subject.end(); it++) {
		std::cout << it->first << " ";

		for (int i = 0; i < it->second.size(); i++) {
			std::cout << it->second[i] << " ";
		}

		std::cout << std::endl;
	}
	std::cout << "eligible_teachers_in_subject end" << std::endl;

	std::cout << "teacher_subjects_map" << std::endl;
	for (const auto& pair : teacher_subjects_map) {
		int16_t teacher_id = pair.first;
		const std::vector<int16_t>& subjects = pair.second;

		std::cout << "Teacher ID: " << teacher_id << " teaches subjects: ";
		for (int16_t subject : subjects) {
			std::cout << subject << " ";
		}
		std::cout << std::endl;
	}

	std::unordered_map<int, int> class_num_of_subjects;

	std::cout << "section_subjects_map" << std::endl;
	for (int i = 0; i < total_school_class; i++) {
		int16_t unpackedFirst, unpackedSecond;

		unpackedFirst = static_cast<int16_t>(section_subjects[i] >> 16);
		unpackedSecond = static_cast<int16_t>(section_subjects[i] & 0xFFFF);
		std::cout << "unpackedFirst: " << unpackedFirst << " unpackedSecond: " << unpackedSecond << std::endl;
		section_subjects_map[unpackedFirst].push_back(unpackedSecond);

		class_num_of_subjects[unpackedFirst]++;
	}

	// cout all class_num_of_subjects
	std::cout << "class_num_of_subjects" << std::endl;
	for (auto it = class_num_of_subjects.begin(); it != class_num_of_subjects.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;
	}
	std::cout << "class_num_of_subjects end" << std::endl;

	for (int16_t i = 0; i < section_subjects_map.size(); i++) {
		for (int j = 0; j < section_subjects_map[i].size(); j++) {
			std::cout << section_subjects_map[i][j] << " ";
		}

		std::cout << std::endl;
	}

	std::unordered_map<int16_t, std::uniform_int_distribution<int>> class_timeslot_distributions;

	std::cout << "class_timeslot_distributions" << std::endl;
	std::cout << "class_timeslot_distributions" << std::endl;
	for (auto it = class_num_of_subjects.begin(); it != class_num_of_subjects.end(); it++) {
		std::cout << it->first << " " << it->second << std::endl;
		class_timeslot_distributions[it->first] = std::uniform_int_distribution<int>(0, it->second - 1);
	}

	std::cout << total_school_class << " hehe " << std::endl;
	std::cout << total_section << " hehe " << std::endl;
	std::cout << num_teachers << " hehe " << std::endl;

	std::uniform_int_distribution<int16_t>
	    random_field(0, 1);
	std::uniform_int_distribution<int16_t> random_school_class(0, total_school_class - 1);
	std::uniform_int_distribution<int16_t> random_section(0, total_section - 1);
	std::uniform_int_distribution<int16_t> random_teacher(0, num_teachers - 1);

	ObjectiveFunction optimizableFunction;
	vector<double> bestCostExperiments(nrOfExperiments, 0);
	double allMeanCost = 0.0;
	double allSDCost = 0.0;

	printf("For function abcTestMine: %d experiments, %d iterations for each experiment. \n", nrOfExperiments, max_iterations);

	Bee bestSolution(total_school_class);
	bestSolution.timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map);
	bestSolution.cost = optimizableFunction.evaluate(bestSolution.timetable, false);

	auto start = std::chrono::high_resolution_clock::now();

	for (int experiment = 0; experiment < nrOfExperiments; experiment++) {
		vector<Bee> beesVector(beesPopulation, Bee(total_school_class));

		for (int i = 0; i < beesPopulation; i++) {
			beesVector[i].timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map);

			beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false);
			if (beesVector[i].cost <= bestSolution.cost) {
				bestSolution = beesVector[i];
			}
		}

		vector<int> abandonedBees(beesPopulation, 0);
		std::uniform_int_distribution<> dist_bees_employed(0, beesEmployed - 1);

		for (int iter = 0; iter < max_iterations; iter++) {
#pragma omp parallel for
			for (int i = 0; i < beesEmployed; i++) {
				int randomBeesIndex;
				do {
					randomBeesIndex = dist_bees_employed(gen);
				} while (randomBeesIndex == i);

				Bee newBee(total_school_class);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.update(gen, random_field, random_school_class, random_section, eligible_teachers_in_subject, class_timeslot_distributions);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable, false);

#pragma omp critical
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

#pragma omp parallel for
			for (int m = 0; m < beesOnlooker; m++) {
				int i = fitnessProportionateSelection(prob);

				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(total_school_class);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.update(gen, random_field, random_school_class, random_section, eligible_teachers_in_subject, class_timeslot_distributions);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable, false);

#pragma omp critical
				{
					if (newBee.cost <= beesVector[i].cost) {
						beesVector[i] = newBee;
					} else {
						abandonedBees[i]++;
					}
				}
			}

#pragma omp parallel for
			for (int itScout = 0; itScout < beesScout; itScout++) {
				for (int i = 0; i < beesEmployed; i++) {
					if (abandonedBees[i] >= limit) {
						Bee newBee(total_school_class);
						newBee.timetable.initializeRandomTimetable(gen, eligible_teachers_in_subject, class_timeslot_distributions, section_subjects_map);
						newBee = beesVector[i];

						beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false);
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
	}

	std::cout << "Best solution: cost " << bestSolution.cost << " size " << bestSolution.timetable.schoolClasses.size() << endl;
	for (int i = 0; i < bestSolution.timetable.schoolClasses.size(); i++) {
		std::cout
		    << RED << std::setw(4) << bestSolution.timetable.schoolClasses[i].school_class_id << RESET
		    << GREEN << std::setw(4) << bestSolution.timetable.schoolClasses[i].section_id << RESET
		    << YELLOW << std::setw(4) << bestSolution.timetable.schoolClasses[i].subject_id << RESET
		    << BLUE << std::setw(4) << bestSolution.timetable.schoolClasses[i].teacher_id << RESET
		    << CYAN << std::setw(4) << bestSolution.timetable.schoolClasses[i].timeslot << RESET << std::endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable, true) << endl;

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;

	for (int i = 0; i < total_school_class; i++) {
		int64_t packed = packInt16ToInt64(bestSolution.timetable.schoolClasses[i].section_id, bestSolution.timetable.schoolClasses[i].subject_id, bestSolution.timetable.schoolClasses[i].teacher_id, bestSolution.timetable.schoolClasses[i].timeslot);
		result[i] = packed;
	}
}
}