#pragma once

#include "objectiveFunction.h"

class ABC {
   private:
	Timetable initialTimetable;
	Bee best_solution;
	ObjectiveFunction objective_function;
	std::unordered_map<int, Section> sections;
	std::unordered_map<int, Teacher> teachers;
	std::map<int, int> costs;

	std::vector<int> bees_abandoned;
	std::unordered_set<int> above_limit_abandoned_bees;
	std::uniform_int_distribution<> dist_bees_employed;

	std::vector<Bee> bees_vector;

	std::unordered_set<int> affected_teachers;
	std::unordered_set<int> affected_sections;

	int total_section;
	int total_teacher;
	int iteration_count;
	int max_iterations;
	int bees_employed;
	int bees_onlooker;
	int bees_scout;
	int limit;

   public:
	ABC(Timetable initialTimetable,
	    Bee solution,
	    std::unordered_map<int, Section> sections,
	    std::unordered_map<int, Teacher> teachers,
	    int total_section,
	    int total_teacher,
	    int max_iterations,
	    int bees_population,
	    int bees_employed,
	    int bees_onlooker,
	    int bees_scout,
	    int limit)
	    : initialTimetable(initialTimetable),
	      best_solution(solution),
	      objective_function(),
	      sections(std::move(sections)),
	      teachers(std::move(teachers)),
	      costs(),
	      bees_abandoned(bees_population, 0),
	      above_limit_abandoned_bees(),
	      dist_bees_employed(0, bees_population - 1),
	      bees_vector(bees_population, Bee(this->initialTimetable, total_teacher, total_section)),
	      affected_teachers(),
	      affected_sections(),
	      total_section(total_section),
	      total_teacher(total_teacher),
	      iteration_count(max_iterations),  // Set to 0 initially, then increment per iteration
	      max_iterations(max_iterations),
	      bees_employed(bees_employed),
	      bees_onlooker(bees_onlooker),
	      bees_scout(bees_scout),
	      limit(limit) {
		affected_teachers.reserve(total_teacher);
		affected_sections.reserve(total_section);

		print("hehe");

		// Initialize best solution
		affected_teachers.clear();
		best_solution.timetable.initializeRandomTimetable(affected_teachers);
		// print("zzzz");

		// auto& ff = best_solution.timetable.getSectionById(5).getBreakSlots();
		// for (auto& key : ff) {
		// 	print("key", key);
		// }

		printSchoolClasses(best_solution.timetable);

		// Evaluate objective function for the best solution
		objective_function.evaluate(best_solution, affected_teachers, Timetable::getSectionsSet(), false, true);
		print(GREEN_B, " -- .-- INITIAL Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);

		// print("stop wait a minute");
		// exit(1);

		// Initialize each bee and evaluate
		for (int i = 0; i < bees_population; i++) {
			affected_teachers.clear();

			Timetable::s_subject_teacher_queue.resetQueue();
			bees_vector[i].timetable.initializeRandomTimetable(affected_teachers);
			objective_function.evaluate(bees_vector[i], affected_teachers, Timetable::getSectionsSet(), false, true);

			if (bees_vector[i].total_cost <= best_solution.total_cost) {
				best_solution = bees_vector[i];
			}
		}

		// printSchoolClasses(best_solution.timetable);
	}

	void run();

	int getIterationCount() const;

	Bee getBestSolution();

	void getResult(int64_t* result_timetable, int64_t* result_timetable_2, int offset_duration);
	void getViolation(int64_t* result_violation);
};