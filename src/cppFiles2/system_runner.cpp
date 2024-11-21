#include "system_runner.h"

#include "abc.h"
#include "log.h"
#include "timeManager.h"

#define LOG_FOLDER "logs2/"

extern "C" {

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,
    int number_of_subject_configuration,

    int32_t* section_configuration,
    int32_t* section_subject_configuration,
    int32_t* section_subjects,
    int32_t* subject_configuration_subject_units,
    int32_t* subject_configuration_subject_duration,
    int32_t* subject_configuration_subject_fixed_timeslot,
    int32_t* subject_configuration_subject_fixed_day,
    int32_t* subject_fixed_teacher_section,
    int32_t* subject_fixed_teacher,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* teacher_week_load_config,

    int teacher_subjects_length,
    int bees_population,
    int bees_employed,
    int bees_onlooker,
    int bees_scout,
    int limit,
    int work_week,

    TimeDuration break_time_duration,
    int teacher_break_threshold,
    int teacher_middle_time_point_grow_allowance_for_break_timeslot,
    TimeDuration min_total_class_duration_for_two_breaks,
    TimeDuration default_class_duration,
    int result_buff_length,
    TimePoint offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging) {
	// Timetable::reset();
	print(CYAN, "RESET", RESET);

	std::unordered_map<SectionID, Section> sections;
	std::unordered_map<TeacherID, Teacher> teachers;

	Timetable timetable;

	{
		Timetable::setTotalSection(total_section);
		Section::total_section = total_section;
		Teacher::teacher_count = num_teachers;

		Timetable::s_random_section_id = std::uniform_int_distribution<int>(0, total_section - 1);
		// Timetable::initializeRandomSectionDistribution(0, total_section - 1);
		Timetable::initializeRandomFieldDistribution(0, 2);
		Timetable::initializeRandomWorkDayDistribution(1, work_week);
		Timetable::s_rotary_timeslot = RotaryTimeslot();
		Timetable::s_subject_teacher_queue = SubjectTeacherQueue();
		Timetable::s_subject_eligibility_manager = SubjectEligibilityManager();

		Timetable::setTeacherBreakThreshold(teacher_break_threshold);
		Timetable::setTeacherMiddleTimePointGrowAllowanceForBreakTimeslot(teacher_middle_time_point_grow_allowance_for_break_timeslot);
		Timetable::setDefaultClassDuration(default_class_duration);
		Timetable::setBreakTimeDuration(break_time_duration);
		Timetable::setWorkWeek(work_week);

		sections.reserve(total_section);
		teachers.reserve(num_teachers);

		std::unordered_set<SectionID> section_set;
		for (SectionID subject_id = 0; subject_id < total_section; subject_id++) {
			section_set.insert(subject_id);
		}

		Timetable::setSectionsSet(section_set);

		std::unordered_set<TeacherID> teacher_set;
		for (TeacherID teacher_id = 0; teacher_id < num_teachers; teacher_id++) {
			teacher_set.insert(teacher_id);
		}

		Timetable::setTeachersSet(teacher_set);

		for (SubjectConfigurationID subject_configuration_id = 0; subject_configuration_id < number_of_subject_configuration; subject_configuration_id++) {
			SubjectID subject_id;
			int subject_units;
			TimeDuration subject_duration;
			Timeslot subject_fixed_timeslot;

			subject_id = static_cast<int>(subject_configuration_subject_units[subject_configuration_id] >> 16);
			subject_units = static_cast<int>(subject_configuration_subject_units[subject_configuration_id] & 0xFFFF);
			subject_duration = static_cast<int>(subject_configuration_subject_duration[subject_configuration_id] & 0xFFFF);
			subject_fixed_timeslot = static_cast<int>(subject_configuration_subject_fixed_timeslot[subject_configuration_id] & 0xFFFF);

			std::vector<ScheduledDay> subject_fixed_days;

			for (int i = 0; i < 8; i++) {
				if (subject_configuration_subject_fixed_day[subject_configuration_id] & (1 << i)) {
print(YELLOW, "yes fixed day");
					subject_fixed_days.push_back(static_cast<ScheduledDay>(i));
} else {
					print(RED, "not fixed day");
				}
			}

			timetable.addSubjectConfiguration(subject_configuration_id, subject_id, subject_duration, subject_units, subject_fixed_timeslot, subject_fixed_days);
		}

		for (SectionID i = 0; i < total_section; i++) {
			SectionID section_id = i;
			int num_break = static_cast<int>((section_configuration[i] >> 24) & 0xFF);
			int total_timeslot = static_cast<int>((section_configuration[i] >> 16) & 0xFF);
			int not_allowed_breakslot_gap = static_cast<int>((section_configuration[i] >> 8) & 0xFF);
			bool is_dynamic_subject_consistent_duration = static_cast<bool>(section_configuration[i] & 0xFF);
			TimePoint start = static_cast<int>(section_start[i]);

			print("ff", section_id,
			      num_break,
			      total_timeslot,
			      not_allowed_breakslot_gap,
			      is_dynamic_subject_consistent_duration,
			      start);

			Section::s_all_sections.insert(section_id);
			timetable.addSection(section_id, num_break, start, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration);
		}

		size_t count = 0;
		while (subject_fixed_teacher_section[count] != -1) {
			SectionID section_id = static_cast<int>(subject_fixed_teacher_section[count]);
			SubjectID subject_id = static_cast<int>(subject_fixed_teacher[count] >> 16);
			TeacherID teacher_id = static_cast<int>(subject_fixed_teacher[count] & 0xFFFF);

			print("section_id", section_id, "subject_id", subject_id, "teacher_id", teacher_id);

			timetable.getSectionById(section_id).addSubjectFixedTeacher(subject_id, teacher_id);

			++count;
		}

		for (TeacherID teacher_id = 0; teacher_id < num_teachers; teacher_id++) {
			TimeDuration max_weekly_load = static_cast<int>(teacher_week_load_config[teacher_id] >> 16);
			TimeDuration min_weekly_load = static_cast<int>(teacher_week_load_config[teacher_id] & 0xFFFF);

			Teacher::s_all_teachers.insert(teacher_id);
			timetable.addTeacher(teacher_id, max_weekly_load, min_weekly_load);
		}

		for (int i = 0; i < teacher_subjects_length; i++) {
			if (teacher_subjects[i] == -1) continue;

			TeacherID teacher_id;
			SubjectID subject_id;
			teacher_id = static_cast<int>(teacher_subjects[i] >> 16);
			subject_id = static_cast<int>(teacher_subjects[i] & 0xFFFF);

			Timetable::addEligibleTeacher(subject_id, teacher_id);

			Timetable::s_subject_teacher_queue.addTeacher(subject_id, teacher_id, 70);
		}

		for (int i = 0; i < total_section_subjects; i++) {
			SectionID section_id;
			SubjectConfigurationID subject_configuration_id;

			section_id = static_cast<int>(section_subject_configuration[i] >> 16);
			subject_configuration_id = static_cast<int>(section_subject_configuration[i] & 0xFFFF);

			timetable.addSubjectToSection(section_id, subject_configuration_id);
		}
	}

	ObjectiveFunction evaluator;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");

	Bee best_solution(timetable, num_teachers, total_section);

	// print("fff");
	// exit(1);

	// needs base timetable
	ABC abc(timetable,
	        best_solution,
	        sections,
	        teachers,
	        total_section,
	        num_teachers,
	        max_iterations,
	        bees_population,
	        bees_employed,
	        bees_onlooker,
	        bees_scout,
	        limit);

	// print("brto");
	// return;

	TimeManager tm;
	tm.startTimer();

	printConfiguration(max_iterations, num_teachers, total_section_subjects, total_section, teacher_subjects_length,
	                   bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week,
	                   break_time_duration, teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, result_buff_length, offset_duration, enable_logging, tm.getStartTime());

	abc.run();

	// std::map<int, int> costs;

	tm.stopTimer();

	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);

	Bee final_bee = abc.getBestSolution();
	int final_iteration_count = abc.getIterationCount();

	for (const auto& section : final_bee.timetable.getSectionsSet()) {
		Section& section_info = final_bee.timetable.getSectionById(section);

		print("fff", section, section_info.getId());
	}

	printSchoolClasses(final_bee.timetable);

	if (enable_logging) {
		std::string name_file = std::string(LOG_FOLDER) + "c" + tm.getStartDate() + "-" + tm.getStartTime() + "---" +
		                        std::to_string(num_teachers) + "_" + std::to_string(total_section) + "_" + std::to_string(final_bee.total_cost) + "---" + "timetable.txt";
		std::ofstream txt_file(name_file);
		logResults(txt_file, final_bee.total_cost, tm.getTimelapse(), tm.getStartDate(), tm.getStartTime(), final_iteration_count, max_iterations, num_teachers, total_section_subjects,
		           total_section, teacher_subjects_length, bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week, break_time_duration,
		           teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, result_buff_length, offset_duration, enable_logging);

		// logCosts(costs, txt_file);
		logConflicts(&final_bee, txt_file);
		logSchoolClasses(final_bee.timetable, txt_file);

		print("----------------------------");
		print("result log file: ", name_file);
		print("----------------------------");

		txt_file.close();
	}

	evaluator.evaluate(final_bee, Teacher::s_all_teachers, Section::s_all_sections, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, final_bee.total_cost, GREEN_B, " -- -- ", RESET);

	print("Time taken: ", tm.getTimelapse());

	abc.getResult(result_timetable, result_timetable_2, offset_duration);
	abc.getViolation(result_violation);

	return;
}
}
