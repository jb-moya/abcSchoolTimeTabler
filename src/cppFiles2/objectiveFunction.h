#pragma once

#include <tuple>

#include "bee.h"
#include "location.h"
#include "print.h"
#include "scheduledDay.h"
struct ObjectiveFunction {
	static void evaluate(
	    Bee& bee,
	    std::unordered_set<TeacherID>& update_teachers,
	    std::unordered_set<SectionID>& update_sections,
	    bool show_penalty,
	    bool is_initial) {
		int counter = 0;

		if (is_initial) {
			bee.total_cost = 0;
		}

		// print("what t ");
		// ;

		for (TeacherID teacher_id : update_teachers) {
			if (!is_initial) {
				bee.total_cost -= bee.teacher_violations[teacher_id].class_timeslot_overlap;
				bee.total_cost -= bee.teacher_violations[teacher_id].no_break;
				bee.total_cost -= bee.teacher_violations[teacher_id].exceed_workload;
				bee.total_cost -= bee.teacher_violations[teacher_id].below_min_workload;
				bee.total_cost -= bee.teacher_violations[teacher_id].class_proximity;
			}

			bee.resetTeacherViolation(teacher_id);

			Teacher teacher = bee.timetable.getTeacherById(teacher_id);

			const auto& daily_class_schedule = teacher.getUtilizedTime();
			const auto& total_day_work_load = teacher.getDayTotalWorkLoad();

			const TimeDuration max_teacher_work_load = teacher.getMaxDayWorkLoad();
			const TimeDuration min_teacher_work_load = teacher.getMinDayWorkLoad();
			const TimeDuration break_time_duration = bee.timetable.getBreakTimeDuration();

			for (const auto& [day, time_points_class_count] : daily_class_schedule) {
				if (total_day_work_load.at(day) > max_teacher_work_load) {
					bee.teacher_violations[teacher_id].exceed_workload++;
				}

				// print("work load", total_day_work_load.at(day));;

				if (total_day_work_load.at(day) < min_teacher_work_load) {
					bee.teacher_violations[teacher_id].exceed_workload++;
				}

				if (show_penalty) {
					print(YELLOW, "ff day", static_cast<int>(day), "size timeslot", time_points_class_count.size(), RESET);
				}

				if (time_points_class_count.size() == 0) {
					continue;
				}

				auto last_time_point = --time_points_class_count.end();
				float middle_time_point = (time_points_class_count.begin()->first + last_time_point->first) / 2;

				float min_time_point_allowance = middle_time_point - (bee.timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());
				float max_time_point_allowance = middle_time_point + (bee.timetable.getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot());

				TimePoint rounded_min_time_point_allowance = static_cast<int>(std::floor(min_time_point_allowance));
				TimePoint rounded_max_time_point_allowance = static_cast<int>(std::ceil(max_time_point_allowance));

				bool break_found = false;

				SectionID previous_section_class = -1;

				auto it = time_points_class_count.begin();
				auto nextIt = std::next(it);
				while (it != time_points_class_count.end()) {
					TimePoint time_point = it->first;
					auto& utilized_time_in_section = it->second;
					SectionID section_id = std::get<0>(utilized_time_in_section);
					int time_point_class_count = std::get<1>(utilized_time_in_section);
					int overlap_able = std::get<2>(utilized_time_in_section);

					// flase overlappble - able to overlap such as additional schedules

					// std::cout << "overlappable in objectivefunction " << overlap_able << std::endl;

					// int time_point_class_count = std::get<1>(utilized_time_in_section) + (overlap_able >= 1 ? 1 : 0);

					// i will not calculate the workload of the teacher in reserved schedule because it is already added.

					if (previous_section_class == -1) {
						previous_section_class = section_id;
					} else {
						if (section_id != previous_section_class) {
							Location from_section_location = bee.timetable.getSectionById(previous_section_class).getLocation();
							Location to_section_location = bee.timetable.getSectionById(section_id).getLocation();

							Building& from_building = bee.timetable.getBuildingById(from_section_location.building_id);
							Building& to_building = bee.timetable.getBuildingById(to_section_location.building_id);

							int distance = from_building.getDistanceTo(from_section_location, to_section_location, to_building);

							// print("distance", distance);

							bee.teacher_violations[teacher_id].class_proximity += distance;

							previous_section_class = section_id;
						}
					}

					// print("timeslot_key", timeslot_key, "class_count", class_count, "teacher_id", teacher_id);

					if (show_penalty) {
						print(BLUE, "teacher", teacher_id, static_cast<int>(day), "U timeslot", time_point, time_point_class_count, BLUE_B, ++counter, RESET);
					};

					if (nextIt != time_points_class_count.end()) {
						TimePoint next_time_point = nextIt->first;
						TimePoint difference = next_time_point - 1 - time_point;
						if ((difference >= break_time_duration) && !break_found) {
							if ((rounded_min_time_point_allowance <= time_point + 1 && time_point + 1 <= rounded_max_time_point_allowance) ||
							    (rounded_min_time_point_allowance <= next_time_point - 1 && next_time_point - 1 <= rounded_max_time_point_allowance)) {
								break_found = true;
							}
						}
					}

					if (time_point_class_count > 1) {
						if (show_penalty) {
							print(RED, "teacher", teacher_id, "day", static_cast<int>(day), "timeslot", it->first, "value", time_point_class_count, RESET);
						}

						bee.teacher_violations[teacher_id].class_timeslot_overlap += time_point_class_count * 500;
					}

					it = nextIt;
					if (nextIt != time_points_class_count.end()) {
						++nextIt;
					}
				}

				if (!break_found && total_day_work_load.at(day) >= bee.timetable.getTeacherBreakThreshold()) {
					if (show_penalty) {
						print(GREEN_B, "teacher with no break", teacher_id, "day", static_cast<int>(day), RESET);
					}
					bee.teacher_violations[teacher_id].no_break += 1;
				}
			}

			if (show_penalty) {
				print("teacher", teacher_id);
				print("a", bee.teacher_violations[teacher_id].class_timeslot_overlap);
				print("a", bee.teacher_violations[teacher_id].no_break);
				print("a", bee.teacher_violations[teacher_id].exceed_workload);
				print("a", bee.teacher_violations[teacher_id].below_min_workload);
				print("a", bee.teacher_violations[teacher_id].class_proximity);
			}

			bee.total_cost += bee.teacher_violations[teacher_id].class_timeslot_overlap;
			bee.total_cost += bee.teacher_violations[teacher_id].no_break;
			bee.total_cost += bee.teacher_violations[teacher_id].exceed_workload;
			bee.total_cost += bee.teacher_violations[teacher_id].below_min_workload;
			bee.total_cost += bee.teacher_violations[teacher_id].class_proximity;

			if (bee.teacher_violations[teacher_id].class_timeslot_overlap == 0 &&
			    bee.teacher_violations[teacher_id].no_break == 0 &&
			    bee.teacher_violations[teacher_id].exceed_workload == 0 &&
			    bee.teacher_violations[teacher_id].below_min_workload == 0) {
				bee.timetable.teachers_with_conflicts.erase(teacher_id);
			} else {
				bee.timetable.teachers_with_conflicts.insert(teacher_id);
			}
		}

		// return;

		for (SectionID section_id : update_sections) {
			// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
			// 	// print("ppp");
			// 	continue;
			// } else {
			// 	// print("hehe");
			// }
			// auto& section = bee.timetable.sections[section_id];
			Section section = bee.timetable.getSectionById(section_id);

			TimePoint early_not_allowed_break_duration_gap = section.getNotAllowedBreakslotGap() * bee.timetable.getDefaultClassDuration();
			TimePoint late_not_allowed_break_duration_gap = (section.getNotAllowedBreakslotGap() + 1) * bee.timetable.getDefaultClassDuration();  // +1 magic number

			if (!is_initial) {
				bee.total_cost -= bee.section_violations[section_id].early_break;
				bee.total_cost -= bee.section_violations[section_id].small_break_gap;
				bee.total_cost -= bee.section_violations[section_id].late_break;
			}

			bee.resetSectionViolation(section_id);

			TimePoint max_time = section.getStartTime() + section.getTotalDuration();

			const auto& break_slots = section.getBreakSlots();

			if (section.getNumberOfBreak() == 1) {
				if (!break_slots.empty()) {
					Timeslot break_time = *break_slots.begin();

					if (section.getTimeslotEnd(break_time) > max_time - late_not_allowed_break_duration_gap) {
						bee.section_violations[section_id].late_break += 10000;
					}

					if (section.getTimeslotStart(break_time) < early_not_allowed_break_duration_gap) {
						bee.section_violations[section_id].early_break += 10000;
					}
				} else {
					print("Break slots is empty");
				}
			} else {
				if (break_slots.size() >= 2) {
					// this always assumes that there's only 2 break slots
					auto it = break_slots.begin();
					Timeslot first_break_time = *it;
					++it;
					Timeslot last_break_time = *it;

					TimePoint first_start = section.getTimeslotStart(first_break_time);
					TimePoint last_end = section.getTimeslotEnd(last_break_time);

					if (last_end > max_time - late_not_allowed_break_duration_gap) {
						bee.section_violations[section_id].late_break += 10000;
					}

					if (first_start < early_not_allowed_break_duration_gap) {
						bee.section_violations[section_id].early_break += 10000;
					}

					if (last_end - first_start <= early_not_allowed_break_duration_gap) {
						bee.section_violations[section_id].small_break_gap += 10000;
					}
				} else {
					print("Break slots size is not 2");
				}
			}

			bee.total_cost += bee.section_violations[section_id].early_break;
			bee.total_cost += bee.section_violations[section_id].small_break_gap;
			bee.total_cost += bee.section_violations[section_id].late_break;

			bool has_teacher_with_conflicts = false;

			const auto& utilized_teachers = section.getUtilizedTeachers();
			for (TeacherID teacher : utilized_teachers) {
				if (bee.timetable.teachers_with_conflicts.find(teacher) != bee.timetable.teachers_with_conflicts.end()) {
					has_teacher_with_conflicts = true;
					break;
				}
			}

			if (bee.section_violations[section_id].early_break == 0 &&
			    bee.section_violations[section_id].small_break_gap == 0 &&
			    bee.section_violations[section_id].late_break == 0 &&
			    has_teacher_with_conflicts == false) {
				bee.timetable.sections_with_conflicts.erase(section_id);
			} else {
				bee.timetable.sections_with_conflicts.insert(section_id);
			}
		}
	};
};