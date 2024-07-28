#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <cassert>
#include <cmath>
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>

using namespace std;

#define TEST_MODE
// #define _DEBUG

struct ClassRoom {
	int room_id;
	int class_id;
	int timeslot;
};

struct SchoolClass {
	int class_id;
	int teacher_id;
	int section_id;
	int room_id;
	int timeslot;
};

struct Section {
	int section_id;
};

struct Teacher {
	int teacher_id;
	std::vector<int> school_class_ids;
};

struct Timetable {
	std::vector<SchoolClass> classes;
	std::unordered_map<int, Teacher> teachers;
	std::unordered_map<int, ClassRoom> rooms;

	Timetable(int num_classes) {
		classes.reserve(num_classes);
	}

	void addClassAssignment(const SchoolClass& schoolClass) {
		classes.push_back(schoolClass);
		teachers[schoolClass.teacher_id].school_class_ids.push_back(schoolClass.class_id);

		auto room_it = rooms.find(schoolClass.room_id);
		if (room_it == rooms.end()) {
			rooms[schoolClass.room_id] = {schoolClass.room_id, schoolClass.class_id, schoolClass.timeslot};
		}
	}
};

struct ObjectiveFunction {
	int hasConflictingTimeslots(const std::unordered_map<int, ClassRoom>& rooms) const {
		std::unordered_set<int> timeslot_set;
		int conflicting_timeslots = 0;

		for (const auto& pair : rooms) {
			const ClassRoom& classroom = pair.second;
			if (!timeslot_set.insert(classroom.timeslot).second) {
				conflicting_timeslots++;
			}
		}

		return conflicting_timeslots;
	}

	int hasConflictingTeacherAssignments(const std::unordered_map<int, Teacher>& teachers) const {
		std::unordered_set<int> school_class_set;
		int conflicting_teacher_assignments = 0;

		for (const auto& pair : teachers) {
			const Teacher& teacher = pair.second;
			for (const auto& school_class_id : teacher.school_class_ids) {
				if (!school_class_set.insert(school_class_id).second) {
					conflicting_teacher_assignments++;
				}
			}
		}

		return conflicting_teacher_assignments;
	}

	double evaluate(const Timetable& timetable) const {
		double penalty = 0;
		penalty += hasConflictingTimeslots(timetable.rooms);
		penalty += hasConflictingTeacherAssignments(timetable.teachers);
		return penalty;
	}
};

// Sample test function
void testTimeSlotConflict() {
	Timetable timetable(5);

	timetable.addClassAssignment({0, 0, 0, 0, 0});
	timetable.addClassAssignment({0, 0, 0, 1, 1});
	timetable.addClassAssignment({0, 0, 0, 2, 2});
	timetable.addClassAssignment({0, 0, 0, 3, 3});
	timetable.addClassAssignment({0, 0, 0, 4, 4});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable.rooms) == 0);

	Timetable timetable2(5);
	// timetable2 should break the constraint
	timetable2.addClassAssignment({0, 0, 0, 0, 0});
	timetable2.addClassAssignment({0, 0, 0, 1, 0});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable2.rooms) == 1);

	Timetable timetable3(5);
	// timetable3 should break the constraint
	timetable3.addClassAssignment({0, 0, 0, 0, 0});
	timetable3.addClassAssignment({0, 0, 0, 1, 0});
	timetable3.addClassAssignment({0, 0, 0, 2, 1});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable3.rooms) == 1);

	Timetable timetable4(5);
	// timetable4 should break the constraint
	timetable4.addClassAssignment({0, 0, 0, 0, 0});
	timetable4.addClassAssignment({0, 0, 0, 0, 1});
	timetable4.addClassAssignment({0, 0, 0, 0, 2});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable4.rooms) == 0);

	Timetable timetable5(5);
	// timetable5 should break the constraint
	timetable5.addClassAssignment({0, 0, 0, 0, 0});
	timetable5.addClassAssignment({0, 0, 0, 0, 0});
	timetable5.addClassAssignment({0, 0, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable5.rooms) == 0);

	Timetable timetable6(5);
	// timetable6 should break the constraint
	timetable6.addClassAssignment({0, 0, 0, 1, 1});
	timetable6.addClassAssignment({0, 0, 0, 3, 1});
	timetable6.addClassAssignment({0, 0, 0, 0, 0});
	timetable6.addClassAssignment({0, 0, 0, 0, 0});
	timetable6.addClassAssignment({0, 0, 0, 2, 0});
	timetable6.addClassAssignment({0, 0, 0, 2, 0});
	timetable6.addClassAssignment({0, 0, 0, 4, 0});

	assert(ObjectiveFunction().hasConflictingTimeslots(timetable6.rooms) == 3);

	std::cout << "testTimeSlotConflict All tests passed!" << std::endl;
}

void testHasConflictingTeacherAssignments() {
	Timetable timetable(5);

	timetable.addClassAssignment({0, 0, 0, 0, 0});
	timetable.addClassAssignment({0, 1, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable.teachers) == 1);

	Timetable timetable2(5);

	timetable2.addClassAssignment({0, 0, 0, 0, 0});
	timetable2.addClassAssignment({1, 1, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable2.teachers) == 0);

	Timetable timetable3(5);

	timetable3.addClassAssignment({0, 1, 0, 0, 0});
	timetable3.addClassAssignment({1, 1, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable3.teachers) == 0);

	std::cout << "conflicting Teacher Assignments All tests passed!" << std::endl;
}

// int class_id;
// int teacher_id;  // Reference to the teacher by
// int section_id;
// int room_id;
// int timeslot;

#ifdef TEST_MODE
int main() {
	// testTimeSlotConflict();
	testHasConflictingTeacherAssignments();
}
#endif

struct Bee {
	Timetable timetable;
	int cost;

	Bee(int num_rooms) : timetable(num_rooms), cost(std::numeric_limits<int>::max()) {}
};

Bee generateRandomTimetable(int num_classes, int num_teachers, int num_rooms, int num_timeslots, const ObjectiveFunction& objFunc) {
	Bee newBee(num_classes);

	std::default_random_engine generator;
	std::uniform_int_distribution<int> teacher_dist(0, num_teachers - 1);
	std::uniform_int_distribution<int> room_dist(0, num_rooms - 1);
	std::uniform_int_distribution<int> timeslot_dist(0, num_timeslots - 1);

	for (int i = 0; i < num_classes; ++i) {
		SchoolClass schoolClass;
		schoolClass.class_id = i;
		schoolClass.teacher_id = teacher_dist(generator);
		schoolClass.room_id = room_dist(generator);
		schoolClass.timeslot = timeslot_dist(generator);

		newBee.timetable.addClassAssignment(schoolClass);
	}

	// Assume evaluateTimetable is a function that calculates the cost of the timetable
	newBee.cost = objFunc.evaluate(newBee.timetable);
	return newBee;
}

void onlookerBeePhase(std::vector<Bee>& beesVector, const ObjectiveFunction& objFunc, int num_classes, int num_teachers, int num_rooms, int num_timeslots) {
	std::vector<double> fitnessValues(beesVector.size());

	// Calculate fitness values for all bees
	for (size_t i = 0; i < beesVector.size(); ++i) {
		fitnessValues[i] = 1.0 / (1.0 + beesVector[i].cost);  // Higher cost -> Lower fitness
	}

	std::default_random_engine generator;
	std::uniform_real_distribution<double> distribution(0.0, 1.0);

	// Onlooker bees phase
	for (size_t i = 0; i < beesVector.size(); ++i) {
		double random_value = distribution(generator);
		double sum_fitness = std::accumulate(fitnessValues.begin(), fitnessValues.end(), 0.0);
		double probability_threshold = random_value * sum_fitness;

		double cumulative_probability = 0.0;
		size_t selected_bee_index = 0;
		for (size_t j = 0; j < beesVector.size(); ++j) {
			cumulative_probability += fitnessValues[j];
			if (cumulative_probability >= probability_threshold) {
				selected_bee_index = j;
				break;
			}
		}

		// Generate a new neighbor solution
		Bee newBee = beesVector[selected_bee_index];
		std::uniform_int_distribution<int> teacher_dist(0, num_teachers - 1);
		std::uniform_int_distribution<int> room_dist(0, num_rooms - 1);
		std::uniform_int_distribution<int> timeslot_dist(0, num_timeslots - 1);

		// Modify one of the classes randomly to create a new neighbor
		int class_index = std::uniform_int_distribution<int>(0, num_classes - 1)(generator);
		newBee.timetable.classes[class_index].teacher_id = teacher_dist(generator);
		newBee.timetable.classes[class_index].room_id = room_dist(generator);
		newBee.timetable.classes[class_index].timeslot = timeslot_dist(generator);

		// Recalculate the cost of the new solution
		newBee.cost = objFunc.evaluate(newBee.timetable);

		// Replace the old solution if the new one is better
		if (newBee.cost < beesVector[selected_bee_index].cost) {
			beesVector[selected_bee_index] = newBee;
		}
	}
}

#ifdef _DEBUG
int main() {
	int nrOfExperiments = 1;
	int maxIterations = 500;

	int num_classes = 20;
	int num_rooms = 1;
	int num_timeslots = 1;
	int num_teachers = 10;

	int beesPopulation = 50;
	int beesEmployed = 25;
	int beesOnlooker = 25;
	int beesScout = 1;

	int limit = 1;

	random_device rd;
	mt19937 gen(rd());
	uniform_int_distribution<> random_room(0, num_rooms - 1);
	uniform_int_distribution<> random_timeslot(0, num_timeslots - 1);
	uniform_int_distribution<> random_teacher(0, num_teachers - 1);

	ObjectiveFunction optimizableFunction;
	vector<double> bestCostExperiments(nrOfExperiments, 0);
	double allMeanCost = 0.0;
	double allSDCost = 0.0;

	printf("For function abcTestMine: %d experiments, %d iterations for each experiment, %d classes for each iteration.\n", nrOfExperiments, maxIterations, num_classes);

	Bee bestSolution(num_classes);

	for (int experiment = 0; experiment < nrOfExperiments; experiment++) {
		printf("f");
		vector<Bee> beesVector(beesPopulation, Bee(num_classes));

		for (int i = 0; i < beesPopulation; i++) {
			for (int j = 0; j < num_classes; j++) {
				int room = random_room(gen);
				int timeslot = random_timeslot(gen);
				int teacher = random_teacher(gen);
				beesVector[i].timetable.addClassAssignment({j, teacher, 1, room, timeslot});
			}
			beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable);
			if (beesVector[i].cost <= bestSolution.cost) {
				bestSolution = beesVector[i];
			}
		}

		vector<int> abandonedBees(beesPopulation, 0);
		vector<double> bestCost(maxIterations, 0);

		for (int iter = 0; iter < maxIterations; iter++) {
			for (int i = 0; i < beesEmployed; i++) {
				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(num_classes);
				for (int j = 0; j < num_classes; j++) {
					int room = beesVector[i].timetable.classes[j].room_id;
					int timeslot = beesVector[i].timetable.classes[j].timeslot;
					int teacher = beesVector[i].timetable.classes[j].teacher_id;

					room += (room - beesVector[randomBeesIndex].timetable.classes[j].room_id);
					timeslot += (timeslot - beesVector[randomBeesIndex].timetable.classes[j].timeslot);
					teacher += (teacher - beesVector[randomBeesIndex].timetable.classes[j].teacher_id);

					// Introduce randomness into the values
					if (rand() % 2) room = random_room(gen);
					if (rand() % 2) timeslot = random_timeslot(gen);
					if (rand() % 2) teacher = random_teacher(gen);

					room = min(max(room, 0), num_rooms - 1);
					timeslot = min(max(timeslot, 0), num_timeslots - 1);
					teacher = min(max(teacher, 0), num_teachers - 1);

					newBee.timetable.addClassAssignment({j, teacher, 1, room, timeslot});
				}
				newBee.cost = optimizableFunction.evaluate(newBee.timetable);

				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}

			// for (int i = 0; i < beesVector.size(); i++) {
			// 	for (int j = 0; j < num_classes; j++) {
			// 		int room = beesVector[i].timetable.classes[j].room_id;
			// 		int timeslot = beesVector[i].timetable.classes[j].timeslot;

			// 		std::cout << "FF " << room << " " << timeslot << std::endl;
			// 	}
			// }

			vector<double> fitnessValues(beesEmployed, 0);
			double fSum = 0;
			double averageCost = 0;
			for (int i = 0; i < beesEmployed; i++) {
				averageCost += beesVector[i].cost;
			}
			averageCost /= beesEmployed;

			for (int i = 0; i < beesEmployed; i++) {
				fitnessValues[i] = exp(-beesVector[i].cost / averageCost);
				fSum += fitnessValues[i];
			}

			vector<double> prob(beesEmployed, 0);
			for (int i = 0; i < beesEmployed; i++) {
				prob[i] = fitnessValues[i] / fSum;
			}

			auto fitnessProportionateSelection = [&](const vector<double>& prob) {
				double r = static_cast<double>(rand()) / RAND_MAX;
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

				Bee newBee(num_classes);
				for (int j = 0; j < num_classes; j++) {
					int room = beesVector[i].timetable.classes[j].room_id;
					int timeslot = beesVector[i].timetable.classes[j].timeslot;
					int teacher = beesVector[i].timetable.classes[j].teacher_id;

					room += (room - beesVector[randomBeesIndex].timetable.classes[j].room_id);
					timeslot += (timeslot - beesVector[randomBeesIndex].timetable.classes[j].timeslot);
					teacher += (teacher - beesVector[randomBeesIndex].timetable.classes[j].teacher_id);

					// Introduce randomness into the values
					if (rand() % 2) room = random_room(gen);
					if (rand() % 2) timeslot = random_timeslot(gen);
					if (rand() % 2) teacher = random_teacher(gen);

					room = min(max(room, 0), num_rooms - 1);
					timeslot = min(max(timeslot, 0), num_timeslots - 1);
					teacher = min(max(teacher, 0), num_teachers - 1);
					newBee.timetable.addClassAssignment({j, teacher, 1, room, timeslot});
				}
				newBee.cost = optimizableFunction.evaluate(newBee.timetable);

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
						for (int j = 0; j < num_classes; j++) {
							int room = random_room(gen);
							int timeslot = random_timeslot(gen);
							int teacher = random_teacher(gen);
							beesVector[i] = generateRandomTimetable(num_classes, num_teachers, num_rooms, num_timeslots, optimizableFunction);
						}
						beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable);
						abandonedBees[i] = 0;
					}
				}
			}

			for (int i = 0; i < beesEmployed; i++) {
				if (beesVector[i].cost <= bestSolution.cost) {
					bestSolution = beesVector[i];
				}
			}

			// bestCost[it] = bestSolution.cost;
			// if (it == maxIterations - 1) {
			// 	bestCostExperiments[experiment] = bestCost[it];
			// 	std::cout << "Best cost for experiment " << experiment << ": " << bestCostExperiments[experiment] << endl;
			// }
		}
	}

	// for (int i = 0; i < nrOfExperiments; i++) {
	// 	allMeanCost += bestCostExperiments[i];
	// }
	// allMeanCost /= nrOfExperiments;

	// double variance = 0.0;
	// for (int i = 0; i < nrOfExperiments; i++) {
	// 	variance += pow(bestCostExperiments[i] - allMeanCost, 2);
	// }
	// variance /= nrOfExperiments;

	// allSDCost = sqrt(variance);

	// std::cout << "Mean cost: " << allMeanCost << endl;
	// std::cout << "SD cost: " << allSDCost << endl;
	// std::cout << endl
	//           << "-----------------------------------------------" << endl
	//           << endl;

	std::cout << "Best solution: cost " << bestSolution.cost << endl;
	for (int i = 0; i < bestSolution.timetable.classes.size(); i++) {
		cout << bestSolution.timetable.classes[i].room_id << " " << bestSolution.timetable.classes[i].timeslot << endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable) << endl;

	return 0;
}
#endif