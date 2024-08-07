#include "abc.h"

#include <math.h>
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
    std::uniform_int_distribution<int16_t>& distribution_teacher,
    std::uniform_int_distribution<int16_t>& distribution_room,
    std::uniform_int_distribution<int16_t>& distribution_timeslot,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects) {
	int16_t offset = 0;

	for (const auto& entry : section_subjects) {
		int16_t section_id = entry.first;
		const std::vector<int16_t>& subjects = entry.second;
		int16_t num_subjects = static_cast<int16_t>(subjects.size());

		for (int16_t subject_id = 0; subject_id < num_subjects; subject_id++) {
			int16_t timeslot = distribution_timeslot(gen);
			int16_t teacher = distribution_teacher(gen);
			int16_t school_class_id = offset + subject_id;

			schoolClasses.push_back({school_class_id, section_id, subjects[subject_id], teacher, timeslot});
		}

		offset += num_subjects;
	}
};

void Timetable::updateTimetableUsingDifference(std::mt19937& gen,
                                               std::uniform_int_distribution<int16_t>& distribution_field,
                                               std::uniform_int_distribution<int16_t>& distribution_school_class,
                                               std::uniform_int_distribution<int16_t>& distribution_section,
                                               std::uniform_int_distribution<int16_t>& distribution_teacher,
                                               std::uniform_int_distribution<int16_t>& distribution_room,
                                               std::uniform_int_distribution<int16_t>& distribution_timeslot) {
	int16_t choice = distribution_field(gen);

	if (choice == 0) {
		schoolClasses[distribution_school_class(gen)].teacher_id = distribution_teacher(gen);
	} else if (choice == 1) {
		schoolClasses[distribution_school_class(gen)].timeslot = distribution_timeslot(gen);
	}
};

int combine(int class_id, int time_slot) {
	return (class_id << 16) | time_slot;
};

std::uint32_t combine(std::uint32_t class_id, std::uint32_t time_slot, std::uint32_t teacher_id) {
	return (class_id << 20) | (time_slot << 10) | teacher_id;  // Assuming each is 10-bit
};

std::uint64_t combine(std::uint32_t a, std::uint32_t b, std::uint32_t c, std::uint32_t d) {
	return (static_cast<std::uint64_t>(a) << 48) | (static_cast<std::uint64_t>(b) << 32) | (static_cast<std::uint64_t>(c) << 16) | d;
};

void extractSectionSubjects(const std::vector<int32_t>& inputArray, std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects) {
	for (int32_t value : inputArray) {
		int16_t section_id = static_cast<int16_t>(value >> 16);
		int16_t subject_id = static_cast<int16_t>(value & 0xFFFF);
		section_subjects[section_id].push_back(subject_id);
	}
}

bool ObjectiveFunction::isQualified(
    const int16_t& teacherID,
    const int16_t& subjectID,
    const std::unordered_map<int16_t, vector<int16_t>>& teacher_subjects) const {
	auto it = teacher_subjects.find(teacherID);
	if (it != teacher_subjects.end()) {
		const vector<int16_t>& subjects = it->second;
		return std::find(subjects.begin(), subjects.end(), subjectID) != subjects.end();
	}
	return true;
};

double ObjectiveFunction::evaluate(
    const Timetable& timetable,
    bool show_penalty,
    const std::unordered_map<int16_t, std::vector<int16_t>>& teacher_subjects) const {
	std::unordered_set<int> class_timeslot;
	std::unordered_set<int> teacher_timeslot_set;

	int16_t conflicting_timeslots = 0;
	int16_t invalid_teacher_subject_assignment = 0;

	for (const auto& school_class : timetable.schoolClasses) {
		if (school_class.teacher_id == -1 || school_class.timeslot == -1) continue;

		if (!class_timeslot.insert(combine(static_cast<int>(school_class.school_class_id), static_cast<int>(school_class.timeslot))).second) {
			// std::cout << "conflicting_timeslots" << conflicting_timeslots << std::endl;
			conflicting_timeslots++;
		}

		if (!teacher_timeslot_set.insert(combine(static_cast<int>(school_class.teacher_id), static_cast<int>(school_class.timeslot))).second) {
			// std::cout << "conflicting_timeslots" << conflicting_timeslots << std::endl;
			conflicting_timeslots++;
		}

		if (!isQualified(school_class.teacher_id, school_class.subject_id, teacher_subjects)) {
			// std::cout << "invalid_teacher_subject_assignment" << invalid_teacher_subject_assignment << std::endl;
			invalid_teacher_subject_assignment++;
		}
	}

	return conflicting_timeslots + invalid_teacher_subject_assignment;
};

Bee generateRandomTimetable(
    int& num_school_class,
    int& num_teachers,
    int& num_rooms,
    int& num_timeslots,
    std::unordered_map<int16_t, std::vector<int16_t>>& section_subjects,
    const ObjectiveFunction& objFunc) {
	Bee newBee(num_school_class);

	random_device rd;
	mt19937 gen(rd());
	std::uniform_int_distribution<int16_t> teacher_dist(0, num_teachers - 1);
	std::uniform_int_distribution<int16_t> room_dist(0, num_rooms - 1);
	std::uniform_int_distribution<int16_t> timeslot_dist(0, num_timeslots - 1);

	newBee.timetable.initializeRandomTimetable(gen, teacher_dist, room_dist, timeslot_dist, section_subjects);

	return newBee;
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
    int num_rooms,
    int num_timeslots,
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
	int16_t nrOfExperiments = 1;

	random_device rd;
	mt19937 gen(rd());

	std::unordered_map<int16_t, std::vector<int16_t>> section_subjects_map = {};
	std::unordered_map<int16_t, std::vector<int16_t>> teacher_subjects_map = {};

	for (int i = 0; i < teacher_subjects_length; i++) {
		if (teacher_subjects[i] == -1) continue;

		int16_t unpackedFirst, unpackedSecond;
		unpackedFirst = static_cast<int16_t>(teacher_subjects[i] >> 16);
		unpackedSecond = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
		std::cout << "unpackedFirst: " << unpackedFirst << " unpackedSecond: " << unpackedSecond << std::endl;

		teacher_subjects_map[unpackedFirst].push_back(unpackedSecond);
	}

	std::cout << "teacher_subjects_map" << std::endl;
	for (int i = 0; i < teacher_subjects_map.size(); i++) {
		for (int j = 0; j < teacher_subjects_map[i].size(); j++) {
			std::cout << teacher_subjects_map[i][j] << " ";
		}

		std::cout << std::endl;
	}

	std::cout << "section_subjects_map" << std::endl;
	for (int i = 0; i < total_school_class; i++) {
		int16_t unpackedFirst, unpackedSecond;

		unpackedFirst = static_cast<int16_t>(section_subjects[i] >> 16);
		unpackedSecond = static_cast<int16_t>(section_subjects[i] & 0xFFFF);
		std::cout << "unpackedFirst: " << unpackedFirst << " unpackedSecond: " << unpackedSecond << std::endl;
		section_subjects_map[unpackedFirst].push_back(unpackedSecond);
	}

	for (int16_t i = 0; i < section_subjects_map.size(); i++) {
		for (int j = 0; j < section_subjects_map[i].size(); j++) {
			std::cout << section_subjects_map[i][j] << " ";
		}

		std::cout << std::endl;
	}

	std::uniform_int_distribution<int16_t>
	    random_field(0, 2);
	std::uniform_int_distribution<int16_t> random_school_class(0, total_school_class - 1);
	std::uniform_int_distribution<int16_t> random_section(0, total_section - 1);
	std::uniform_int_distribution<int16_t> random_teacher(0, num_teachers - 1);
	std::uniform_int_distribution<int16_t> random_room(0, num_rooms - 1);
	std::uniform_int_distribution<int16_t> random_timeslot(0, num_timeslots - 1);

	ObjectiveFunction optimizableFunction;
	vector<double> bestCostExperiments(nrOfExperiments, 0);
	double allMeanCost = 0.0;
	double allSDCost = 0.0;

	printf("For function abcTestMine: %d experiments, %d iterations for each experiment. \n", nrOfExperiments, max_iterations);

	Bee bestSolution(total_school_class);
	// bestSolution.timetable.addCurriculum(curriculum);
	bestSolution.timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot, section_subjects_map);

	auto start = std::chrono::high_resolution_clock::now();

	for (int experiment = 0; experiment < nrOfExperiments; experiment++) {
		vector<Bee> beesVector(beesPopulation, Bee(total_school_class));

		for (int i = 0; i < beesPopulation; i++) {
			// beesVector[i].timetable.addCurriculum(curriculum);
			beesVector[i].timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot, section_subjects_map);

			beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, teacher_subjects_map);
			if (beesVector[i].cost <= bestSolution.cost) {
				bestSolution = beesVector[i];
			}
		}

		vector<int> abandonedBees(beesPopulation, 0);
		std::uniform_int_distribution<> dist_bees_employed(0, beesEmployed - 1);
		for (int iter = 0; iter < max_iterations; iter++) {
			// std::cout << "Iter: " << iter << std::endl;

			for (int i = 0; i < beesEmployed; i++) {
				int randomBeesIndex;
				do {
					randomBeesIndex = dist_bees_employed(gen);
				} while (randomBeesIndex == i);

				Bee newBee(total_school_class);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_section, random_teacher, random_room, random_timeslot);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, teacher_subjects_map);

				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
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

			for (int m = 0; m < beesOnlooker; m++) {
				int i = fitnessProportionateSelection(prob);

				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(total_school_class);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_section, random_teacher, random_room, random_timeslot);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable, false, teacher_subjects_map);

				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}

			for (int itScout = 0; itScout < beesScout; itScout++) {
				for (int i = 0; i < beesEmployed; i++) {
					if (abandonedBees[i] >= limit) {
						// std::cout << "HEHE" << std::endl;

						int room = random_room(gen);
						int timeslot = random_timeslot(gen);
						int teacher = random_teacher(gen);
						beesVector[i] = generateRandomTimetable(total_school_class, num_teachers, num_rooms, num_timeslots, section_subjects_map, optimizableFunction);

						beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable, false, teacher_subjects_map);
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

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable, true, teacher_subjects_map) << endl;
	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;

	for (int i = 0; i < total_school_class; i++) {
		int64_t packed = packInt16ToInt64(bestSolution.timetable.schoolClasses[i].section_id, bestSolution.timetable.schoolClasses[i].subject_id, bestSolution.timetable.schoolClasses[i].teacher_id, bestSolution.timetable.schoolClasses[i].timeslot);
		result[i] = packed;
	}
}
}