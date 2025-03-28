// test_file.cpp
#define CATCH_CONFIG_MAIN  // This defines the main function that Catch2 will use
#include <typeinfo>

#include "abc.cpp"
#include "abc.h"
#include "catch_amalgamated.hpp"  // Include Catch2
#include "classStartEnd.h"
#include "print.h"
#include "random_util.cpp"
#include "random_util.h"
#include "rotaryVector.cpp"
#include "rotaryVector.h"
#include "section.cpp"
#include "section.h"
#include "subjectConfiguration.cpp"
#include "subjectConfiguration.h"
#include "subjectTeacherQueue.cpp"
#include "subjectTeacherQueue.h"
#include "teacher.cpp"
#include "teacher.h"
#include "timeManager.h"
#include "timemanager.cpp"
#include "timeslotManager.cpp"
#include "timeslotManager.h"
#include "timetable.cpp"
#include "timetable.h"

// #if 0
SCENARIO("Initialization of Timetable is working as expected", "[timetable]") {
	GIVEN("A Timetable with initialized parameters and teacher/section configurations") {
		print(BLUE, "START");

		Timetable timetable;

		int teacher_break_threshold = 4;
		int teacher_middle_time_point_grow_allowance_for_break_timeslot = 4;
		TimeDuration default_class_duration = 1;
		TimeDuration break_time_duration = 1;
		TimeDuration max_teacher_work_load = 90;
		TimeDuration min_teacher_work_load = 70;
		int work_week = 1;
		int total_teacher = 14;
		int total_section = 14;
		int total_unique_subject = 7;
		int num_break = 1;
		int total_timeslot = total_unique_subject + num_break;
		int not_allowed_breakslot_gap = 2, start = 0;
		bool is_dynamic_subject_consistent_duration = false;
		int default_subject_units = 0;
		TimeDuration default_subject_duration = 1;
		Timeslot default_subject_fixed_timeslot = 0;

		uint8_t default_fixed_day = assignFixedDay(true, false, false, false, false, false, false, false);
		std::vector<ScheduledDay> subject_fixed_days = extractFixedDays(default_fixed_day);

		timetable.initializeTeachersSet(total_teacher);
		timetable.initializeSectionSet(total_section);
		timetable.setTeacherBreakThreshold(teacher_break_threshold);
		timetable.setTeacherMiddleTimePointGrowAllowanceForBreakTimeslot(teacher_middle_time_point_grow_allowance_for_break_timeslot);
		timetable.setDefaultClassDuration(default_class_duration);
		timetable.setBreakTimeDuration(break_time_duration);
		timetable.setWorkWeek(work_week);
		timetable.setTotalSection(total_section);

		Timetable::s_rotary_timeslot = RotaryVector();
		Timetable::s_subject_eligibility_manager = SubjectEligibilityManager();
		Timetable::s_subject_teacher_queue = SubjectTeacherQueue();

		REQUIRE(timetable.getTeacherBreakThreshold() == teacher_break_threshold);
		REQUIRE(timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot() == teacher_middle_time_point_grow_allowance_for_break_timeslot);
		REQUIRE(timetable.getDefaultClassDuration() == default_class_duration);
		REQUIRE(timetable.getBreakTimeDuration() == break_time_duration);
		REQUIRE(timetable.getWorkWeek() == work_week);
		REQUIRE(timetable.getTotalSection() == total_section);

		for (int i = 0; i < total_unique_subject; ++i) {
			timetable.addSubjectConfiguration(i, i, default_subject_duration, default_subject_units, default_subject_fixed_timeslot, subject_fixed_days);
		}
		for (SectionID section_id = 0; section_id < total_section; section_id++) {
			timetable.addSection(section_id, num_break, start, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration);
		}

		for (SectionID section_id = 0; section_id < total_section; section_id++) {
			for (SubjectConfigurationID subject_configuration_id = 0; subject_configuration_id < total_unique_subject; subject_configuration_id++) {
				timetable.addSubjectToSection(section_id, subject_configuration_id);
			}
			REQUIRE(timetable.getSectionById(section_id).getId() == section_id);
			REQUIRE(timetable.getSectionById(section_id).getSubjectConfigurations().size() == total_unique_subject);
		}

		for (TeacherID teacher_id = 0; teacher_id < total_teacher; teacher_id++) {
			timetable.addTeacher(teacher_id, max_teacher_work_load, min_teacher_work_load);
			SubjectID subject_id = teacher_id % total_unique_subject;
			Timetable::addEligibleTeacher(subject_id, teacher_id);
			Timetable::s_subject_teacher_queue.addTeacher(subject_id, teacher_id, max_teacher_work_load);
		}

		ObjectiveFunction evaluator;
		std::unordered_set<TeacherID> affected_teachers;
		std::unordered_set<SectionID> affected_sections;

		timetable.initializeRandomTimetable(affected_teachers);

		affected_teachers.clear();
		affected_sections.clear();

		ScheduledDay day = ScheduledDay::EVERYDAY;
		SectionID selected_section_id = 13;
		Section selected_section = timetable.getSectionById(selected_section_id);
		std::pair<Timeslot, Timeslot> selected_timeslots = {0, 0};

		TeacherID old_teacher_id = timetable.getSectionById(selected_section_id).getClassTimeslotTeacherID(day, selected_timeslots.first);
		SubjectID subject_id = timetable.getSectionById(selected_section_id).getClassTimeslotSubjectID(day, selected_timeslots.first);

		TeacherID new_teacher_id = timetable.s_subject_eligibility_manager.getNewRandomTeacher(subject_id, old_teacher_id);

		REQUIRE(old_teacher_id != new_teacher_id);

		SubjectEligibilityManager subject_eligibility_manager = SubjectEligibilityManager();
		subject_eligibility_manager.addTeacher(subject_id, new_teacher_id);

		Teacher old_teacher = timetable.getTeacherById(old_teacher_id);
		Teacher new_teacher = timetable.getTeacherById(new_teacher_id);
		Section old_section = timetable.getSectionById(selected_section_id);

		for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
			CHECK(old_teacher.getUtilizedTime().count(static_cast<ScheduledDay>(i)) == 1);
			CHECK(new_teacher.getUtilizedTime().count(static_cast<ScheduledDay>(i)) == 1);

			CHECK(old_teacher.getSchoolClassDayCount().count(static_cast<ScheduledDay>(i)) == 1);
			CHECK(new_teacher.getSchoolClassDayCount().count(static_cast<ScheduledDay>(i)) == 1);
		}

		for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
			ScheduledDay day = static_cast<ScheduledDay>(i);

			REQUIRE(old_teacher.getUtilizedTime().count(day) == 1);
			REQUIRE(old_teacher.getSchoolClassDayCount().count(day) == 1);
			REQUIRE(new_teacher.getUtilizedTime().count(day) == 1);
			REQUIRE(new_teacher.getSchoolClassDayCount().count(day) == 1);

			std::map<Timeslot, int> old_teacher_utilized_time = old_teacher.getUtilizedTime().find(day)->second;
			std::map<Timeslot, int> new_teacher_utilized_time = new_teacher.getUtilizedTime().find(day)->second;

			printContainer(old_teacher_utilized_time, "old_teacher_utilized_time");
			printContainer(new_teacher_utilized_time, "new_teacher_utilized_time");

			int new_teacher_class_count = new_teacher.getSchoolClassDayCount().find(day)->second;

			auto& updated_section_utilized_teachers = old_section.getUtilizedTeachers();

			int choice = 1;

			Timetable updated_timetable = timetable;
			Section& updated_selected_section = updated_timetable.getSectionById(selected_section_id);

			updated_timetable.modify(updated_selected_section, choice, selected_timeslots, affected_teachers, affected_sections, subject_eligibility_manager);

			Section updated_section = updated_timetable.getSectionById(selected_section_id);

			TeacherID updated_section_teacher_id = updated_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslots.first);

			REQUIRE(updated_section_teacher_id != old_teacher_id);
			REQUIRE(updated_section_teacher_id == new_teacher_id);

			print("old_teacher_id", old_teacher_id, "new_teacher_id", new_teacher_id);

			Teacher updated_old_teacher = updated_timetable.getTeacherById(old_teacher_id);
			Teacher updated_new_teacher = updated_timetable.getTeacherById(new_teacher_id);

			ClassStartEnd class_start_end = old_section.getClassStartTime(selected_timeslots.first);
			print("class_start_end.start:", class_start_end.start, "class_start_end.end:", class_start_end.end);

			std::map<Timeslot, int> updated_old_teacher_utilized_time = updated_old_teacher.getUtilizedTime().find(day)->second;
			std::map<Timeslot, int> updated_new_teacher_utilized_time = updated_new_teacher.getUtilizedTime().find(day)->second;

			printContainer(updated_old_teacher_utilized_time, "updated_old_teacher_utilized_time");
			printContainer(updated_new_teacher_utilized_time, "updated_new_teacher_utilized_time");

			if (updated_old_teacher.getUtilizedTime().count(day) == 0) {
				for (TimePoint time_point = class_start_end.start; time_point < class_start_end.end; time_point++) {
					int old_teacher_old_class_count = old_teacher_utilized_time[time_point];
					int old_teacher_updated_class_count = updated_old_teacher_utilized_time[time_point];

					REQUIRE(old_teacher_old_class_count > old_teacher_updated_class_count);
				}
			}

			for (TimePoint time_point = class_start_end.start; time_point < class_start_end.end; time_point++) {
				int new_teacher_old_class_count = new_teacher_utilized_time[time_point];
				int new_teacher_updated_class_count = updated_new_teacher_utilized_time[time_point];

				REQUIRE(new_teacher_old_class_count < new_teacher_updated_class_count);
			}
		}
	}
}

TEST_CASE("pack5IntToInt64") {
	SECTION("positive numbers") {
		int16_t a = 12345;
		int16_t b = 23456;
		int16_t c = 34567;
		int8_t d = 127;
		int8_t e = 63;

		// Pack the values
		int64_t packed = pack5IntToInt64(a, b, c, d, e);

		// Manually verify the expected packed value:
		int64_t expected = ((static_cast<int64_t>(a) & 0xFFFF) << 48) |
		                   ((static_cast<int64_t>(b) & 0xFFFF) << 32) |
		                   ((static_cast<int64_t>(c) & 0xFFFF) << 16) |
		                   ((static_cast<int64_t>(d) & 0xFF) << 8) |
		                   (static_cast<int64_t>(e) & 0xFF);

		REQUIRE(packed == expected);
	}

	SECTION("Negative numbers") {
		int16_t a = -1;
		int16_t b = -2;
		int16_t c = -3;
		int8_t d = -4;
		int8_t e = -5;

		int64_t packed = pack5IntToInt64(a, b, c, d, e);

		int64_t expected = ((static_cast<int64_t>(a) & 0xFFFF) << 48) |
		                   ((static_cast<int64_t>(b) & 0xFFFF) << 32) |
		                   ((static_cast<int64_t>(c) & 0xFFFF) << 16) |
		                   ((static_cast<int64_t>(d) & 0xFF) << 8) |
		                   (static_cast<int64_t>(e) & 0xFF);

		REQUIRE(packed == expected);
	}
}

TEST_CASE("assign fixed day", "[assignFixedDay]") {
	uint8_t example = assignFixedDay(true, false, false, false, false, false, false, false);
	CHECK(example == 0b00000001);
	CHECK(example & (1 << 0));
	CHECK((example & 0b11111110) == 0);
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::ANYDAY});

	example = assignFixedDay(false, true, false, false, false, false, false, false);
	CHECK(example == 0b00000010);
	CHECK(example & (1 << 1));
	CHECK((example & 0b11111101) == 0);
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::MONDAY});

	example = assignFixedDay(false, false, true, false, false, false, false, false);
	CHECK(example == 0b00000100);
	CHECK(example & (1 << 2));
	CHECK((example & 0b11111011) == 0);
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::TUESDAY});

	example = assignFixedDay(false, true, false, true, false, false, false, false);
	CHECK(example == 0b00001010);
	CHECK(example & (1 << 1));
	CHECK(example & (1 << 3));
	CHECK((example & 0b11110101) == 0);
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::MONDAY, ScheduledDay::WEDNESDAY});

	example = assignFixedDay(true, true, true, true, true, true, true, true);
	CHECK(example == 0b11111111);
	for (int i = 0; i < 8; ++i) {
		CHECK(example & (1 << i));
	}
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::ANYDAY, ScheduledDay::MONDAY, ScheduledDay::TUESDAY, ScheduledDay::WEDNESDAY, ScheduledDay::THURSDAY, ScheduledDay::FRIDAY, ScheduledDay::SATURDAY, ScheduledDay::SUNDAY});

	example = assignFixedDay(false, false, false, false, false, false, false, true);
	CHECK(example == 0b10000000);
	CHECK(example & (1 << 7));
	CHECK((example & 0b01111111) == 0);
	CHECK(extractFixedDays(example) == std::vector<ScheduledDay>{ScheduledDay::SUNDAY});

	print("done");
}

TEST_CASE("printing containers", "[printContainer]") {
	std::vector<int> vec = {1, 2, 3, 4, 5};
	printContainer(vec);

	// Test with an empty vector
	std::vector<int> emptyVec;
	printContainer(emptyVec);

	printWithLocation("ff");
	printWithLocation("f x x x x x");

	// Test with a set (ordered)
	std::set<int>
	    s = {10, 20, 30, 40};
	printContainer(s);

	// Test with an empty set (ordered)
	std::set<int> emptySet;
	printContainer(emptySet);

	// Test with an unordered set
	std::unordered_set<int> us = {50, 60, 70, 80};
	printContainer(us);

	// Test with an empty unordered set
	std::unordered_set<int> emptyUs;
	printContainer(emptyUs);

	// Test with a map (ordered)
	std::map<int, std::string> m = {{1, "One"}, {2, "Two"}, {3, "Three"}};
	printContainer(m);

	// Test with an empty map (ordered)
	std::map<int, std::string> emptyMap;
	printContainer(emptyMap);

	// Test with an unordered map
	std::unordered_map<int, std::string> um = {{4, "Four"}, {5, "Five"}, {6, "Six"}};
	printContainer(um);

	// Test with an empty unordered map
	std::unordered_map<int, std::string> emptyUm;
	printContainer(emptyUm);
}