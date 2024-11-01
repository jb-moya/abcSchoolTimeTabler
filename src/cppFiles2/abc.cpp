#include "abc.h"

#include "bee.h"
#include "random_util.h"
#include "subjectTeacherQueue.h"
#include "timetable.h"

void ABC::run() {
	print(YELLOW, "starting iteration");
	for (int iter = 0; iter < max_iterations; iter++) {
		if (iter % 10 == 0) {
			costs[best_solution.total_cost]++;
		}

		int total_cost = 0;

		for (int i = 0; i < bees_employed; i++) {
			int random_bee;
			do {
				random_bee = dist_bees_employed(randomizer_engine);
			} while (random_bee == i);

			Bee new_bee = bees_vector[random_bee];

			affected_teachers.clear();
			affected_sections.clear();

			new_bee.timetable.modify(affected_teachers, affected_sections);
			objective_function.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;

				bees_abandoned[i] = 0;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					print("employ abandoning bee", iter, i);

					above_limit_abandoned_bees.insert(i);
				}
			}

			total_cost += bees_vector[i].total_cost;
		}

		double averageCost = (total_cost / bees_employed);
		if (averageCost < 1e-6) {
			averageCost = 1e-6;  // Ensure averageCost is never too small.
		}

		std::vector<double> fitness_values(bees_employed, 0);
		double fSum = 0;
		for (int i = 0; i < bees_employed; i++) {
			fitness_values[i] = 1.0 / (1.0 + (bees_vector[i].total_cost / averageCost));

			if (std::isinf(fitness_values[i]) || std::isnan(fitness_values[i])) {
				print("Numerical issue with fitness value", i);
				exit(1);
			}

			fSum += fitness_values[i];
		}

		if (fSum < 1e-6) {
			print("fSum too small, potential issue with cost values");
			exit(1);
		}

		std::vector<double>
		    prob(bees_employed, 0);
		for (int i = 0; i < bees_employed; i++) {
			prob[i] = fitness_values[i] / fSum;
		}

		auto fitness_proportionate_selection = [&](const std::vector<double>& prob) {
			std::uniform_real_distribution<> dis(0.0, 1.0);
			double r = dis(randomizer_engine);
			double cumulative = 0.0;
			for (int i = 0; i < static_cast<int>(prob.size()); i++) {
				cumulative += prob[i];
				if (r <= cumulative) {
					return i;
				}
			}
			return static_cast<int>(prob.size() - 1);
		};

		for (int m = 0; m < bees_onlooker; m++) {
			int i = fitness_proportionate_selection(prob);

			Bee new_bee = bees_vector[i];
			affected_teachers.clear();
			affected_sections.clear();

			new_bee.timetable.modify(affected_teachers, affected_sections);
			objective_function.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
				bees_abandoned[i] = 0;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					print("abandoning bee", iter, i);
					above_limit_abandoned_bees.insert(i);
				}
			}
		}

		for (int itScout = 0; itScout < bees_scout; itScout++) {
			for (auto it = above_limit_abandoned_bees.begin(); it != above_limit_abandoned_bees.end();) {
				Bee new_bee(total_teacher, total_section, sections, teachers);
				affected_teachers.clear();

				Timetable::s_subject_teacher_queue.resetQueue();
				new_bee.timetable.initializeRandomTimetable(affected_teachers);
				bees_vector[*it] = new_bee;
				objective_function.evaluate(bees_vector[*it], affected_teachers, Timetable::s_sections_set, false, true);
				bees_abandoned[*it] = 0;

				it = above_limit_abandoned_bees.erase(it);
			}
		}

		for (int i = 0; i < bees_employed; i++) {
			if (bees_vector[i].total_cost <= best_solution.total_cost) {
				best_solution = bees_vector[i];
			}
		}

		if (best_solution.total_cost == 0) {
			print(CYAN_BG, BOLD, "EARLY BREAK Best solution: cost ", best_solution.total_cost, " at ", iter, RESET);
			iteration_count = iter;
			break;
		}
	}
}

Bee ABC::getBestSolution() {
	return best_solution;
}

// TODO: SEPARATE GETTING RESULT DETAILS

void ABC::getViolation(int64_t* result_violation) {
	auto& teachers_timetable = best_solution.timetable.teachers;

	std::unordered_map<int, std::unordered_map<int16_t, int>> teacher_violations;
	std::unordered_map<int, std::unordered_map<int16_t, int>> section_violations;

	for (const int16_t& teacher_id_16 : best_solution.timetable.s_teachers_set) {
		const int teacher_id = static_cast<int>(teacher_id_16);

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
		const auto& class_count = teachers_timetable.at(teacher_id).class_count;

		const int max_teacher_work_load = best_solution.timetable.s_max_teacher_work_load;
		const int break_time_duration = best_solution.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (class_count.at(day) > max_teacher_work_load) {
				teacher_violations[EXCEED_WORKLOAD_INT][teacher_id]++;
			}

			if (timeslot.size() == 0) {
				continue;
			}

			auto it = timeslot.begin();
			auto nextIt = std::next(it);

			std::set<int> teacher_available_timeslot;

			auto lastElement = --timeslot.end();
			float middle = (timeslot.begin()->first + lastElement->first) / 2;

			int allowance_multiplier = 2;

			float min_allowance = middle - (best_solution.timetable.s_default_class_duration * allowance_multiplier);
			float max_allowance = middle + (best_solution.timetable.s_default_class_duration * allowance_multiplier);

			int rounded_min_allowance = static_cast<int>(std::floor(min_allowance));
			int rounded_max_allowance = static_cast<int>(std::ceil(max_allowance));

			bool break_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - timeslot_key - 1;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= rounded_max_allowance) ||
						    (rounded_min_allowance <= nextKey - 1 && nextKey - 1 <= rounded_max_allowance)) {
							break_found = true;
						}
					}
				}

				if (class_count > 1) {
					teacher_violations[CLASS_TIMESLOT_OVERLAP_INT][teacher_id]++;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			if (!break_found && class_count.at(day) >= best_solution.timetable.s_teacher_break_threshold) {
				teacher_violations[NO_BREAK_INT][teacher_id]++;
			}
		}
	}

	for (const int16_t& section_id_16 : best_solution.timetable.s_sections_set) {
		const int section_id = static_cast<int>(section_id_16);

		// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
		// 	// print("ppp");
		// 	continue;
		// } else {
		// 	// print("hehe");
		// }

		auto& section = best_solution.timetable.sections[section_id];

		int early_not_allowed_break_duration_gap = Timetable::s_section_not_allowed_breakslot_gap[section_id] * Timetable::s_default_class_duration;
		int late_not_allowed_break_duration_gap = (Timetable::s_section_not_allowed_breakslot_gap[section_id] + 1) * Timetable::s_default_class_duration;

		int max_time = Timetable::s_section_start[section_id] + Timetable::s_section_total_duration[section_id];

		if (section.break_slots.size() == 1) {
			int break_time = *section.break_slots.begin();

			if (section.time_range[break_time].end > max_time - late_not_allowed_break_duration_gap) {
				section_violations[LATE_BREAK_INT][section_id]++;
			}

			if (section.time_range[break_time].start < early_not_allowed_break_duration_gap) {
				section_violations[EARLY_BREAK_INT][section_id]++;
			}
		} else {
			int first_break_time = *section.break_slots.begin();
			int last_break_time = *section.break_slots.rbegin();

			int first_start = section.time_range[first_break_time].start;
			int last_end = section.time_range[last_break_time].end;

			if (last_end > max_time - late_not_allowed_break_duration_gap) {
				section_violations[LATE_BREAK_INT][section_id]++;
			}

			if (first_start < early_not_allowed_break_duration_gap) {
				section_violations[EARLY_BREAK_INT][section_id]++;
			}

			if (last_end - first_start <= early_not_allowed_break_duration_gap) {
				section_violations[SMALL_BREAK_GAP_INT][section_id]++;
			}
		}
	}

	int iter = 0;
	for (const auto& [violation_type, teacher_violation_count] : teacher_violations) {
		for (const auto& [teacher_id, violation_count] : teacher_violation_count) {
			print("violation_type", violation_type, teacher_id, violation_count);
			int64_t packed = pack5IntToInt64(violation_type, teacher_id, violation_count, 0, 0);

			result_violation[iter++] = packed;
		}
	}

	for (const auto& [violation_type, section_violation_count] : section_violations) {
		for (const auto& [section_id, violation_count] : section_violation_count) {
			print("violation_type", violation_type, section_id, violation_count);
			int64_t packed = pack5IntToInt64(violation_type, section_id, violation_count, 0, 0);

			result_violation[iter++] = packed;
		}
	}

	result_violation[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);
};

void ABC::getResult(int64_t* result, int64_t* result_2, int offset_duration) {
	print("Getting result...");

	int iter = 0;

	for (const auto& [section_id, section] : best_solution.timetable.sections) {
		int offset = best_solution.timetable.s_section_start[section_id];
		for (const auto& [timeslot, classMap] : section.classes) {
			for (const auto& [day, schoolClass] : classMap) {
				// print("class xx",
				//       grade,
				//       schoolClass.subject_id,
				//       schoolClass.teacher_id,
				//       static_cast<int8_t>(timeslot),
				//       day);

				int64_t packed = pack5IntToInt64(
				    section.id,
				    schoolClass.subject_id,
				    schoolClass.teacher_id,
				    static_cast<int8_t>(timeslot),
				    day);

				int start = section.time_range.at(timeslot).start + offset_duration * timeslot;
				int end = section.time_range.at(timeslot).end + offset_duration * (timeslot + 1);

				start += offset;
				end += offset;

				result[iter] = packed;
				result_2[iter] = pack5IntToInt64(start, end, 0, 0, 0);

				iter++;
			}
		}
	}

	result[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);
	result_2[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);

	print("...Done getting result!");
}