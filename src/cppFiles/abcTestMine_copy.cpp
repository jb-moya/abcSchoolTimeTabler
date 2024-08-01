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

// todo: make int into bits when necessary
// struct TeacherAvailability {

// };

// struct TeacherRanking {

// };

struct ClassRoom {
	int16_t room_id;
	int16_t school_class_id;
	int16_t timeslot;
};

struct Teacher {
	int16_t teacher_id;
	int16_t school_class_id;
	int16_t timeslot;
};

struct Curriculum {
	int16_t curriculum_id;
	std::vector<int16_t> subjects;
	std::vector<int16_t> sections;
};

struct SubjectTimeslot {
	int16_t subject_id;
	int16_t timeslot;
	int16_t teacher_id;
};

struct SchoolClass {
	int16_t school_class_id;
	int16_t section_id;
	int16_t subject_id;
	int16_t teacher_id;
	int16_t room_id;
	int16_t timeslot;
};

struct Section {
	int16_t section_id;
	int16_t school_class_id;
};

// struct Teacher {
// 	int16_t teacher_id;
// 	int16_t school_class_id;
// 	int16_t timeslot;
// };
// // // // // //
// // // // // // // // // // // //
// // // // // // // // // // // // // // // // // //
// // // // // // GLOBAL VARiABLES // // // // // // // // // // // //

int16_t NUM_CURRICULUM = 1;
// int16_t NUM_TEACHER = 30;
int16_t NUM_TEACHER = 10;
// int16_t NUM_TEACHER = 5;
// int16_t NUM_TEACHER = 2;
// int16_t NUM_ROOM = 30;
int16_t NUM_ROOM = 10;
// int16_t NUM_ROOM = 5;
// int16_t NUM_ROOM = 5;
// int16_t NUM_ROOM = 2;
int16_t NUM_TIMESLOT = 7;

std::vector<Curriculum> CURRICULUM_EXAMPLE = {
    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}},
    {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}},
    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3, 4, 5}},
    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3}},
    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2}},
    // {1, {1, 2, 3}, {1}}
};

// std::unordered_map<int, std::vector<int>> TEACHER_SUBJECTS = {
//     {0, {1}},
//     {1, {1}},
//     {2, {2, 3}},
//     {3, {1, 2, 3}},
//     {4, {1, 3}},
//     {5, {1, 3}},
//     {6, {3}}};

std::unordered_map<int16_t, std::vector<int16_t>> TEACHER_SUBJECTS = {
    // {0, {3}},
    // {1, {4, 5, 6}},
    // {2, {4, 5, 6}},
    // {3, {4, 5, 6}},
    // {4, {4, 5, 6}},
    // {5, {2}},
    // {6, {1}},
    // {7, {1, 2, 3}},
    // {8, {1, 2, 3}},
    // {9, {1, 2, 3}},
};

// // // // // // GLOBAL VARiABLES // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // //
// // // // // // // // // // // //
// // // // // //

struct Timetable {
	std::vector<Curriculum> curriculums;
	std::vector<Teacher> teachers;
	std::vector<ClassRoom> classrooms;
	std::vector<SchoolClass> schoolClasses;

	Timetable(int16_t& num_curriculum = NUM_CURRICULUM,
	          int16_t& num_teachers = NUM_TEACHER,
	          int16_t& num_rooms = NUM_ROOM,
	          int16_t& num_timeslots = NUM_TIMESLOT) {
		curriculums.reserve(num_curriculum);
		teachers.reserve(num_teachers * num_timeslots);
		classrooms.reserve(num_rooms * num_timeslots);

		// // initialize teachers
		// for (int16_t i = 0; i < num_teachers; i++) {
		// 	for (int16_t j = 0; j < num_timeslots; j++) {
		// 		int16_t teacher_id = i * num_timeslots + j;
		// 		teachers.push_back({teacher_id, -1, j});
		// 	}
		// }

		// // initialize classrooms
		// for (int16_t i = 0; i < num_rooms; i++) {
		// 	for (int16_t j = 0; j < num_timeslots; j++) {
		// 		int16_t classroom_id = i * num_timeslots + j;
		// 		classrooms.push_back({classroom_id, -1, j});
		// 	};
		// }
	}

	void addCurriculum(const std::vector<Curriculum>& added_curriculums = CURRICULUM_EXAMPLE) {
		int16_t offset = 0;

		for (const auto& curriculum : added_curriculums) {
			curriculums.push_back(curriculum);
			int16_t num_sections = static_cast<int16_t>(curriculum.sections.size());
			int16_t num_subjects = static_cast<int16_t>(curriculum.subjects.size());
			int32_t curriculum_size = num_sections * num_subjects;

			// initialize school class
			for (int16_t curriculum_section_id = 0; curriculum_section_id < num_sections; curriculum_section_id++) {
				for (int16_t subject_id = 0; subject_id < num_subjects; subject_id++) {
					int16_t school_class_id = offset + curriculum_section_id * num_subjects + subject_id;
					schoolClasses.push_back({school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_section_id], -1, -1, -1});
				}
			}

			offset += curriculum_size;
		}
	}

	void initializeRandomTimetable(
	    std::mt19937& gen,
	    std::uniform_int_distribution<int16_t>& distribution_teacher,
	    std::uniform_int_distribution<int16_t>& distribution_room,
	    std::uniform_int_distribution<int16_t>& distribution_timeslot) {
		int16_t offset = 0;
		for (const auto& curriculum : curriculums) {
			int16_t num_sections = static_cast<int16_t>(curriculum.sections.size());
			int16_t num_subjects = static_cast<int16_t>(curriculum.subjects.size());
			int32_t curriculum_size = num_sections * num_subjects;

			for (int16_t curriculum_section_id = 0; curriculum_section_id < num_sections; curriculum_section_id++) {
				for (int16_t curriculum_subject_id = 0; curriculum_subject_id < num_subjects; curriculum_subject_id++) {
					int16_t room = distribution_room(gen);
					int16_t timeslot = distribution_timeslot(gen);
					int16_t teacher = distribution_teacher(gen);

					int16_t school_class_id = offset + curriculum_section_id * num_subjects + curriculum_subject_id;

					schoolClasses[school_class_id] = {school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_subject_id], teacher, room, timeslot};

					teachers.push_back({teacher, school_class_id, timeslot});
					classrooms.push_back({room, school_class_id, timeslot});
				}
			}

			offset += curriculum_size;
		}
	}

	// void updateTimetableUsingDifference(const Timetable& other, int num_rooms = NUM_ROOM, int num_timeslots = NUM_TIMESLOT, int num_teachers = NUM_TEACHER) {
	// 	int offset = 0;

	// 	teachers.clear();
	// 	classrooms.clear();

	// 	for (const auto& curriculum : curriculums) {
	// 		int16_t num_sections = static_cast<int16_t>(curriculum.sections.size());
	// 		int16_t num_subjects = static_cast<int16_t>(curriculum.subjects.size());
	// 		int32_t curriculum_size = num_sections * num_subjects;

	// 		for (int16_t curriculum_section_id = 0; curriculum_section_id < num_sections; curriculum_section_id++) {
	// 			for (int16_t curriculum_subject_id = 0; curriculum_subject_id < num_subjects; curriculum_subject_id++) {
	// 				int16_t current_school_class_id = offset + curriculum_section_id * num_subjects + curriculum_subject_id;

	// 				const auto& current_class = schoolClasses[current_school_class_id];
	// 				const auto& other_class = other.schoolClasses.at(current_school_class_id);  // Assuming the same structure

	// 				int16_t room_diff = current_class.room_id - other_class.room_id;
	// 				int16_t timeslot_diff = current_class.timeslot - other_class.timeslot;
	// 				int16_t teacher_diff = current_class.teacher_id - other_class.teacher_id;

	// 				int16_t room = std::clamp<int16_t>(current_class.room_id + room_diff, 0, static_cast<int16_t>(num_rooms - 1));
	// 				int16_t timeslot = std::clamp<int16_t>(current_class.timeslot + timeslot_diff, 0, static_cast<int16_t>(num_timeslots - 1));
	// 				int16_t teacher = std::clamp<int16_t>(current_class.teacher_id + teacher_diff, 0, static_cast<int16_t>(num_teachers - 1));

	// 				schoolClasses[current_school_class_id] = {current_school_class_id, curriculum.sections[curriculum_section_id], curriculum.subjects[curriculum_subject_id], teacher, room, timeslot};

	// 				teachers.push_back({teacher, current_school_class_id, timeslot});
	// 				classrooms.push_back({room, current_school_class_id, timeslot});
	// 			}
	// 		}

	// 		offset += curriculum_size;
	// 	}
	// }

	void updateTimetableUsingDifference(std::mt19937& gen,
	                                    std::uniform_int_distribution<int16_t>& distribution_field,
	                                    std::uniform_int_distribution<int16_t>& distribution_school_class,
	                                    std::uniform_int_distribution<int16_t>& distribution_teacher,
	                                    std::uniform_int_distribution<int16_t>& distribution_room,
	                                    std::uniform_int_distribution<int16_t>& distribution_timeslot) {
		int16_t choice = distribution_field(gen);

		if (choice == 0) {
			schoolClasses[distribution_school_class(gen)].teacher_id = distribution_teacher(gen);
		} else if (choice == 1) {
			schoolClasses[distribution_school_class(gen)].room_id = distribution_room(gen);
		} else if (choice == 2) {
			schoolClasses[distribution_school_class(gen)].timeslot = distribution_timeslot(gen);
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
	int16_t hasConflictingRoomTimeslots(const std::vector<ClassRoom>& rooms) const {
		std::unordered_set<int> class_timeslot;
		std::unordered_set<int> room_timeslot_set;
		int16_t conflicting_timeslots = 0;
		int16_t conflicting_rooms = 0;

		for (const auto& room : rooms) {
			if (room.school_class_id == -1) continue;

			if (!class_timeslot.insert(combine(static_cast<int>(room.school_class_id), static_cast<int>(room.timeslot))).second) {
				conflicting_timeslots++;
			}

			if (!room_timeslot_set.insert(combine(static_cast<int>(room.room_id), static_cast<int>(room.timeslot))).second) {
				conflicting_rooms++;
			}
		}

		// std::cout << "class_timeslot conflict : " << conflicting_timeslots << std::endl;
		// std::cout << "room_timeslot_set conflict : " << conflicting_rooms << std::endl;
		// std::cout << "+ conflict : " << conflicting_timeslots + conflicting_rooms << std::endl;
		return conflicting_timeslots + conflicting_rooms;
	}

	bool isQualified(const int16_t& teacherID, const int16_t& subjectID) const {
		auto it = TEACHER_SUBJECTS.find(teacherID);
		if (it != TEACHER_SUBJECTS.end()) {
			const vector<int16_t>& subjects = it->second;
			return find(subjects.begin(), subjects.end(), subjectID) != subjects.end();
		}
		return true;
	}

	int16_t hasConflictingTeacherAssignments(const std::vector<Teacher>& teachers, const std::vector<SchoolClass>& schoolClasses) const {
		std::unordered_set<int> teacher_class_assignment_set;
		std::unordered_set<int> teacher_timeslot_set;
		int16_t conflicting_assignments = 0;
		int16_t conflicting_timeslots = 0;
		int16_t invalid_teacher_subject_assignment = 0;

		for (const auto& teacher : teachers) {
			if (teacher.school_class_id == -1) continue;

			if (!teacher_class_assignment_set.insert(combine(static_cast<int>(teacher.school_class_id), static_cast<int>(teacher.timeslot))).second) {
				conflicting_assignments++;
			}

			if (!teacher_timeslot_set.insert(combine(static_cast<int>(teacher.teacher_id), static_cast<int>(teacher.timeslot))).second) {
				conflicting_timeslots++;
			}

			const auto& school_class = schoolClasses.at(teacher.school_class_id);
			if (!isQualified(teacher.teacher_id, school_class.subject_id)) {
				std::cout << "invalid teacher subject assignment asdfasdfasdf: " << teacher.teacher_id << " " << school_class.subject_id << std::endl;
				invalid_teacher_subject_assignment++;
			}
		}

		// std::cout << "teacher assignment conflict : " << conflicting_timeslots << std::endl;
		// std::cout << "teacher timeslot conflict : " << conflicting_assignments << std::endl;
		// std::cout << "invalid_teacher_subject_assignment : " << invalid_teacher_subject_assignment << std::endl;
		// std::cout << "+ conflict : " << conflicting_timeslots + conflicting_assignments << std::endl;
		return conflicting_timeslots + conflicting_assignments + invalid_teacher_subject_assignment;
	}

	double evaluate(const Timetable& timetable, bool show_penalty = false) const {
		std::unordered_set<int> class_timeslot;
		std::unordered_set<int> room_timeslot_set;
		std::unordered_set<int> teacher_class_assignment_set;
		std::unordered_set<int> teacher_timeslot_set;

		int16_t conflicting_timeslots = 0;
		int16_t conflicting_rooms = 0;
		int16_t conflicting_assignments = 0;
		int16_t invalid_teacher_subject_assignment = 0;

		for (const auto& school_class : timetable.schoolClasses) {
			if (school_class.room_id == -1 || school_class.teacher_id == -1 || school_class.timeslot == -1) continue;

			if (!class_timeslot.insert(combine(static_cast<int>(school_class.school_class_id), static_cast<int>(school_class.timeslot))).second) {
				conflicting_timeslots++;
			}

			if (!room_timeslot_set.insert(combine(static_cast<int>(school_class.room_id), static_cast<int>(school_class.timeslot))).second) {
				conflicting_rooms++;
			}

			// if (!teacher_class_assignment_set.insert(combine(static_cast<int>(school_class.school_class_id), static_cast<int>(school_class.timeslot))).second) {
			// 	conflicting_assignments++;
			// }

			if (!teacher_timeslot_set.insert(combine(static_cast<int>(school_class.teacher_id), static_cast<int>(school_class.timeslot))).second) {
				conflicting_timeslots++;
			}

			if (!isQualified(school_class.teacher_id, school_class.subject_id)) {
				std::cout << "invalid teacher subject assignment asdfasdfasdf: " << school_class.teacher_id << " " << school_class.subject_id << std::endl;
				invalid_teacher_subject_assignment++;
			}
		}

		return conflicting_timeslots + conflicting_rooms + conflicting_assignments + invalid_teacher_subject_assignment;
	}

	// double evaluate(const Timetable& timetable, bool show_penalty = false) const {
	// 	int16_t conflictingRoomTimeslots = hasConflictingRoomTimeslots(timetable.classrooms);
	// 	int16_t conflictingTeacherAssignments = hasConflictingTeacherAssignments(timetable.teachers, timetable.schoolClasses);

	// 	if (show_penalty) {
	// 		std::cout << "penalties" << std::endl;
	// 		std::cout << "RoomTimeslots: " << conflictingRoomTimeslots << std::endl;
	// 		std::cout << "TeacherAssignments: " << conflictingTeacherAssignments << std::endl;
	// 	}

	// 	return conflictingRoomTimeslots + conflictingTeacherAssignments;
	// }
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
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable.teachers, timetable.schoolClasses) == 0);

	Timetable timetable2;
	timetable2.addCurriculum();
	timetable2.teachers[1] = {1, 1, 1};
	timetable2.teachers[2] = {1, 1, 1};
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable2.teachers, timetable.schoolClasses) == 2);

	Timetable timetable3;
	timetable3.addCurriculum();
	timetable3.teachers[1] = {1, 1, 1};
	timetable3.teachers[2] = {1, 2, 1};
	assert(ObjectiveFunction().hasConflictingTeacherAssignments(timetable3.teachers, timetable.schoolClasses) == 1);

	std::cout << "conflicting Teacher Assignments All tests passed!" << std::endl;
}

void testTimeTableInit() {
	Timetable timetable;
	timetable.addCurriculum();

	random_device rd;
	mt19937 gen(rd());

	int total_school_class = 0;
	for (int i = 0; i < CURRICULUM_EXAMPLE.size(); i++) {
		total_school_class += CURRICULUM_EXAMPLE[i].sections.size() * CURRICULUM_EXAMPLE[i].subjects.size();
	}

	// std::cout << "scjhool class count" << total_school_class << std::endl;

	std::uniform_int_distribution<int16_t> random_field(0, 2);
	std::uniform_int_distribution<int16_t> random_school_class(0, total_school_class - 1);
	std::uniform_int_distribution<int16_t> random_room(0, NUM_ROOM - 1);
	std::uniform_int_distribution<int16_t> random_timeslot(0, NUM_TIMESLOT - 1);
	std::uniform_int_distribution<int16_t> random_teacher(0, NUM_TEACHER - 1);

	timetable.initializeRandomTimetable(gen, random_teacher, random_room, random_timeslot);
	timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_teacher, random_room, random_timeslot);
	// timetable.updateTimetableUsingDifference(timetable);

	for (int16_t i = 0; i < timetable.schoolClasses.size(); i++) {
		std::cout
		    << std::setw(4) << timetable.schoolClasses[i].school_class_id
		    << std::setw(4) << timetable.schoolClasses[i].section_id
		    << std::setw(4) << timetable.schoolClasses[i].subject_id
		    << std::setw(4) << timetable.schoolClasses[i].teacher_id
		    << std::setw(4) << timetable.schoolClasses[i].room_id
		    << std::setw(4) << timetable.schoolClasses[i].timeslot << std::endl;
	};

	timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_teacher, random_room, random_timeslot);
	// timetable.updateTimetableUsingDifference(timetable);

	std::cout << "F" << std::endl;
	for (int16_t i = 0; i < timetable.schoolClasses.size(); i++) {
		std::cout
		    << std::setw(4) << timetable.schoolClasses[i].school_class_id
		    << std::setw(4) << timetable.schoolClasses[i].section_id
		    << std::setw(4) << timetable.schoolClasses[i].subject_id
		    << std::setw(4) << timetable.schoolClasses[i].teacher_id
		    << std::setw(4) << timetable.schoolClasses[i].room_id
		    << std::setw(4) << timetable.schoolClasses[i].timeslot << std::endl;
	};

	// std::cout << "teachers" << std::endl;
	// for (int16_t i = 0; i < timetable.teachers.size(); i++) {
	// 	std::cout
	// 	    << std::setw(4) << timetable.teachers[i].teacher_id
	// 	    << std::setw(4) << timetable.teachers[i].school_class_id
	// 	    << std::setw(4) << timetable.teachers[i].timeslot << std::endl;
	// };

	// std::cout << "classrooms" << std::endl;
	// for (int16_t i = 0; i < timetable.classrooms.size(); i++) {
	// 	std::cout
	// 	    << std::setw(4) << timetable.classrooms[i].room_id
	// 	    << std::setw(4) << timetable.classrooms[i].school_class_id
	// 	    << std::setw(4) << timetable.classrooms[i].timeslot << std::endl;
	// };

	// std::cout << "sections" << std::endl;
	// for (int16_t i = 0; i < timetable.sections.size(); i++) {
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
	int16_t cost;

	Bee(int16_t num_curriculum) : timetable(num_curriculum), cost(std::numeric_limits<int16_t>::max()) {}
};

Bee generateRandomTimetable(int16_t num_curriculum = NUM_CURRICULUM,
                            int16_t num_teachers = NUM_TEACHER,
                            int16_t num_rooms = NUM_ROOM,
                            int16_t num_timeslots = NUM_TIMESLOT,
                            const ObjectiveFunction& objFunc = ObjectiveFunction()) {
	Bee newBee(num_curriculum);

	random_device rd;
	mt19937 gen(rd());
	std::uniform_int_distribution<int16_t> teacher_dist(0, num_teachers - 1);
	std::uniform_int_distribution<int16_t> room_dist(0, num_rooms - 1);
	std::uniform_int_distribution<int16_t> timeslot_dist(0, num_timeslots - 1);

	newBee.timetable.addCurriculum();
	newBee.timetable.initializeRandomTimetable(gen, teacher_dist, room_dist, timeslot_dist);

	return newBee;
}

auto fitnessProportionateSelection = [](const vector<double>& prob) {
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

void runExperiment(int maxIterations, int beesPopulation, int beesEmployed, int beesOnlooker, int beesScout, int limit) {
	int16_t nrOfExperiments = 1;

	random_device rd;
	mt19937 gen(rd());

	int total_school_class = 0;
	for (int i = 0; i < CURRICULUM_EXAMPLE.size(); i++) {
		total_school_class += CURRICULUM_EXAMPLE[i].sections.size() * CURRICULUM_EXAMPLE[i].subjects.size();
	}

	std::uniform_int_distribution<int16_t> random_field(0, 2);
	std::uniform_int_distribution<int16_t> random_school_class(0, total_school_class - 1);
	std::uniform_int_distribution<int16_t> random_room(0, NUM_ROOM - 1);
	std::uniform_int_distribution<int16_t> random_timeslot(0, NUM_TIMESLOT - 1);
	std::uniform_int_distribution<int16_t> random_teacher(0, NUM_TEACHER - 1);

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

		vector<int> abandonedBees(beesPopulation, 0);
		vector<double> bestCost(maxIterations, 0);

		for (int iter = 0; iter < maxIterations; iter++) {
			// std::cout << "Iter: " << iter << std::endl;

			for (int i = 0; i < beesEmployed; i++) {
				// std::cout << "Bruh" << std::endl;
				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(NUM_CURRICULUM);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_teacher, random_room, random_timeslot);

				// newBee.timetable.addCurriculum();
				// newBee.timetable.updateTimetableUsingDifference(beesVector[randomBeesIndex].timetable);

				newBee.cost = optimizableFunction.evaluate(newBee.timetable);

				if (newBee.cost <= beesVector[i].cost) {
					beesVector[i] = newBee;
				} else {
					abandonedBees[i]++;
				}
			}

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

			for (int m = 0; m < beesOnlooker; m++) {
				int i = fitnessProportionateSelection(prob);

				int randomBeesIndex = rand() % beesEmployed;
				while (randomBeesIndex == i) {
					randomBeesIndex = rand() % beesEmployed;
				}

				Bee newBee(NUM_CURRICULUM);
				newBee = beesVector[randomBeesIndex];
				newBee.timetable.updateTimetableUsingDifference(gen, random_field, random_school_class, random_teacher, random_room, random_timeslot);

				// newBee.timetable.addCurriculum();
				// newBee.timetable.updateTimetableUsingDifference(beesVector[randomBeesIndex].timetable);

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

	std::cout << "Best solution: cost " << bestSolution.cost << endl;
	for (int i = 0; i < bestSolution.timetable.schoolClasses.size(); i++) {
		std::cout
		    << RED << std::setw(4) << bestSolution.timetable.schoolClasses[i].school_class_id << RESET
		    << GREEN << std::setw(4) << bestSolution.timetable.schoolClasses[i].section_id << RESET
		    << YELLOW << std::setw(4) << bestSolution.timetable.schoolClasses[i].subject_id << RESET
		    << BLUE << std::setw(4) << bestSolution.timetable.schoolClasses[i].teacher_id << RESET
		    << MAGENTA << std::setw(4) << bestSolution.timetable.schoolClasses[i].room_id << RESET
		    << CYAN << std::setw(4) << bestSolution.timetable.schoolClasses[i].timeslot << RESET << std::endl;
	}

	std::cout << "Objective function: " << ObjectiveFunction().evaluate(bestSolution.timetable, true) << endl;
	auto end = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double> duration = end - start;

	std::cout << "Time taken: " << duration.count() << " milliseconds" << endl;
}

#ifdef _DEBUG
int main() {
	int maxIterations = 3000;

	// vector<int> beesPopulations = {125};
	// vector<int> beesEmployedOptions = {int(50.0f / 100.0f * 125)};
	// vector<int> beesOnlookerOptions = {125};
	// vector<int> beesScoutOptions = {1};
	// vector<int> limits = {50};

	// vector<int> beesPopulations = {250};
	// vector<int> beesEmployedOptions = {40};
	// vector<int> beesOnlookerOptions = {2};
	// vector<int> beesScoutOptions = {2};
	// vector<int> limits = {30};

	// vector<int> beesPopulations = {500};
	// vector<int> beesEmployedOptions = {80};
	// vector<int> beesOnlookerOptions = {4};
	// vector<int> beesScoutOptions = {4};
	// vector<int> limits = {10};

	// 131.1 milli
	vector<int> beesPopulations = {5};
	vector<int> beesEmployedOptions = {5};
	vector<int> beesOnlookerOptions = {2};
	vector<int> beesScoutOptions = {2};
	vector<int> limits = {50};
	// vector<int> limits = {30};
	// // vector<int> limits = {15};
	// // vector<int> limits = {5};

	for (int beesPopulation : beesPopulations) {
		for (int beesEmployed : beesEmployedOptions) {
			for (int beesOnlooker : beesOnlookerOptions) {
				for (int beesScout : beesScoutOptions) {
					for (int limit : limits) {
						std::cout << "Running experiment with configuration: "
						          << maxIterations << ", "
						          << beesPopulation << ", "
						          << beesEmployed << ", "
						          << beesOnlooker << ", "
						          << beesScout << ", "
						          << limit << std::endl;
						runExperiment(maxIterations, beesPopulation, beesEmployed, beesOnlooker, beesScout, limit);
					}
				}
			}
		}
	}

	return 0;
}
#endif

// vector<int> beesPopulations = {500, 1000, 1500};
// vector<int> beesEmployedOptions = {250, 500, 750};
// vector<int> beesOnlookerOptions = {250, 500, 750};
// vector<int> beesScoutOptions = {100, 250, 400};
// vector<int> limits = {20, 50, 100};

// vector<int> beesPopulations = {125};
// vector<int> beesEmployedOptions = {int(50.0f / 100.0f * 125)};
// vector<int> beesOnlookerOptions = {125};
// vector<int> beesScoutOptions = {1};
// vector<int> limits = {50};

// vector<int> beesPopulations = {500};
// vector<int> beesEmployedOptions = {80};
// vector<int> beesOnlookerOptions = {4};
// vector<int> beesScoutOptions = {4};
// vector<int> limits = {10};

// vector<int> beesPopulations = {1500};
// vector<int> beesEmployedOptions = {240};
// vector<int> beesOnlookerOptions = {12};
// vector<int> beesScoutOptions = {12};
// vector<int> limits = {30};

// vector<int> beesPopulations = {3000};
// vector<int> beesEmployedOptions = {1500};
// vector<int> beesOnlookerOptions = {3000};
// vector<int> beesScoutOptions = {24};
// vector<int> limits = {60};

// vector<int> beesPopulations = {6000};
// vector<int> beesEmployedOptions = {3000};
// vector<int> beesOnlookerOptions = {6000};
// vector<int> beesScoutOptions = {48};
// vector<int> limits = {150};

// vector<int> beesPopulations = {3000};
// vector<int> beesEmployedOptions = {480};
// vector<int> beesOnlookerOptions = {24};
// vector<int> beesScoutOptions = {24};
// vector<int> limits = {60};

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