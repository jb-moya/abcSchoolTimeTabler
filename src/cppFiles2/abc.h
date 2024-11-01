#ifndef ABC_H
#define ABC_H

#include "objectiveFunction.h"
#include "subjectTeacherQueue.h"

class ABC {
   private:
	Bee best_solution;
	ObjectiveFunction objective_function;
	std::unordered_map<int16_t, Section> sections;
	std::unordered_map<int16_t, Teacher> teachers;
	std::map<int, int> costs;

	std::vector<int> bees_abandoned;
	std::unordered_set<int> above_limit_abandoned_bees;
	std::uniform_int_distribution<> dist_bees_employed;

	std::vector<Bee> bees_vector;

	std::unordered_set<int16_t> affected_teachers;
	std::unordered_set<int16_t> affected_sections;

	int total_section;
	int total_teacher;
	int iteration_count;
	int max_iterations;
	int bees_employed;
	int bees_onlooker;
	int bees_scout;
	int limit;

   public:
	ABC(int total_section,
	    int total_teacher,
	    int max_iterations,
	    int bees_population,
	    int bees_employed,
	    int bees_onlooker,
	    int bees_scout,
	    int limit,
	    Bee solution,
	    std::unordered_map<int16_t, Section> sections,
	    std::unordered_map<int16_t, Teacher> teachers)
	    : best_solution(solution),
	      objective_function(),
	      sections(std::move(sections)),
	      teachers(std::move(teachers)),
	      costs(),
	      bees_abandoned(bees_population, 0),
	      above_limit_abandoned_bees(),
	      dist_bees_employed(0, bees_population - 1),
	      bees_vector(bees_population, Bee(total_teacher, total_section, this->sections, this->teachers)),
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

		// Initialize best solution
		best_solution.timetable.initializeRandomTimetable(affected_teachers);
		// printSchoolClasses(best_solution.timetable);

		// Evaluate objective function for the best solution
		objective_function.evaluate(best_solution, affected_teachers, best_solution.timetable.s_sections_set, false, true);
		// print(GREEN_B, " -- .-- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);

		// Initialize each bee and evaluate
		for (int i = 0; i < bees_population; i++) {
			affected_teachers.clear();

			Timetable::s_subject_teacher_queue.resetQueue();
			bees_vector[i].timetable.initializeRandomTimetable(affected_teachers);
			objective_function.evaluate(bees_vector[i], affected_teachers, Timetable::s_sections_set, false, true);

			if (bees_vector[i].total_cost <= best_solution.total_cost) {
				best_solution = bees_vector[i];
			}
		}

		printSchoolClasses(best_solution.timetable);
	}

	void run();

	Bee getBestSolution();

	void getResult(int64_t* result_timetable, int64_t* result_timetable_2, int offset_duration);
	void getViolation(int64_t* result_violation);
};

#endif  // ABC_H