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
int32_t* section_location,
    int32_t* section_subject_configuration,
    int32_t* subject_configuration_subject_units,
    int32_t* subject_configuration_subject_duration,
    int32_t* subject_configuration_subject_fixed_timeslot,
    int32_t* subject_configuration_subject_fixed_day,
int32_t* subject_configuration_subject_is_overlappable,
    int32_t* subject_fixed_teacher_section,
    int32_t* subject_fixed_teacher,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* teacher_week_load_config,
int32_t* building_info,
    int32_t* building_adjacency,

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
    TimePoint offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging) {
	// Timetable::reset();
	print(CYAN, "RESET", RESET);

	Timetable::setTotalSection(total_section);
	Section::total_section = total_section;
	Teacher::teacher_count = num_teachers;

	Timetable::initializeRandomSectionDistribution(0, total_section - 1);

	if (work_week == 1) {
		Timetable::initializeRandomFieldDistribution(0, 1);
	} else {
		Timetable::initializeRandomFieldDistribution(0, 2);
	}

	Timetable::initializeRandomWorkDayDistribution(1, work_week);

	Timetable::s_rotary_timeslot = RotaryVector();
	Timetable::s_subject_teacher_queue = SubjectTeacherQueue();
	Timetable::s_subject_eligibility_manager = SubjectEligibilityManager();

	Timetable::setTeacherBreakThreshold(teacher_break_threshold);
	Timetable::setTeacherMiddleTimePointGrowAllowanceForBreakTimeslot(teacher_middle_time_point_grow_allowance_for_break_timeslot);
	Timetable::setDefaultClassDuration(default_class_duration);
	Timetable::setBreakTimeDuration(break_time_duration);
	Timetable::setWorkWeek(work_week);

	Timetable::initializeSectionSet(total_section);
	Timetable::initializeTeachersSet(num_teachers);

	Timetable timetable;
	timetable.initializeSubjectConfigurations(number_of_subject_configuration,
	                                          subject_configuration_subject_units,
	                                          subject_configuration_subject_duration,
	                                          subject_configuration_subject_fixed_timeslot,
	                                          subject_configuration_subject_fixed_day);
	timetable.initializeSections(total_section, section_configuration, section_start, section_location);
	timetable.initializeSectionFixedSubjectTeacher(subject_fixed_teacher_section, subject_fixed_teacher);
	timetable.initializeTeachers(num_teachers, teacher_week_load_config);
	timetable.initializeTeacherSubjects(teacher_subjects_length, teacher_subjects);
	timetable.initializeSectionSubjects(total_section_subjects, section_subject_configuration);

	timetable.initializeBuildingAdjacency(building_adjacency);
	timetable.initializeBuildingConfiguration(building_info);

	ObjectiveFunction evaluator;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");

	Bee best_solution(timetable, num_teachers, total_section);

	ABC abc(timetable,
	        best_solution,
	        total_section,
	        num_teachers,
	        max_iterations,
	        bees_population,
	        bees_employed,
	        bees_onlooker,
	        bees_scout,
	        limit);

	TimeManager tm;
	tm.startTimer();

	printConfiguration(max_iterations, num_teachers, total_section_subjects, total_section, teacher_subjects_length,
	                   bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week,
	                   break_time_duration, teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, offset_duration, enable_logging, tm.getStartTime());

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
		           teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, offset_duration, enable_logging);

		// logCosts(costs, txt_file);
		logConflicts(&final_bee, txt_file);
		logSchoolClasses(final_bee.timetable, txt_file);

		print("----------------------------");
		print("result log file: ", name_file);
		print("----------------------------");

		txt_file.close();
	}

	evaluator.evaluate(final_bee, final_bee.timetable.getTeachersSet(), final_bee.timetable.getSectionsSet(), false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, final_bee.total_cost, GREEN_B, " -- -- ", RESET);

	print("Time taken: ", tm.getTimelapse());

	abc.getResult(result_timetable, result_timetable_2, offset_duration);
	abc.getViolation(result_violation);

	return;
}
}
