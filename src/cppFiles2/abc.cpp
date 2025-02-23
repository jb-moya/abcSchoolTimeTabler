#include "abc.h"

#include "bit_utils.h"

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

			// might be a problem: deep copy

			affected_teachers.clear();
			affected_sections.clear();

			// print("before: ");
			// printSchoolClasses(new_bee.timetable);

			Section& selected_section = new_bee.timetable.pickRandomSection();
			int choice = new_bee.timetable.pickRandomField(selected_section);
			std::pair<Timeslot, Timeslot> selected_timeslots = new_bee.timetable.pickRandomTimeslots(selected_section, choice);

			// print("ff");

			new_bee.timetable.modify(selected_section, choice, selected_timeslots, affected_teachers, affected_sections);
			objective_function.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			// print("after: ");
			// printSchoolClasses(new_bee.timetable);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				// print("yes", new_bee.total_cost, bees_vector[i].total_cost);
				bees_vector[i] = new_bee;

				bees_abandoned[i] = 0;
			} else {
				// print("no", new_bee.total_cost, bees_vector[i].total_cost);
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					// print("employ abandoning bee", iter, i);

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

			Section& selected_section = new_bee.timetable.pickRandomSection();
			int choice = new_bee.timetable.pickRandomField(selected_section);
			std::pair<Timeslot, Timeslot> selected_timeslots = new_bee.timetable.pickRandomTimeslots(selected_section, choice);

			new_bee.timetable.modify(selected_section, choice, selected_timeslots, affected_teachers, affected_sections);
			objective_function.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
				bees_abandoned[i] = 0;
				// print("yes", new_bee.total_cost, bees_vector[i].total_cost);
			} else {
				// print("no", new_bee.total_cost, bees_vector[i].total_cost);
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					// print("abandoning bee", iter, i);
					above_limit_abandoned_bees.insert(i);
				}
			}
		}

		for (int itScout = 0; itScout < bees_scout; itScout++) {
			for (auto it = above_limit_abandoned_bees.begin(); it != above_limit_abandoned_bees.end();) {
				Bee new_bee(this->initialTimetable, total_teacher, total_section);
				affected_teachers.clear();

				Timetable::s_subject_teacher_queue.resetQueue();
				new_bee.timetable.initializeRandomTimetable(affected_teachers);
				bees_vector[*it] = new_bee;
				objective_function.evaluate(bees_vector[*it], affected_teachers, Timetable::getSectionsSet(), false, true);
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
	// auto& teachers_timetable = best_solution.timetable.teachers;

	std::unordered_map<int, std::unordered_map<TeacherID, int>> teacher_violations;
	std::unordered_map<int, std::unordered_map<TeacherID, int>> section_violations;

	const auto& teacher_set = Timetable::getTeachersSet();

	for (TeacherID teacher_id : teacher_set) {
		Teacher teacher = best_solution.timetable.getTeacherById(teacher_id);

		const auto& daily_class_schedule = teacher.getUtilizedTime();
		const auto& total_school_class_count = teacher.getSchoolClassDayCount();
		const auto& offset_duration = Timetable::getOffsetDuration();

		const TimeDuration max_teacher_work_load = teacher.getMaxWeekWorkLoad();
		const TimeDuration min_teacher_work_load = teacher.getMinWeekWorkLoad();
		const TimeDuration break_time_duration = best_solution.timetable.getBreakTimeDuration();

		int total_week_workload = 0;

		for (const auto& [day, total_class_count] : total_school_class_count) {
			total_week_workload += total_class_count * offset_duration;
		}

		for (const auto& [day, time_points_class_count] : daily_class_schedule) {
			// if (total_school_class_count.at(day) > max_teacher_work_load) {
			// 	teacher_violations[EXCEED_MAX_WORKLOAD_INT][teacher_id]++;
			// }

			// if (total_school_class_count.at(day) < min_teacher_work_load) {
			// 	teacher_violations[BELOW_MIN_WORKLOAD_INT][teacher_id]++;
			// }

			if (time_points_class_count.size() == 0) {
				continue;
			}

			auto it = time_points_class_count.begin();
			auto nextIt = std::next(it);

			auto last_time_point = --time_points_class_count.end();
			float middle_time_point = (time_points_class_count.begin()->first + last_time_point->first) / 2;

			float min_time_point_allowance = middle_time_point - (best_solution.timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());
			float max_time_point_allowance = middle_time_point + (best_solution.timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());

			TimePoint rounded_min_time_point_allowance = static_cast<int>(std::floor(min_time_point_allowance));
			TimePoint rounded_max_time_point_allowance = static_cast<int>(std::ceil(max_time_point_allowance));

			bool break_found = false;

			SectionID previous_section_class = -1;

			while (it != time_points_class_count.end()) {
				TimePoint time_point = it->first;
				auto& utilized_time_in_section = it->second;
				SectionID section_id = std::get<0>(utilized_time_in_section);
				int time_point_class_count = std::get<1>(utilized_time_in_section);
				int overlap_able = std::get<2>(utilized_time_in_section);

				total_week_workload += time_point_class_count;

				if (previous_section_class == -1) {
					previous_section_class = section_id;
				} else {
					if (section_id != previous_section_class) {
						Location from_section_location = best_solution.timetable.getSectionById(previous_section_class).getLocation();
						Location to_section_location = best_solution.timetable.getSectionById(section_id).getLocation();

						Building& from_building = best_solution.timetable.getBuildingById(from_section_location.building_id);
						Building& to_building = best_solution.timetable.getBuildingById(to_section_location.building_id);

						int distance = from_building.getDistanceTo(from_section_location, to_section_location, to_building);

						if (distance > 0) {
							teacher_violations[CLASS_PROXIMITY_INT][teacher_id] += distance;
						}

						previous_section_class = section_id;
					}
				}

				if (nextIt != time_points_class_count.end()) {
					TimePoint next_time_point = nextIt->first;
					TimePoint difference = next_time_point - time_point - 1;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_time_point_allowance <= time_point + 1 && time_point + 1 <= rounded_max_time_point_allowance) ||
						    (rounded_min_time_point_allowance <= next_time_point - 1 && next_time_point - 1 <= rounded_max_time_point_allowance)) {
							break_found = true;
						}
					}
				}

				if (time_point_class_count > 1) {
					teacher_violations[CLASS_TIMESLOT_OVERLAP_INT][teacher_id]++;
				}

				it = nextIt;
				if (nextIt != time_points_class_count.end()) {
					++nextIt;
				}
			}

			if (!break_found && total_school_class_count.at(day) >= best_solution.timetable.getTeacherBreakThreshold()) {
				teacher_violations[NO_BREAK_INT][teacher_id]++;
			}
		}

		if (total_week_workload > max_teacher_work_load) {
			teacher_violations[EXCEED_MAX_WORKLOAD_INT][teacher_id]++;
		}

		if (total_week_workload < min_teacher_work_load) {
			teacher_violations[BELOW_MIN_WORKLOAD_INT][teacher_id]++;
		}

		// print("total_week_workload", total_week_workload, max_teacher_work_load, min_teacher_work_load, teacher_id);
	}

	const auto& section_set = Timetable::getSectionsSet();

	for (SectionID section_id : section_set) {
		// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
		// 	// print("ppp");
		// 	continue;
		// } else {
		// 	// print("hehe");
		// }

		Section section = best_solution.timetable.getSectionById(section_id);

		int end_gap_increment = section.getNumberOfBreak() == 1 ? 1 : 0;

		TimePoint early_not_allowed_break_duration_gap = section.getNotAllowedBreakslotGap() * best_solution.timetable.getDefaultClassDuration();

		TimePoint late_not_allowed_break_duration_gap = (section.getNotAllowedBreakslotGap() + end_gap_increment) * best_solution.timetable.getDefaultClassDuration();

		// print("late_not_allowed_break_duration_gap", late_not_allowed_break_duration_gap);

		// int max_time = Timetable::s_section_start[section_id] + Timetable::s_section_total_duration[section_id];
		TimePoint max_time = section.getStartTime() + section.getTotalDuration();

		// ASK: what if the section have additional schedules, it should not take into account on the calculation of break viability

		// print("max time ", max_time);

		const auto& break_slots = section.getBreakSlots();

		if (section.getNumberOfBreak() == 1) {
			if (!break_slots.empty()) {
				Timeslot break_time = *break_slots.begin();

				if (section.getTimeslotEnd(break_time) > max_time - late_not_allowed_break_duration_gap) {
					section_violations[LATE_BREAK_INT][section_id]++;
				}

				if (section.getTimeslotStart(break_time) < early_not_allowed_break_duration_gap) {
					section_violations[EARLY_BREAK_INT][section_id]++;
				}
			} else {
				print("break time is empty");
			}
		} else {
			if (break_slots.size() >= 2) {
				// this always assumes that there's only 2 break slots

				auto it = break_slots.begin();
				Timeslot break_time_1 = *it;
				++it;
				Timeslot break_time_2 = *it;

				TimePoint break_time_1_start = section.getTimeslotStart(break_time_1);
				TimePoint break_time_2_start = section.getTimeslotStart(break_time_2);

				TimePoint break_time_1_end = section.getTimeslotEnd(break_time_1);
				TimePoint break_time_2_end = section.getTimeslotEnd(break_time_2);

				TimePoint first_start = std::min(break_time_1_start, break_time_2_start);
				TimePoint last_end = std::max(break_time_1_end, break_time_2_end);

				// print("first_start", first_start, "last_end", last_end);

				if (last_end > max_time - late_not_allowed_break_duration_gap) {
					section_violations[LATE_BREAK_INT][section_id]++;
				}

				if (first_start < early_not_allowed_break_duration_gap) {
					section_violations[EARLY_BREAK_INT][section_id]++;
				}

				if (last_end - first_start <= early_not_allowed_break_duration_gap) {
					section_violations[SMALL_BREAK_GAP_INT][section_id]++;
				}
			} else {
				print("break time is expected to be 2");
			}
		}
	}

	int iter = 0;
	for (const auto& [violation_type, teacher_violation_count] : teacher_violations) {
		for (const auto& [teacher_id, violation_count] : teacher_violation_count) {
			// print("violation_type", violation_type, teacher_id, violation_count);
			int64_t packed = pack5IntToInt64(violation_type, teacher_id, violation_count, 0, 0);

			result_violation[iter++] = packed;
		}
	}

	for (const auto& [violation_type, section_violation_count] : section_violations) {
		for (const auto& [section_id, violation_count] : section_violation_count) {
			// print("violation_type", violation_type, section_id, violation_count);
			int64_t packed = pack5IntToInt64(violation_type, section_id, violation_count, 0, 0);

			result_violation[iter++] = packed;
		}
	}

	result_violation[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);
};

void ABC::getResult(int64_t* result, int64_t* result_2, TimePoint offset_duration) {
	print("Getting result...");

	int iter = 0;

	const auto& section_set = Timetable::getSectionsSet();

	// TODO: account for reserved schedule for teachers that is not included on sections

	for (const auto& section_id : section_set) {
		Section section = best_solution.timetable.getSectionById(section_id);

		TimePoint offset = section.getStartTime();

		const auto& classes = section.getClasses();

		for (const auto& [timeslot, classMap] : classes) {
			for (const auto& [day, schoolClass] : classMap) {
				// print("class xx",
				//       schoolClass.subject_id,
				//       schoolClass.teacher_id,
				//       static_cast<int>(timeslot),
				//       static_cast<int>(day));

				int64_t packed = pack5IntToInt64(
				    section_id,
				    schoolClass.subject_id,
				    schoolClass.teacher_id,
				    static_cast<int8_t>(timeslot),
				    static_cast<int8_t>(day));

				// std::cout << "teacher in getResult: " << schoolClass.teacher_id << std::endl;

				TimePoint start = section.getTimeslotStart(timeslot) + (offset_duration)*timeslot;
				TimePoint end = section.getTimeslotEnd(timeslot) + (offset_duration) * (timeslot + 1);

				SubjectConfigurationID subject_configuration_id = schoolClass.subject_configuration_id;

				// TimePoint start = section.getTimeslotStart(timeslot) + (1)*timeslot;
				// TimePoint end = section.getTimeslotEnd(timeslot) + (1) * (timeslot + 1);

				// TimePoint start = section.getTimeslotStart(timeslot);
				// TimePoint end = section.getTimeslotEnd(timeslot);

				// std::cout << "start " << start << " end " << end << std::endl;

				// start += offset;
				// end += offset;

				result[iter] = packed;
				result_2[iter] = pack5IntToInt64(start, end, subject_configuration_id, 0, 0);

				iter++;
			}
		}
	}

	result[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);
	result_2[iter] = pack5IntToInt64(-1, -1, -1, -1, -1);

	print("...Done getting result!");
}

int ABC::getIterationCount() const {
	return iteration_count;
}