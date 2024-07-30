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

// todo: make int into bits when necessary

struct ClassRoom {
	int room_id;
	int school_class_id;
	int timeslot;
};

struct Teacher {
	int teacher_id;
	int school_class_id;
	int timeslot;
};

// struct TeacherAvailability {

// };

// struct TeacherRanking {

// };

struct Curriculum {
	int curriculum_id;
	std::vector<int> subjects;
	std::vector<int> sections;
};

// {math, english}, section1
// {math, science}, section2

struct SubjectTimeslot {
	int subject_id;
	int timeslot;
	int teacher_id;
};

struct SchoolClass {
	int school_class_id;
	int section_id;
	int subject_id;
	int teacher_id;
	int room_id;
	int timeslot;
};

struct Section {
	int section_id;
	int school_class_id;
};

// initializiation example
// curriculum = [

// // // // // //
// // // // // // // // // // // //
// // // // // // // // // // // // // // // // // //
// // // // // // GLOBAL VARiABLES // // // // // // // // // // // //

int NUM_CURRICULUM = 2;
int NUM_TEACHER = 3;
int NUM_ROOM = 8;
int NUM_TIMESLOT = 5;
std::vector<Curriculum> CURRICULUM_EXAMPLE = {{0, {1, 2, 3}, {1, 2}}, {1, {4, 5, 6}, {3, 4, 5}}};

// // // // // // GLOBAL VARiABLES // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // //
// // // // // // // // // // // //
// // // // // //

struct Timetable {
	// classes pertains to class being done in a given timeslot with a given teacher in a given room
	std::vector<Curriculum> curriculums;
	std::unordered_map<int, Section> sections;
	std::unordered_map<int, Teacher> teachers;  // num_teachers * num_timeslots
	std::unordered_map<int, ClassRoom> classrooms;
	std::unordered_map<int, SchoolClass> schoolClasses;

	// curriculum is list of subjects, section count is dependent on this

	Timetable(int num_curriculum = NUM_CURRICULUM,
	          int num_teachers = NUM_TEACHER,
	          int num_rooms = NUM_ROOM,
	          int num_timeslots = NUM_TIMESLOT) {  // timeslots is same for all (temp)

		curriculums.reserve(num_curriculum);

		// initialize teachers
		for (int i = 0; i < num_teachers; i++) {
			for (int j = 0; j < num_timeslots; j++) {
				teachers[i * num_timeslots + j] = {i, -1, j};
			}
		}

		// initialize classrooms
		for (int i = 0; i < num_rooms; i++) {
			for (int j = 0; j < num_timeslots; j++) {
				classrooms[i * num_timeslots + j] = {i, -1, j};
			};
		}
	}

	void addCurriculum(const std::vector<Curriculum>& added_curriculums = CURRICULUM_EXAMPLE) {
		int offset = 0;

		for (const auto& curriculum : added_curriculums) {
			curriculums.push_back(curriculum);

			// initialize sections
			for (int curriculum_section_id = 0; curriculum_section_id < curriculum.sections.size(); curriculum_section_id++) {
				for (int subject_id = 0; subject_id < curriculum.subjects.size(); subject_id++) {
					int section_id = offset + curriculum_section_id * curriculum.subjects.size() + subject_id;
					sections[section_id] = {curriculum.sections[curriculum_section_id], -1};
				}
			}

			// initialize school class
			for (int curriculum_section_id = 0; curriculum_section_id < curriculum.sections.size(); curriculum_section_id++) {
				for (int subject_id = 0; subject_id < curriculum.subjects.size(); subject_id++) {
					int school_class_id = offset + curriculum_section_id * curriculum.subjects.size() + subject_id;
					schoolClasses[school_class_id] = {school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_section_id], -1, -1, -1};
				}
			}

			offset = curriculum.sections.size() * curriculum.subjects.size();

			// std::cout << "added curriculum" << curriculum.curriculum_id << std::endl;
		}

		// std::cout << "school class size : " << schoolClasses.size() << std::endl;
	}

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int>& distribution_teacher,
	    std::uniform_int_distribution<int>& distribution_room,
	    std::uniform_int_distribution<int>& distribution_timeslot) {
		// std::cout << "size : " << curriculums.size() << std::endl;

		int offset = 0;
		for (const auto& curriculum : curriculums) {
			for (int curriculum_section_id = 0; curriculum_section_id < curriculum.sections.size(); curriculum_section_id++) {
				for (int curriculum_subject_id = 0; curriculum_subject_id < curriculum.subjects.size(); curriculum_subject_id++) {
					int room = distribution_room(gen);
					int timeslot = distribution_timeslot(gen);
					int teacher = distribution_teacher(gen);

					int school_class_id = offset + curriculum_section_id * curriculum.subjects.size() + curriculum_subject_id;

					schoolClasses[school_class_id] = {school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_subject_id], teacher, room, timeslot};

					teachers[teachers.size() + 1] = {teacher, school_class_id, timeslot};
					classrooms[classrooms.size() + 1] = {room, school_class_id, timeslot};
				}
			}

			offset = curriculum.sections.size() * curriculum.subjects.size();
		}
	}

	void updateTimetableUsingDifference(const Timetable& other, int num_rooms = NUM_ROOM, int num_timeslots = NUM_TIMESLOT, int num_teachers = NUM_TEACHER) {
		int offset = 0;
		for (const auto& curriculum : curriculums) {
			for (int curriculum_section_id = 0; curriculum_section_id < curriculum.sections.size(); curriculum_section_id++) {
				for (int curriculum_subject_id = 0; curriculum_subject_id < curriculum.subjects.size(); curriculum_subject_id++) {
					int current_school_class_id = offset + curriculum_section_id * curriculum.subjects.size() + curriculum_subject_id;

					const auto& current_class = schoolClasses[current_school_class_id];
					const auto& other_class = other.schoolClasses.at(current_school_class_id);  // Assuming the same structure

					int room = current_class.room_id + (current_class.room_id - other_class.room_id);
					int timeslot = current_class.timeslot + (current_class.timeslot - other_class.timeslot);
					int teacher = current_class.teacher_id + (current_class.teacher_id - other_class.teacher_id);

					// Clamp the values to stay within valid bounds
					room = std::min(std::max(room, 0), num_rooms - 1);
					timeslot = std::min(std::max(timeslot, 0), num_timeslots - 1);
					teacher = std::min(std::max(teacher, 0), num_teachers - 1);

					schoolClasses[current_school_class_id] = {current_school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_subject_id], teacher, room, timeslot};

					teachers[teachers.size() + 1] = {teacher, current_school_class_id, timeslot};
					classrooms[classrooms.size() + 1] = {room, current_school_class_id, timeslot};
				}
			}

			offset = curriculum.sections.size() * curriculum.subjects.size();
		}
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
	int hasConflictingRoomTimeslots(const std::unordered_map<int, ClassRoom>& rooms) const {
		std::unordered_set<int> class_timeslot;
		std::unordered_set<int> room_timeslot_set;
		int conflicting_timeslots = 0;
		int conflicting_rooms = 0;

		for (const auto& pair : rooms) {
			if (pair.second.school_class_id == -1) continue;

			const ClassRoom& room = pair.second;
			if (!class_timeslot.insert(combine(room.school_class_id, room.timeslot)).second) {
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

	int hasConflictingTeacherAssignments(const std::unordered_map<int, Teacher>& teachers) const {
		std::unordered_set<int> teacher_assignment_set;
		std::unordered_set<int> teacher_timeslot_set;
		int conflicting_assignments = 0;
		int conflicting_timeslots = 0;

		for (const auto& pair : teachers) {
			if (pair.second.school_class_id == -1) continue;

			const Teacher& teacher = pair.second;

			if (!teacher_assignment_set.insert(combine(teacher.school_class_id, teacher.timeslot)).second) {
				conflicting_assignments++;
			}

			if (!teacher_timeslot_set.insert(combine(teacher.teacher_id, teacher.timeslot)).second) {
				conflicting_timeslots++;
			}
		}

		// std::cout << "teacher assignment conflict : " << conflicting_timeslots << std::endl;
		// std::cout << "teacher timeslot conflict : " << conflicting_assignments << std::endl;
		// std::cout << "+ conflict : " << conflicting_timeslots + conflicting_assignments << std::endl;
		return conflicting_timeslots + conflicting_assignments;
	}

	double evaluate(const Timetable& timetable, bool show_penalty = false) const {
		int conflictingRoomTimeslots = hasConflictingRoomTimeslots(timetable.classrooms);
		int conflictingTeacherAssignments = hasConflictingTeacherAssignments(timetable.teachers);
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
	Timetable timetable;
	timetable.addCurriculum();
	timetable.classrooms[1] = {1, 1, 1};
	timetable.classrooms[2] = {1, 1, 2};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable.classrooms) == 0);

	Timetable timetable2;
	timetable2.addCurriculum();
	timetable2.classrooms[0] = {1, 1, 1};
	timetable2.classrooms[1] = {1, 2, 1};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable2.classrooms) == 1);

	Timetable timetable3;
	timetable3.addCurriculum();
	timetable3.classrooms[0] = {1, 1, 1};
	timetable3.classrooms[1] = {1, 1, 1};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable3.classrooms) == 2);

	Timetable timetable4;
	timetable4.addCurriculum();
	timetable4.classrooms[0] = {0, 1, 1};
	timetable4.classrooms[1] = {1, 1, 1};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable4.classrooms) == 1);

	Timetable timetable5;
	timetable5.addCurriculum();
	timetable5.classrooms[0] = {0, 1, 1};
	timetable5.classrooms[1] = {1, 2, 1};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable5.classrooms) == 0);

	Timetable timetable6;
	timetable6.addCurriculum();
	timetable6.classrooms[0] = {0, 1, 1};
	timetable6.classrooms[1] = {1, 1, 2};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable6.classrooms) == 0);

	Timetable timetable7;
	timetable7.addCurriculum();
	timetable7.classrooms[0] = {1, 1, 1};
	timetable7.classrooms[1] = {1, 1, 2};
	timetable7.classrooms[2] = {1, 1, 3};
	assert(ObjectiveFunction().hasConflictingRoomTimeslots(timetable7.classrooms) == 0);

	std::cout << "testTimeSlotConflict All tests passed!" << std::endl;
}

void testHasConflictingTeacherAssignments() {
	Timetable timetable;
	timetable.addCurriculum();
	timetable.teachers[1] = {1, 1, 1};
	timetable.teachers[2] = {1, 1, 2};
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable.teachers) == 0);

	Timetable timetable2;
	timetable2.addCurriculum();
	timetable2.teachers[1] = {1, 1, 1};
	timetable2.teachers[2] = {1, 1, 1};
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable2.teachers) == 2);

	Timetable timetable3;
	timetable3.addCurriculum();
	timetable3.teachers[1] = {1, 1, 1};
	timetable3.teachers[2] = {1, 2, 1};
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable3.teachers) == 1);

	std::cout << "conflicting Teacher Assignments All tests passed!" << std::endl;
}

void testTimeTableInit() {
	Timetable timetable;
	timetable.addCurriculum();

	random_device rd;
	mt19937 gen(rd());
	std::uniform_int_distribution<int> random_room(0, NUM_ROOM - 1);
	std::uniform_int_distribution<int> random_timeslot(0, NUM_TIMESLOT - 1);
	std::uniform_int_distribution<int> random_teacher(0, NUM_TEACHER - 1);

	timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot);
	timetable.updateTimetableUsingDifference(timetable);

	for (int i = 0; i < timetable.schoolClasses.size(); i++) {
		std::cout
		    << std::setw(4) << timetable.schoolClasses[i].school_class_id
		    << std::setw(4) << timetable.schoolClasses[i].section_id
		    << std::setw(4) << timetable.schoolClasses[i].subject_id
		    << std::setw(4) << timetable.schoolClasses[i].teacher_id
		    << std::setw(4) << timetable.schoolClasses[i].room_id
		    << std::setw(4) << timetable.schoolClasses[i].timeslot << std::endl;
	};

	timetable.updateTimetableUsingDifference(timetable);

	std::cout << "F" << std::endl;
	for (int i = 0; i < timetable.schoolClasses.size(); i++) {
		std::cout
		    << std::setw(4) << timetable.schoolClasses[i].school_class_id
		    << std::setw(4) << timetable.schoolClasses[i].section_id
		    << std::setw(4) << timetable.schoolClasses[i].subject_id
		    << std::setw(4) << timetable.schoolClasses[i].teacher_id
		    << std::setw(4) << timetable.schoolClasses[i].room_id
		    << std::setw(4) << timetable.schoolClasses[i].timeslot << std::endl;
	};

	// std::cout << "teachers" << std::endl;
	// for (int i = 0; i < timetable.teachers.size(); i++) {
	// 	std::cout
	// 	    << std::setw(4) << timetable.teachers[i].teacher_id
	// 	    << std::setw(4) << timetable.teachers[i].school_class_id
	// 	    << std::setw(4) << timetable.teachers[i].timeslot << std::endl;
	// };

	// std::cout << "classrooms" << std::endl;
	// for (int i = 0; i < timetable.classrooms.size(); i++) {
	// 	std::cout
	// 	    << std::setw(4) << timetable.classrooms[i].room_id
	// 	    << std::setw(4) << timetable.classrooms[i].school_class_id
	// 	    << std::setw(4) << timetable.classrooms[i].timeslot << std::endl;
	// };

	// std::cout << "sections" << std::endl;
	// for (int i = 0; i < timetable.sections.size(); i++) {
	// 	std::cout << std::setw(4) << timetable.sections[i].school_class_id << std::endl;
	// };
}

#ifdef TEST_MODE
int main() {
	testTimeTableInit();
	// testTimeSlotConflict();
	// testHasConflictingTeacherAssignments();
	// testConflictingClassTime();
	// testCombineInteger();
}
#endif

struct Bee {
	Timetable timetable;
	int cost;

	Bee(int num_curriculum) : timetable(num_curriculum), cost(std::numeric_limits<int>::max()) {}
};

Bee generateRandomTimetable(int num_curriculum = NUM_CURRICULUM,
                            int num_teachers = NUM_TEACHER,
                            int num_rooms = NUM_ROOM,
                            int num_timeslots = NUM_TIMESLOT,
                            const ObjectiveFunction& objFunc = ObjectiveFunction()) {
	Bee newBee(num_curriculum);

	random_device rd;
	mt19937 gen(rd());
	std::uniform_int_distribution<int> teacher_dist(0, num_teachers - 1);
	std::uniform_int_distribution<int> room_dist(0, num_rooms - 1);
	std::uniform_int_distribution<int> timeslot_dist(0, num_timeslots - 1);

	newBee.timetable.addCurriculum();
	newBee.timetable.initializeRandomTimetable(gen, teacher_dist, room_dist, timeslot_dist);

	return newBee;
}

#ifdef _DEBUG
int main() {
	int nrOfExperiments = 1;
	int maxIterations = 2000;
	// section instead of classes, with predefined subjects

	int beesPopulation = 1000;
	int beesEmployed = 500;
	int beesOnlooker = 500;
	int beesScout = 450;

	int limit = 2000;

	random_device rd;
	mt19937 gen(rd());
	std::uniform_int_distribution<int> random_room(0, NUM_ROOM - 1);
	std::uniform_int_distribution<int> random_timeslot(0, NUM_TIMESLOT - 1);
	std::uniform_int_distribution<int> random_teacher(0, NUM_TEACHER - 1);

	ObjectiveFunction optimizableFunction;
	vector<double> bestCostExperiments(nrOfExperiments, 0);
	double allMeanCost = 0.0;
	double allSDCost = 0.0;

	printf("For function abcTestMine: %d experiments, %d iterations for each experiment, %d classes for each iteration.\n", nrOfExperiments, maxIterations);

	Bee bestSolution(NUM_CURRICULUM);
	bestSolution.timetable.addCurriculum();
	bestSolution.timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot);

	auto start = std::chrono::high_resolution_clock::now();

	for (int experiment = 0; experiment < nrOfExperiments; experiment++) {
		printf("f");
		vector<Bee> beesVector(beesPopulation, Bee(NUM_CURRICULUM));

		for (int i = 0; i < beesPopulation; i++) {
			beesVector[i].timetable.addCurriculum();
			beesVector[i].timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot);

			beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable);
			if (beesVector[i].cost <= bestSolution.cost) {
				bestSolution = beesVector[i];
			}
		}

		// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
		// for (int i = 0; i < beesVector.size(); i++) {
		// 	std::cout << "schol calsses()" << beesVector[i].timetable.schoolClasses.size() << std::endl;
		// 	for (int j = 0; j < beesVector[i].timetable.schoolClasses.size(); j++) {
		// 		std::cout
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].school_class_id
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].section_id
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].subject_id
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].teacher_id
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].room_id
		// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].timeslot << std::endl;
		// 	}
		// }
		// std::this_thread::sleep_for(std::chrono::milliseconds(1000));

		vector<int> abandonedBees(beesPopulation, 0);
		vector<double> bestCost(maxIterations, 0);

		for (int iter = 0; iter < maxIterations; iter++) {
			for (int i = 0; i < beesEmployed; i++) {
				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(NUM_CURRICULUM);
				newBee.timetable.addCurriculum();
				newBee.timetable.updateTimetableUsingDifference(beesVector[randomBeesIndex].timetable);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable);

				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}

			// stop time for 1 sec

			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// std::cout << "beesVector.size()" << beesVector.size() << std::endl;
			// for (int i = 0; i < beesVector.size(); i++) {
			// 	std::cout << "schol calsses()" << beesVector[i].timetable.schoolClasses.size() << std::endl;
			// 	for (int j = 0; j < beesVector[i].timetable.schoolClasses.size(); j++) {
			// 		std::cout
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].school_class_id
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].section_id
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].subject_id
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].teacher_id
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].room_id
			// 		    << std::setw(4) << beesVector[i].timetable.schoolClasses[j].timeslot << std::endl;
			// 	}
			// }
			// std::this_thread::sleep_for(std::chrono::milliseconds(1000));

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

				Bee newBee(NUM_CURRICULUM);
				newBee.timetable.addCurriculum();

				newBee.timetable.updateTimetableUsingDifference(beesVector[randomBeesIndex].timetable);

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

						int room = random_room(gen);
						int timeslot = random_timeslot(gen);
						int teacher = random_teacher(gen);
						beesVector[i] = generateRandomTimetable(NUM_CURRICULUM, NUM_TEACHER, NUM_ROOM, NUM_TIMESLOT, optimizableFunction);

						beesVector[i].cost = optimizableFunction.evaluate(beesVector[i].timetable);
						abandonedBees[i] = 0;
					}
				}
			}

			for (int i = 0; i < beesEmployed; i++) {
				if (beesVector[i].cost <= bestSolution.cost) {
					// std::cout << "Best asdfdsfasdfsolution:" << std::endl;
					// for (int i = 0; i < beesVector[i].timetable.schoolClasses.size(); i++) {
					// 	std::cout
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].school_class_id
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].section_id
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].subject_id
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].teacher_id
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].room_id
					// 	    << std::setw(4) << beesVector[i].timetable.schoolClasses[i].timeslot << std::endl;
					// }

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
	for (int i = 0; i < bestSolution.timetable.schoolClasses.size(); i++) {
		std::cout
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].school_class_id
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].section_id
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].subject_id
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].teacher_id
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].room_id
		    << std::setw(4) << bestSolution.timetable.schoolClasses[i].timeslot << std::endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable) << endl;

	ObjectiveFunction().evaluate(bestSolution.timetable, true);

	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;
	return 0;
}
#endif