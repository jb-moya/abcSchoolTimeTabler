#include <bits/stdc++.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <cassert>
#include <chrono>
#include <cmath>
#include <iomanip>  // Include for std::setw
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>

using namespace std;

// #define TEST_MODE
#define _DEBUG

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
	// classes pertains to class being done in a given timeslot with a given teacher in a given room
	std::vector<SchoolClass> classes;
	std::unordered_map<int, Teacher> teachers;  // unique teachers
	std::unordered_map<int, ClassRoom> rooms;

	Timetable(int num_classes) {
		classes.reserve(num_classes);
	}

	void addClassAssignment(const SchoolClass& schoolClass) {
		classes.push_back(schoolClass);
		teachers[schoolClass.teacher_id].teacher_id = schoolClass.teacher_id;
		teachers[schoolClass.teacher_id].school_class_ids.push_back(schoolClass.class_id);

		for (const auto& pair : teachers) {
			const Teacher& teacher = pair.second;
		}
		// code smell
		rooms[rooms.size() + 1] = {schoolClass.room_id, schoolClass.class_id, schoolClass.timeslot};
	}
};

int combine(int class_id, int time_slot) {
	return (class_id << 16) | time_slot;  // Assuming class_id and time_slot are 16-bit integers
}

std::uint32_t combine(std::uint32_t class_id, std::uint32_t time_slot, std::uint32_t teacher_id) {
	return (class_id << 20) | (time_slot << 10) | teacher_id;  // Assuming each is 10-bit
}

std::uint64_t combine(std::uint32_t a, std::uint32_t b, std::uint32_t c, std::uint32_t d) {
	return (static_cast<std::uint64_t>(a) << 48) | (static_cast<std::uint64_t>(b) << 32) | (static_cast<std::uint64_t>(c) << 16) | d;
}

struct ObjectiveFunction {
	// class
	// - same class cannot be in the different room at different timeslot

	// room
	// every room should have a unique combination of class_id and timeslot V
	// every class should have a unique combination of room_id and timeslot V

	// teacher
	// - same teacher cannot be in the different class at different timeslot

	// todo: inspect if there will be code smell on implementing these function
	// splitting integer

	// for every unique rooms, combination of class_id and timeslot must be unique
	// a class should not have same timeslots in the different rooms
	// room 1 -> class 1, timeslot 1
	// room 1 -> class 1, timeslot 2
	// room 1 -> class 2, timeslot 1
	// room 1 -> class 2, timeslot 2 <- conflicting
	// room 2 -> class 2, timeslot 1 <- conflicting

	int hasConflictingRoomTimeslots(const std::unordered_map<int, ClassRoom>& rooms) const {
		std::unordered_set<int> class_timeslot;
		std::unordered_set<int> room_timeslot_set;
		int conflicting_rooms = 0;
		int conflicting_timeslots = 0;

		for (const auto& pair : rooms) {
			const ClassRoom& room = pair.second;
			if (!class_timeslot.insert(combine(room.class_id, room.timeslot)).second) {
				conflicting_timeslots++;
			}

			if (!room_timeslot_set.insert(combine(room.room_id, room.timeslot)).second) {
				conflicting_rooms++;
			}
		}

		// std::cout << "class_timeslot conflict : " << conflicting_timeslots << std::endl;
		// std::cout << "room_timeslot_set conflict : " << conflicting_rooms << std::endl;
		// std::cout << "+ conflict : " << conflicting_timeslots + conflicting_rooms << std::endl;
		return conflicting_timeslots + conflicting_rooms;
	}

	int hasConflictingTeacherAssignments(const Timetable& timetable) const {
		std::unordered_set<int> class_assignment_set;
		int conflicting_timeslots = 0;

		for (const auto& pair : timetable.teachers) {
			const Teacher& teacher = pair.second;

			for (const auto& school_class_id : teacher.school_class_ids) {
				SchoolClass school_class = timetable.classes[school_class_id];

				// std::cout << teacher.teacher_id << " " << school_class_id << " " << school_class.timeslot << std::endl;
				if (!class_assignment_set.insert(combine(teacher.teacher_id, school_class_id, school_class.timeslot)).second) {
					conflicting_timeslots++;
				}
			}
		}

		// std::cout << "teacher assignment conflict : " << conflicting_timeslots << std::endl;
		return conflicting_timeslots;
	}

	double evaluate(const Timetable& timetable, bool show_penalty = false) const {
		int conflictingRoomTimeslots = hasConflictingRoomTimeslots(timetable.rooms);
		int conflictingTeacherAssignments = hasConflictingTeacherAssignments(timetable);
		int conflictingClassTime = 0;

		if (show_penalty) {
			std::cout << "penalties" << std::endl;
			std::cout << "RoomTimeslots: " << conflictingRoomTimeslots << std::endl;
			std::cout << "TeacherAssignments: " << conflictingTeacherAssignments << std::endl;
			std::cout << "ClassTime: " << conflictingClassTime << std::endl;
		}

		return conflictingRoomTimeslots + conflictingTeacherAssignments + conflictingClassTime;
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

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable.rooms) == 0);

	Timetable timetable3(5);
	// timetable3 should break the constraint
	timetable3.addClassAssignment({0, 0, 0, 0, 0});
	timetable3.addClassAssignment({0, 0, 0, 1, 0});
	timetable3.addClassAssignment({0, 0, 0, 2, 1});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable3.rooms) == 1);

	Timetable timetable4(5);
	// timetable4 should break the constraint

	// differenct classse
	// timetable4.addClassAssignment({0, 0, 0, 0, 0});
	// timetable4.addClassAssignment({1, 0, 0, 0, 1});
	// timetable4.addClassAssignment({2, 0, 0, 0, 2});

	// timetable4.addClassAssignment({3, 0, 0, 1, 0});
	// timetable4.addClassAssignment({4, 0, 0, 1, 1});
	// timetable4.addClassAssignment({5, 0, 0, 1, 2});

	// should be zero if same classes
	timetable4.addClassAssignment({0, 0, 0, 0, 0});
	timetable4.addClassAssignment({0, 0, 0, 0, 1});
	timetable4.addClassAssignment({0, 0, 0, 0, 2});

	timetable4.addClassAssignment({1, 0, 0, 1, 0});
	timetable4.addClassAssignment({1, 0, 0, 1, 1});
	timetable4.addClassAssignment({1, 0, 0, 1, 2});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable4.rooms) == 0);

	Timetable timetable5(5);
	timetable5.addClassAssignment({0, 0, 0, 0, 0});
	timetable5.addClassAssignment({0, 0, 0, 0, 0});
	timetable5.addClassAssignment({0, 0, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable5.rooms) == 4);

	Timetable timetable6(5);
	// timetable6 should break the constraint
	timetable6.addClassAssignment({0, 0, 0, 0, 1});
	timetable6.addClassAssignment({0, 0, 0, 1, 1});

	int result = ObjectiveFunction().hasConflictingRoomTimeslots(timetable6.rooms);
	std::cout << "result " << result << std::endl;
	assert(result == 1);

	std::cout << "7" << std::endl;
	Timetable timetable7(5);
	// timetable7 should break the constraint
	timetable7.addClassAssignment({1, 0, 0, 0, 1});
	timetable7.addClassAssignment({1, 0, 0, 1, 1});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable7.rooms) == 1);

	Timetable timetable8(5);
	// timetable8 should break the constraint
	timetable8.addClassAssignment({1, 0, 0, 0, 1});
	timetable8.addClassAssignment({1, 0, 0, 1, 2});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable8.rooms) == 0);

	Timetable timetable9(5);
	// timetable9 should break the constraint
	timetable9.addClassAssignment({1, 0, 0, 0, 1});
	timetable9.addClassAssignment({1, 0, 0, 1, 1});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable9.rooms) == 1);

	Timetable timetable2(5);
	// timetable2 should break the constraint
	// 1. same class at same timeslot at different rooms
	timetable2.addClassAssignment({0, 0, 0, 0, 0});
	timetable2.addClassAssignment({0, 0, 0, 1, 0});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable2.rooms) == 1);

	Timetable timetable10(5);

	timetable10.addClassAssignment({0, 0, 0, 1, 0});
	timetable10.addClassAssignment({1, 0, 0, 1, 0});
	timetable10.addClassAssignment({2, 0, 0, 1, 0});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable10.rooms) == 2);

	Timetable timetable11(5);

	timetable11.addClassAssignment({0, 0, 0, 0, 0});
	timetable11.addClassAssignment({0, 0, 0, 0, 1});
	timetable11.addClassAssignment({0, 0, 0, 1, 0});
	timetable11.addClassAssignment({0, 0, 0, 1, 1});
	timetable11.addClassAssignment({1, 0, 0, 0, 0});
	timetable11.addClassAssignment({1, 0, 0, 0, 1});
	timetable11.addClassAssignment({1, 0, 0, 1, 0});
	timetable11.addClassAssignment({1, 0, 0, 1, 1});
	timetable11.addClassAssignment({2, 0, 0, 0, 0});
	timetable11.addClassAssignment({2, 0, 0, 0, 1});
	timetable11.addClassAssignment({2, 0, 0, 1, 0});
	timetable11.addClassAssignment({2, 0, 0, 1, 1});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable11.rooms) == 14);

	Timetable timetable12(5);
	timetable12.addClassAssignment({0, 0, 0, 0, 0});
	timetable12.addClassAssignment({0, 0, 0, 0, 1});
	timetable12.addClassAssignment({0, 0, 0, 1, 2});
	timetable12.addClassAssignment({0, 0, 0, 1, 3});
	timetable12.addClassAssignment({1, 0, 0, 2, 0});
	timetable12.addClassAssignment({1, 0, 0, 2, 1});
	timetable12.addClassAssignment({1, 0, 0, 3, 2});
	timetable12.addClassAssignment({1, 0, 0, 3, 3});
	timetable12.addClassAssignment({2, 0, 0, 4, 0});
	timetable12.addClassAssignment({2, 0, 0, 4, 1});
	timetable12.addClassAssignment({2, 0, 0, 5, 2});
	timetable12.addClassAssignment({2, 0, 0, 5, 3});

	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable12.rooms) == 0);

	std::cout << "testTimeSlotConflict All tests passed!" << std::endl;
}
// int class_id;
// int teacher_id;
// int section_id;
// int room_id;
// int timeslot;
void testHasConflictingTeacherAssignments() {
	Timetable timetable(5);

	timetable.addClassAssignment({0, 0, 0, 0, 0});
	timetable.addClassAssignment({0, 1, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable) == 0);

	Timetable timetable4(5);

	timetable4.addClassAssignment({0, 0, 0, 0, 0});
	timetable4.addClassAssignment({0, 0, 0, 0, 1});

	int result = ObjectiveFunction().hasConflictingTeacherAssignments(timetable);
	// std::cout << "conflicting Teacher Assignments: " << result << std::endl;
	assert(result == 0);

	Timetable timetable2(5);

	timetable2.addClassAssignment({0, 0, 0, 0, 0});
	timetable2.addClassAssignment({1, 1, 0, 0, 0});

	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable2) == 1);

	Timetable timetable3(5);

	timetable3.addClassAssignment({0, 1, 0, 0, 0});
	timetable3.addClassAssignment({1, 1, 0, 0, 0});

	result = ObjectiveFunction().hasConflictingTeacherAssignments(timetable);
	std::cout << "conflicting Teacher Assignments: " << result << std::endl;
	assert(result == 0);

	std::cout << "conflicting Teacher Assignments All tests passed!" << std::endl;
}

void testCombineInteger() {
	int result = combine(0, 0, 0);
	assert(result == 0);

	result = combine(0, 0, 1);
	std::cout << "result: " << result << std::endl;

	result = combine(0, 1, 0);
	std::cout << "result: " << result << std::endl;

	result = combine(0, 1, 1);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 0, 0);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 0, 1);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 0);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 1);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 2);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 3);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 4);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 10);
	std::cout << "result: " << result << std::endl;

	result = combine(1, 1, 100000000);
	std::cout << "result: " << result << std::endl;

	std::cout << "testCombineInteger All tests passed!" << std::endl;
}

#ifdef TEST_MODE
int main() {
	testTimeSlotConflict();
	// testConflictingClassTime();
	// testHasConflictingTeacherAssignments();
	// testCombineInteger();
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

// void onlookerBeePhase(std::vector<Bee>& beesVector, const ObjectiveFunction& objFunc, int num_classes, int num_teachers, int num_rooms, int num_timeslots) {
// 	std::vector<double> fitnessValues(beesVector.size());

// 	// Calculate fitness values for all bees
// 	for (size_t i = 0; i < beesVector.size(); ++i) {
// 		fitnessValues[i] = 1.0 / (1.0 + beesVector[i].cost);  // Higher cost -> Lower fitness
// 	}

// 	std::default_random_engine generator;
// 	std::uniform_real_distribution<double> distribution(0.0, 1.0);

// 	// Onlooker bees phase
// 	for (size_t i = 0; i < beesVector.size(); ++i) {
// 		double random_value = distribution(generator);
// 		double sum_fitness = std::accumulate(fitnessValues.begin(), fitnessValues.end(), 0.0);
// 		double probability_threshold = random_value * sum_fitness;

// 		double cumulative_probability = 0.0;
// 		size_t selected_bee_index = 0;
// 		for (size_t j = 0; j < beesVector.size(); ++j) {
// 			cumulative_probability += fitnessValues[j];
// 			if (cumulative_probability >= probability_threshold) {
// 				selected_bee_index = j;
// 				break;
// 			}
// 		}

// 		// Generate a new neighbor solution
// 		Bee newBee = beesVector[selected_bee_index];
// 		std::uniform_int_distribution<int> teacher_dist(0, num_teachers - 1);
// 		std::uniform_int_distribution<int> room_dist(0, num_rooms - 1);
// 		std::uniform_int_distribution<int> timeslot_dist(0, num_timeslots - 1);

// 		// Modify one of the classes randomly to create a new neighbor
// 		int class_index = std::uniform_int_distribution<int>(0, num_classes - 1)(generator);
// 		newBee.timetable.classes[class_index].teacher_id = teacher_dist(generator);
// 		newBee.timetable.classes[class_index].room_id = room_dist(generator);
// 		newBee.timetable.classes[class_index].timeslot = timeslot_dist(generator);

// 		// Recalculate the cost of the new solution
// 		newBee.cost = objFunc.evaluate(newBee.timetable);

// 		// Replace the old solution if the new one is better
// 		if (newBee.cost < beesVector[selected_bee_index].cost) {
// 			beesVector[selected_bee_index] = newBee;
// 		}
// 	}
// }

#ifdef _DEBUG
int main() {
	int nrOfExperiments = 1;
	int maxIterations = 1000;

	int num_classes = 16;
	int num_rooms = 2;
	int num_timeslots = 8;
	int num_teachers = 2;

	// 15 * 8 = 120

	// 10 * 8  = 80
	// 10 * 10 = 100

	// 2 rooms 8 hourslots -> 16 classes

	int beesPopulation = 500;
	int beesEmployed = 250;
	int beesOnlooker = 250;
	int beesScout = 250;

	int limit = 100;

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

	auto start = std::chrono::high_resolution_clock::now();

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
					// if (rand() % 2) room = random_room(gen);
					// if (rand() % 2) timeslot = random_timeslot(gen);
					// if (rand() % 2) teacher = random_teacher(gen);

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
		std::cout << std::setw(4) << bestSolution.timetable.classes[i].class_id
		          << std::setw(4) << bestSolution.timetable.classes[i].teacher_id
		          << std::setw(4) << bestSolution.timetable.classes[i].room_id
		          << std::setw(4) << bestSolution.timetable.classes[i].timeslot << std::endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable) << endl;

	ObjectiveFunction().evaluate(bestSolution.timetable, true);

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;
	return 0;
}
#endif