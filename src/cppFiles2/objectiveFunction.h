#ifndef OBJECTIVEFUNCTION_H
#define OBJECTIVEFUNCTION_H

#include "bee.h"
#include "print.h"

struct ObjectiveFunction {
	static void evaluate(
	    Bee& bee,
	    std::unordered_set<int>& update_teachers,
	    std::unordered_set<int>& update_sections,
	    bool show_penalty,
	    bool is_initial) {
		int counter = 0;

		// print("ff");
		// auto& teachers_timetable = bee.timetable.teachers;

		if (is_initial) {
			bee.total_cost = 0;
		}

		for (int teacher_id : update_teachers) {
			if (!is_initial) {
				bee.total_cost -= bee.teacher_violations[teacher_id].class_timeslot_overlap;
				bee.total_cost -= bee.teacher_violations[teacher_id].no_break;
				bee.total_cost -= bee.teacher_violations[teacher_id].exceed_workload;
			}

			bee.resetTeacherViolation(teacher_id);

			Teacher teacher = bee.timetable.getTeacherById(teacher_id);

			// const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
			const auto& teacher_id_and_days = teacher.getUtilizedTime();
			const auto& class_count = teacher.getClassCount();

			const int max_teacher_work_load = teacher.getMaxWorkLoad();
			const int break_time_duration = bee.timetable.getBreakTimeDuration();

			for (const auto& [day, timeslot] : teacher_id_and_days) {
				if (class_count.at(day) > max_teacher_work_load) {
					bee.teacher_violations[teacher_id].exceed_workload += 5;
				}

				if (show_penalty) {
					print(YELLOW, "ff day", static_cast<int>(day), "size timeslot", timeslot.size(), RESET);
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

				float min_allowance = middle - (bee.timetable.getDefaultClassDuration() * allowance_multiplier);
				float max_allowance = middle + (bee.timetable.getDefaultClassDuration() * allowance_multiplier);

				int rounded_min_allowance = static_cast<int>(std::floor(min_allowance));
				int rounded_max_allowance = static_cast<int>(std::ceil(max_allowance));

				bool break_found = false;

				while (it != timeslot.end()) {
					int timeslot_key = it->first;
					int class_count = it->second;

					// print("timeslot_key", timeslot_key, "class_count", class_count, "teacher_id", teacher_id);

					if (show_penalty) {
					print(BLUE, "teacher", teacher_id, static_cast<int>(day), "U timeslot", timeslot_key, class_count, BLUE_B, ++counter, RESET);
					};

					if (nextIt != timeslot.end()) {
						int nextKey = nextIt->first;
						int difference = nextKey - 1 - timeslot_key;
						if ((difference >= break_time_duration) && !break_found) {
							if ((rounded_min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= rounded_max_allowance) ||
							    (rounded_min_allowance <= nextKey - 1 && nextKey - 1 <= rounded_max_allowance)) {
								break_found = true;
							}
						}
					}

					if (class_count > 1) {
						if (show_penalty) {
						print(RED, "teacher", teacher_id, "day", static_cast<int>(day), "timeslot", it->first, "value", class_count, RESET);
						}

						bee.teacher_violations[teacher_id].class_timeslot_overlap += class_count * 500;
					}

					it = nextIt;
					if (nextIt != timeslot.end()) {
						++nextIt;
					}
				}

				if (!break_found && class_count.at(day) >= bee.timetable.getTeacherBreakThreshold()) {
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
			}

			bee.total_cost += bee.teacher_violations[teacher_id].class_timeslot_overlap;
			bee.total_cost += bee.teacher_violations[teacher_id].no_break;
			bee.total_cost += bee.teacher_violations[teacher_id].exceed_workload;

			if (bee.teacher_violations[teacher_id].class_timeslot_overlap == 0 &&
			    bee.teacher_violations[teacher_id].no_break == 0 &&
			    bee.teacher_violations[teacher_id].exceed_workload == 0) {
				bee.timetable.teachers_with_conflicts.erase(teacher_id);
			} else {
				bee.timetable.teachers_with_conflicts.insert(teacher_id);
			}
		}

		return;

		for (int section_id : update_sections) {
			// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
			// 	// print("ppp");
			// 	continue;
			// } else {
			// 	// print("hehe");
			// }
			// auto& section = bee.timetable.sections[section_id];
			Section section = bee.timetable.getSectionById(section_id);

			int early_not_allowed_break_duration_gap = section.getNotAllowedBreakslotGap() * bee.timetable.getDefaultClassDuration();
			int late_not_allowed_break_duration_gap = (section.getNotAllowedBreakslotGap() + 1) * bee.timetable.getDefaultClassDuration();  // +1 magic number

			if (!is_initial) {
				bee.total_cost -= bee.section_violations[section_id].early_break;
				bee.total_cost -= bee.section_violations[section_id].small_break_gap;
				bee.total_cost -= bee.section_violations[section_id].late_break;
			}

			bee.resetSectionViolation(section_id);

			int max_time = section.getStartTime() + section.getTotalDuration();

			const auto& break_slots = section.getBreakSlots();

			if (section.getNumberOfBreak() == 1) {
				if (!break_slots.empty()) {
					int break_time = *break_slots.begin();

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
					int first_break_time = *it;
					++it;
					int last_break_time = *it;

					int first_start = section.getTimeslotStart(first_break_time);
					int last_end = section.getTimeslotEnd(last_break_time);

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
			for (int teacher : utilized_teachers) {
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

#endif  // OBJECTIVEFUNCTION_H
