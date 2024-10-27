#include "abc2.h"
#include "log.h"
#include "print.h"
#include "TimeManager.h"

using namespace std;

std::random_device rd;
std::mt19937 randomizer_engine(rd());

// #define LOG_FOLDER = "logs/";
#define LOG_FOLDER "logs2/"

std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> Timetable::s_section_subjects_units;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_duration;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_order;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_eligible_teachers_in_subject;
std::unordered_set<int16_t> Timetable::s_section_dynamic_subject_consistent_duration;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_section_subjects;
std::unordered_map<int16_t, int> Timetable::s_section_not_allowed_breakslot_gap;
std::unordered_map<int16_t, int> Timetable::s_section_total_duration;
// std::unordered_map<int16_t, int> Timetable::s_section_fixed_subject;
std::unordered_map<int16_t, int> Timetable::s_section_timeslot;
std::unordered_map<int16_t, int> Timetable::s_section_start;
std::unordered_set<int16_t> Timetable::s_teachers_set;
std::unordered_set<int16_t> Timetable::s_sections_set;
std::vector<int> Timetable::s_section_num_breaks;
int Timetable::s_break_timeslot_allowance;
int Timetable::s_teacher_break_threshold;
int Timetable::s_default_class_duration;
int Timetable::s_max_teacher_work_load;
int Timetable::s_break_time_duration;
int Timetable::s_work_week;

std::uniform_int_distribution<int16_t> Timetable::s_random_section;
std::uniform_int_distribution<int8_t> Timetable::s_random_workDay;
std::uniform_int_distribution<int16_t> Timetable::s_random_field;

void Timetable::reset() {
	s_eligible_teachers_in_subject.clear();
	s_section_subjects_duration.clear();
	s_section_subjects_units.clear();
	s_section_num_breaks.clear();
	s_section_subjects.clear();
	s_section_timeslot.clear();
	s_section_start.clear();
	s_teachers_set.clear();
	s_sections_set.clear();

	s_break_time_duration = 0;
	s_work_week = 0;

	initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

// void Timetable::initializeTeachersClass(int teachers) {
// 	for (int day = 1; day <= s_work_week; ++day) {
// 		teachers_class_count[day].resize(teachers);
// 		for (int i = 0; i < teachers; ++i) {
// 			teachers_class_count[day][i] = 0;
// 		}
// 	}
// }

void Teacher::initializeClass(int work_week) {
	for (int day = 1; day <= work_week; ++day) {
		class_count[day] = 0;
		// class_count[day].resize(teachers);
		// for (int i = 0; i < teachers; ++i) {
		// }
	}
}

void Timetable::initializeTeacherSet(int teachers) {
	s_teachers_set.clear();

	for (int i = 0; i < teachers; ++i) {
		s_teachers_set.insert(i);
	}
}

void Timetable::initializeSectionsSet(int sections) {
	s_sections_set.clear();

	for (int i = 0; i < sections; ++i) {
		s_sections_set.insert(i);
	}
}
void Timetable::initializeRandomSectionDistribution(int min, int max) {
	s_random_section = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomFieldDistribution(int min, int max) {
	s_random_field = std::uniform_int_distribution<int16_t>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	s_random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}

void Timetable::updateTeachersAndSections(
    std::unordered_set<int16_t>& update_teachers,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<int, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    int16_t selected_section,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);

	auto section = sections[selected_section];
	;

	auto timeslot_begin = sections[selected_section].classes.begin();

	int start = Timetable::s_section_start[selected_section];

	for (auto it = itLow; it != itUp; ++it) {
		if (it->first == itLow->first + 1 && is_skipping_between) {
			it = itUpPrev;
		}

		auto& day_schedule = section.classes[it->first];
		auto day_zero = day_schedule.find(0);

		if (it != timeslot_begin) {
			start = section.time_range[std::prev(it)->first].end;
		}

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;
			int duration = (subject == -1) ? Timetable::s_break_time_duration : Timetable::s_section_subjects_duration[selected_section][subject];

			int teacher = day_zero->second.teacher_id;

			if (!is_reset) {
				section.time_range.at(it->first).start = start;
				section.time_range.at(it->first).end = start + duration;
			}

			if (subject != -1) {
				// auto& teacher_timeslot = teachers_timeslots[teacher];
				auto& utilized_time = teachers[teacher].utilized_time;

				if (is_returning_teachers) {
					update_teachers.insert(static_cast<int16_t>(teacher));
				}

				for (int i = 1; i <= Timetable::s_work_week; ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							// print(is_reset, "is reset", teacher, i, j + start);
							if (--utilized_time[i][j + start] <= 0) {
								utilized_time[i].erase(j + start);

								if (utilized_time[i].empty()) {
									utilized_time.erase(i);
								}
							};
						} else {
							// print(is_reset, "is reset", teacher, i, j + start);
							utilized_time[i][j + start]++;
						}
					}
				}
			};
		} else {
			int max_duration = 0;

			for (const auto& day : it->second) {
				int subject = day.second.subject_id;
				int duration = Timetable::s_section_subjects_duration[selected_section][subject];
				max_duration = std::max(max_duration, duration);
				int teacher = day.second.teacher_id;

				auto& utilized_time = teachers[teacher].utilized_time;

				if (is_returning_teachers) {
					update_teachers.insert(static_cast<int16_t>(teacher));
				}

				for (int j = 0; j < duration; ++j) {
					if (is_reset) {
						// print("is reset", teacher);
						if (--utilized_time[day.first][start + j] <= 0) {
							// can i use: std::optional<T>::swap on this

							utilized_time[day.first].erase(start + j);

							if (utilized_time[day.first].empty()) {
								utilized_time.erase(day.first);
							}
						}
					} else {
						// print("is reset", teacher, day.first, j + start);
						utilized_time[day.first][start + j]++;
					}
				}
			}

			if (!is_reset) {
				section.time_range.at(it->first).start = start;
				section.time_range.at(it->first).end = start + max_duration;
			}
		}
	}
}

std::vector<std::vector<int>> getAllBreaksCombination(int slot_count, int break_count, int gap) {
	std::set<int> breaks;
	std::set<int> possible_breaks;

	for (int i = gap; i < slot_count - (gap + 1); ++i) {  // leaving one behind
		// std::cout << "zz" << i << std::endl;
		possible_breaks.insert(i);
	}

	// print("break count", break_count);

	if (break_count == 1) {
		std::vector<std::vector<int>> combinations;

		for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
			combinations.push_back({*it});
		}

		return combinations;
	}

	std::vector<std::vector<int>> combinations;

	for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
		// std::cout << "allowed_break " << *it << std::endl;
		int first = *it;

		for (auto it2 = it; it2 != possible_breaks.end(); ++it2) {
			if (std::abs(first + 1 - *it2) >= gap) {
				// std::cout << "combination : " << first << " " << *it2 << std::endl;
				combinations.push_back({first, *it2});
			}
		}
	}

	return combinations;
}

int16_t Timetable::getRandomTeacher(int16_t subject_id) {
	std::uniform_int_distribution<> dis(0, Timetable::s_eligible_teachers_in_subject[subject_id].size() - 1);
	return Timetable::s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];

	// std::vector<int16_t>& eligible_teachers = Timetable::s_eligible_teachers_in_subject[subject_id];

	// // Find the teacher who has been assigned the fewest sections
	// int min_assignments = 999;  // maximum possible number of sections
	// std::vector<int16_t> least_assigned_teachers;

	// // // Identify teachers with the minimum number of assignments
	// for (int16_t teacher : eligible_teachers) {
	// 	int assignment_count = 0;

	// 	for (int day = 1; day <= s_work_week; ++day) {
	// 		if (assignment_count < [day][teacher]) {
	// 			assignment_count = [day][teacher];
	// 		}
	// 	}

	// 	if (assignment_count < min_assignments) {
	// 		min_assignments = assignment_count;
	// 		least_assigned_teachers.clear();
	// 		least_assigned_teachers.push_back(teacher);
	// 	} else if (assignment_count == min_assignments) {
	// 		least_assigned_teachers.push_back(teacher);
	// 	}
	// }

	// // // Randomly select a teacher from the least assigned list
	// std::uniform_int_distribution<> dis(0, least_assigned_teachers.size() - 1);
	// return least_assigned_teachers[dis(randomizer_engine)];
}

void Timetable::initializeRandomTimetable(std::unordered_set<int16_t>& update_teachers) {
	if (sections.size() == 0) {
		print("no sections");
		exit(1);
	}

	for (auto& [section_id, section] : sections) {
		// int16_t section_id = section_id;
		std::vector<int16_t> random_subjects = s_section_subjects[section_id];
		// print("random_subjects", random_subjects.size());
		std::map<int, int>
		    timeslots;

		auto& classes = section.classes;

		// std::vector<int> timeslot_keys;
		std::deque<int> timeslot_keys;
		for (int i = 0; i < s_section_timeslot[section_id]; ++i) {
			// print("i i i", i);
			timeslots[i] = Timetable::s_work_week;
			timeslot_keys.push_back(i);
		}
		// print("3");

		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		std::map<int, int> fixed_subject_order;
		std::set<int> non_dynamic_order_start;
		std::set<int> non_dynamic_order_end;
		std::set<int> reserved_timeslots;

		std::shuffle(random_subjects.begin(), random_subjects.end(), randomizer_engine);

		const auto& units_map = Timetable::s_section_subjects_units[section_id];

		for (const auto& subject_id : random_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			if (units_map.at(subject_id).second == 0) {
				if (order != 0) {
					full_week_day_subjects.insert(full_week_day_subjects.begin(), subject_id);

					if (order < 0) {
						non_dynamic_order_start.insert(order);
					} else {
						non_dynamic_order_end.insert(order);
					}

				} else {
					full_week_day_subjects.push_back(subject_id);
				}

			} else {
				if (order != 0) {
					special_unit_subjects.insert(special_unit_subjects.begin(), subject_id);

					if (order < 0) {
						non_dynamic_order_start.insert(order);
					} else {
						non_dynamic_order_end.insert(order);
					}
				} else {
					special_unit_subjects.push_back(subject_id);
				}
			}
		}

		// for (int i = 0; i < num_breaks; ++i) {
		// 	// TODO: have some way of optimizing this
		// 	// int break_slot = (Timetable::s_section_timeslot[section_id] / (num_breaks + 1)) * (i + 1);
		// 	std::uniform_int_distribution<> dist(1, timeslot_keys.size() - 2);  // ignore first and last
		// 	int random_index = dist(randomizer_engine);
		// 	int timeslot_key = timeslot_keys[random_index];
		// 	timeslot_keys.erase(timeslot_keys.begin() + random_index);
		// 	school_classes[section_id][timeslot_key][0] = SchoolClass{-1, -1};
		// 	section_break_slots[section_id].insert(timeslot_key);
		// 	timeslots.erase(timeslot_key);
		// }

		// print("1");
		int num_breaks = Timetable::s_section_num_breaks[section_id];

		std::vector<std::vector<int>>
		    breaks_combination = getAllBreaksCombination(s_section_timeslot[section_id], num_breaks, s_section_not_allowed_breakslot_gap[section_id]);  // will not work on special program
		std::uniform_int_distribution<> dis_break_combination(0, breaks_combination.size() - 1);

		int random_index = dis_break_combination(randomizer_engine);

		for (size_t i = 0; i < breaks_combination[random_index].size(); ++i) {
			int break_slot = breaks_combination[random_index][i];

			break_slot = 3;

			// print("break slot : ", break_slot);
			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
			classes[break_slot][0] = SchoolClass{-1, -1};

			section.break_slots.insert(break_slot);
			timeslots.erase(break_slot);
		}

		// {
		// 	int break_slot = Timetable::s_section_break_slot[section_id];
		// 	// print("break slot : ", break_slot);
		// 	timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
		// 	school_classes[section_id][break_slot][0] = SchoolClass{-1, -1};
		// 	section_break_slots[section_id].insert(break_slot);
		// 	timeslots.erase(break_slot);
		// }

		auto timeslot_it = timeslot_keys.begin();
		for (auto itr : non_dynamic_order_start) {
			fixed_subject_order[itr] = *timeslot_it;
			reserved_timeslots.insert(*timeslot_it);
			print("F 1 ", itr, *timeslot_it);
			++timeslot_it;
		}

		auto timeslot_it_reverse = timeslot_keys.rbegin();
		for (auto it = non_dynamic_order_end.rbegin(); it != non_dynamic_order_end.rend(); ++it) {
			fixed_subject_order[*it] = *timeslot_it_reverse;
			reserved_timeslots.insert(*timeslot_it_reverse);
			print("F 2 ", *timeslot_it_reverse);
			++timeslot_it_reverse;
		}

		// std::unordered_set<int> used_break_slots;  // To keep track of already assigned break slots
		// for (int i = 0; i < num_breaks; ++i) {
		// 	int break_slot;
		// 	std::uniform_int_distribution<> dis(1, Timetable::s_section_timeslot[section_id] - 1);  // ignore first and last
		// 	// Generate a unique break_slot
		// 	do {
		// 		break_slot = dis(randomizer_engine);
		// 	} while (used_break_slots.find(break_slot) != used_break_slots.end());  // Repeat if break_slot is already used
		// 	// Now we have a unique break_slot
		// 	used_break_slots.insert(break_slot);  // Mark this break_slot as used
		// 	// Remove the selected timeslot key
		// 	timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
		// 	// Assign the break slot to the timetable
		// 	school_classes[section_id][break_slot][0] = SchoolClass{-1, -1};  // Mark as break
		// 	section_break_slots[section_id].insert(break_slot);               // Store this break slot
		// 	timeslots.erase(break_slot);                                      // Remove from available timeslots
		// }
		// print("5");

		std::shuffle(timeslot_keys.begin(), timeslot_keys.end(), randomizer_engine);

		// print("fasjkdljf", timeslot_keys.size(), "Fcv", full_week_day_subjects.size(), "Fcv", special_unit_subjects.size(), "Fcv");
		for (const auto& subject_id : full_week_day_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			int16_t selected_teacher = getRandomTeacher(subject_id);

			section.utilized_teachers.insert(selected_teacher);

			for (int day = 1; day <= s_work_week; ++day) {
				teachers[selected_teacher].class_count[day]++;
			}
			// print("5.c");

			if (order == 0) {
				// int timeslot_key = timeslot_keys.back();

				// print("xxx timeslot key: ", timeslot_key);

				// timeslot_keys.pop_back();

				std::uniform_int_distribution<> dist(0, timeslot_keys.size() - 1);
				int timeslot_key = timeslot_keys[dist(randomizer_engine)];

				// TODO: a way to optimize this?
				do {
					timeslot_key = timeslot_keys[dist(randomizer_engine)];
				} while (reserved_timeslots.find(timeslot_key) != reserved_timeslots.end());

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				classes[timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				timeslots.erase(timeslot_key);
			} else {
				int timeslot_key = fixed_subject_order[order];

				print("aaaaaaa timeslot key: ", timeslot_key);

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
				classes[timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				section.fixed_timeslot_day[timeslot_key].insert(0);

				timeslots.erase(timeslot_key);
			}
		}

		// print("6");

		// for (auto& timeslot : timeslots) {
		// 	print("zz  timeslot: ", timeslot.first, " value: ", timeslot.second);
		// }

		int day = 1;
		// print(" -ffffffff- - - ff--  -- -");
		for (const auto& subject_id : special_unit_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			int16_t num_unit = units_map.at(subject_id).second;

			int16_t selected_teacher = getRandomTeacher(subject_id);
			teachers[selected_teacher].class_count[day]++;

			section.utilized_teachers.insert(selected_teacher);

			for (int iter = 1; iter <= num_unit; ++iter) {
				if (order == 0) {
					auto it = std::find_if(timeslot_keys.rbegin(), timeslot_keys.rend(),
					                       [&timeslots](int key) { return timeslots[key] > 0; });

					if (it == timeslot_keys.rend()) {
						// print("no more timeslots");
						break;
					}

					int timeslot = *it;

					// print("timeslot: ", timeslot);

					classes[timeslot][day] = SchoolClass{subject_id, selected_teacher};
					section.segmented_timeslot.insert(timeslot);

					if (--timeslots[timeslot] == 0) {
						auto regularIt = it.base();
						timeslot_keys.erase(--regularIt);
						timeslots.erase(timeslot);
					}
				} else {
					int timeslot_key = fixed_subject_order[order];

					// print("timeslot: ", timeslot_key);

					classes[timeslot_key][day] = SchoolClass{subject_id, selected_teacher};
					section.segmented_timeslot.insert(timeslot_key);

					section.fixed_timeslot_day[timeslot_key].insert(day);

					if (--timeslots[timeslot_key] == 0) {
						timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
						timeslots.erase(timeslot_key);
					}
				}

				if (++day > s_work_week) day = 1;
			}
		}

		int class_start = Timetable::s_section_start[section_id];

		for (const auto& [timeslot, day_school_class] : classes) {
			// std::cout << "Key: " << pair.first << ", Value: " << pair.second.count(0) << std::endl;

			if (day_school_class.count(0)) {
				const SchoolClass& schoolClass = day_school_class.at(0);
				int16_t subject_id = schoolClass.subject_id;

				int duration = (subject_id == -1) ? Timetable::s_break_time_duration : Timetable::s_section_subjects_duration[section_id][subject_id];

				section.time_range[timeslot] = ClassStartEnd{class_start, class_start + duration};
				class_start += duration;

			} else {
				int max_duration = 0;

				for (int i = 1; i <= s_work_week; ++i) {
					if (day_school_class.count(i)) {
						int subject_id = day_school_class.at(i).subject_id;

						if (Timetable::s_section_subjects_duration[section_id][subject_id] > max_duration) {
							max_duration = Timetable::s_section_subjects_duration[section_id][subject_id];
						}
					}
				}

				// print("hHh 2", class_start, max_duration);

				// print(RED, "napupunta", class_start);
				section.time_range[timeslot] = ClassStartEnd{class_start, class_start + max_duration};

				class_start += max_duration;
			}
		}

		Timetable::s_section_total_duration[section_id] = class_start - Timetable::s_section_start[section_id];

		updateTeachersAndSections(update_teachers, classes.begin(), classes.end(), true, false, section_id, false);
	}
}

int Timetable::getRandomInRange(int n) {
	std::uniform_int_distribution<int> distribution(0, n);
	return distribution(randomizer_engine);
}

std::pair<int, int> Timetable::pickRandomTimeslots(int selected_section, int field) {
	int selected_timeslot_1;
	int selected_timeslot_2;

	auto& section = sections[selected_section];

	int timeslots = s_section_timeslot[selected_section];
	auto& section_break_slots = section.break_slots;
	auto& fixed_timeslot_day = section.fixed_timeslot_day;

	if (field == 0) {
		bool is_timeslot_1_at_start_or_end_of_schedule = false;
		bool is_timeslot_2_at_start_or_end_of_schedule = false;

		bool is_timeslot_1_break = false;
		bool is_timeslot_2_break = false;

		bool is_fixed_subject = false;

		bool ignore_break_slots = false;

		bool is_consistent_duration = Timetable::s_section_dynamic_subject_consistent_duration.find(selected_section) != Timetable::s_section_dynamic_subject_consistent_duration.end();

		do {
			selected_timeslot_1 = getRandomInRange(s_section_timeslot[selected_section] - 1);
			selected_timeslot_2 = getRandomInRange(s_section_timeslot[selected_section] - 1);

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == s_section_timeslot[selected_section] - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == s_section_timeslot[selected_section] - 1;

			is_timeslot_1_break = section_break_slots.find(selected_timeslot_1) != section_break_slots.end();
			is_timeslot_2_break = section_break_slots.find(selected_timeslot_2) != section_break_slots.end();

			if (is_consistent_duration && (is_timeslot_1_break || is_timeslot_2_break)) {
				ignore_break_slots = true;
			} else {
				ignore_break_slots = false;
			}

			// TODO: instead of blindly selecting a random timeslot that is not fixed, the selection must already be viable
			is_fixed_subject = fixed_timeslot_day.find(selected_timeslot_1) != fixed_timeslot_day.end();
			is_fixed_subject |= fixed_timeslot_day.find(selected_timeslot_2) != fixed_timeslot_day.end();

			// print("cc", is_fixed_subject, selected_timeslot_1, is_timeslot_1_break, selected_timeslot_2, is_timeslot_2_break);

		} while (selected_timeslot_1 == selected_timeslot_2 ||
		         (is_timeslot_1_at_start_or_end_of_schedule && is_timeslot_2_break) ||
		         (is_timeslot_2_at_start_or_end_of_schedule && is_timeslot_1_break) ||
		         is_fixed_subject || ignore_break_slots);
		// } while (selected_timeslot_1 == selected_timeslot_2 ||
		//          (is_timeslot_1_at_start_or_end_of_schedule && is_timeslot_2_break) ||
		//          (is_timeslot_2_at_start_or_end_of_schedule && is_timeslot_1_break) ||
		//          is_fixed_subject);

	} else if (field == 1) {
		selected_timeslot_1 = getRandomInRange(timeslots - 1);
		selected_timeslot_2 = selected_timeslot_1;
	} else if (field == 2) {
		std::vector<int16_t> timeslots;
		for (const auto& entry : section.segmented_timeslot) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);
		selected_timeslot_1 = timeslots[dis2(randomizer_engine)];
		selected_timeslot_2 = timeslots[dis2(randomizer_engine)];

		// print("selected_timeslot_1", selected_timeslot_1, "selected_timeslot_2", selected_timeslot_2);
	}

	return {selected_timeslot_1, selected_timeslot_2};
}

int16_t Timetable::pickRandomSection() {
	// return Timetable::s_random_section(randomizer_engine);

	if (sections_with_conflicts.empty()) {
		// exit(0);
		// throw std::runtime_error("The unordered_set is empty.");
		// print("empty", sections_with_conflicts.size());
		return Timetable::s_random_section(randomizer_engine);
	} else {
		// system("clear");
		// return Timetable::s_random_section(randomizer_engine);
		std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

		int random_index = dis(randomizer_engine);

		auto it = sections_with_conflicts.begin();
		std::advance(it, random_index);

		// print("section picked;", *it, sections_with_conflicts.size());

		return *it;
	}
}

int16_t Timetable::pickRandomField(int16_t selected_section) {
	if (sections[selected_section].segmented_timeslot.empty()) {
		std::uniform_int_distribution<> dis(0, 1);

		return dis(randomizer_engine);
	} else {
		return Timetable::s_random_field(randomizer_engine);
	}
}

void Timetable::modify(std::unordered_set<int16_t>& update_teachers, std::unordered_set<int16_t>& update_sections) {
	// if (sections_with_conflicts.size() >= 1) {
	// 	print(RED, "j");
	// 	print(RED, "conflicts count", sections_with_conflicts.size());
	// }

	int16_t selected_section = Timetable::pickRandomSection();
	int16_t choice = Timetable::pickRandomField(selected_section);
	// print(RED, "choice ", choice);

	if (choice == 0) {
		update_sections.insert(selected_section);
	}

	auto selected_timeslots = pickRandomTimeslots(selected_section, choice);

	int selected_timeslot_1 = selected_timeslots.first;
	int selected_timeslot_2 = selected_timeslots.second;

	auto& section = sections[selected_section];
	auto& classes = section.classes;

	auto itLow = classes.lower_bound(std::min(selected_timeslot_1, selected_timeslot_2));
	auto itUp = classes.upper_bound(std::max(selected_timeslot_1, selected_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	int duration_1 = section.time_range[selected_timeslot_1].end - section.time_range[selected_timeslot_1].start;
	int duration_2 = section.time_range[selected_timeslot_2].end - section.time_range[selected_timeslot_2].start;

	bool is_skipping_between = duration_1 == duration_2;

	updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);

	if (choice == 0) {
		// swapping of classes between timeslots in the same section

		// std::cout << "swapping " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		// print("bool", is_itLow_break, "bool", is_itUpPrev_break, "xx", random_timeslot_1, random_timeslot_2);

		auto& break_slots = section.break_slots;

		if (break_slots.find(itLow->first) != break_slots.end() && break_slots.find(itUpPrev->first) == break_slots.end()) {
			break_slots.erase(itLow->first);
			break_slots.insert(itUpPrev->first);
		} else if (break_slots.find(itUpPrev->first) != break_slots.end() && break_slots.find(itLow->first) == break_slots.end()) {
			break_slots.erase(itUpPrev->first);
			break_slots.insert(itLow->first);
		}

		std::swap(classes[selected_timeslot_1], classes[selected_timeslot_2]);

		// TODO: make this a function of section struct
		if (!section.segmented_timeslot.empty()) {
			auto& timeslot_set = section.segmented_timeslot;

			if (timeslot_set.count(selected_timeslot_1) > 0 && timeslot_set.count(selected_timeslot_2) == 0) {
				timeslot_set.erase(selected_timeslot_1);
				timeslot_set.insert(selected_timeslot_2);
			} else if (timeslot_set.count(selected_timeslot_2) > 0 && timeslot_set.count(selected_timeslot_1) == 0) {
				timeslot_set.erase(selected_timeslot_2);
				timeslot_set.insert(selected_timeslot_1);
			}
		}

	} else if (choice == 1) {
		// 	// changing teachers
		auto& section_timeslot = classes[selected_timeslot_1];

		if (section_timeslot.count(0) > 0) {  // check if consistent mon to fri
			int16_t subject_id = section_timeslot[0].subject_id;
			int16_t old_teacher = section_timeslot[0].teacher_id;
			// TODO: if there's only one teacher available, don't do this way
			std::uniform_int_distribution<> dis(0, s_eligible_teachers_in_subject[subject_id].size() - 1);

			if (subject_id != -1) {
				int16_t random_teacher;

				do {
					random_teacher = s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
				} while (random_teacher == old_teacher && s_eligible_teachers_in_subject[subject_id].size() > 1);

				for (int day = 1; day <= s_work_week; day++) {
					// TODO: MIGHT make this a function
					teachers[old_teacher].class_count[day]--;
					teachers[random_teacher].class_count[day]++;
				}

				update_teachers.insert(old_teacher);
				update_teachers.insert(random_teacher);

				section.utilized_teachers.erase(old_teacher);
				section.utilized_teachers.insert(random_teacher);

				// std::cout << subject_id << " old teacher : " << old_teacher << " <- zero day :" << "Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
				section_timeslot[0] = SchoolClass{subject_id, random_teacher};
			};
		} else {
			std::uniform_int_distribution<> dis_work_day(0, section_timeslot.size() - 1);

			int randomIndex = dis_work_day(randomizer_engine);

			auto it = section_timeslot.begin();
			std::advance(it, randomIndex);

			int16_t subject_id = section_timeslot[it->first].subject_id;
			int16_t old_teacher = section_timeslot[it->first].teacher_id;

			std::uniform_int_distribution<> dis(0, s_eligible_teachers_in_subject[subject_id].size() - 1);
			int16_t random_teacher;

			do {
				random_teacher = s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
			} while (random_teacher == old_teacher && s_eligible_teachers_in_subject[subject_id].size() > 1);

			for (int day = 1; day <= s_work_week; day++) {
				teachers[old_teacher].class_count[day]--;
				teachers[random_teacher].class_count[day]++;
			}

			// std::cout << subject_id << " old teacher : " << old_teacher << " <- workday : " << _staticcast<int>(workday) << " Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
			section_timeslot[it->first] = SchoolClass{subject_id, random_teacher};
		}
	} else if (choice == 2) {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		int day_1, day_2;

		auto& section_timeslot_1 = classes[selected_timeslot_1];
		auto& section_timeslot_2 = classes[selected_timeslot_2];

		do {
			day_1 = Timetable::s_random_workDay(randomizer_engine);
			day_2 = Timetable::s_random_workDay(randomizer_engine);

			// FIXME: this will cause infinite loop with fixed timeslot day:
			// is_fixed_timeslot_day = section_fixed_timeslot_day[selected_section][selected_timeslot_1].find(day_1) != section_fixed_timeslot_day[selected_section][selected_timeslot_1].end();
			// is_fixed_timeslot_day |= section_fixed_timeslot_day[selected_section][selected_timeslot_2].find(day_2) != section_fixed_timeslot_day[selected_section][selected_timeslot_2].end();

			// might important:
			// } while ((day_1 == day_2 && selected_timeslot_1 == selected_timeslot_2) ||
			//          (section_timeslot_1.find(day_1) == section_timeslot_1.end() &&
			//           section_timeslot_2.find(day_2) == section_timeslot_2.end()));
		} while ((day_1 == day_2 && selected_timeslot_1 == selected_timeslot_2));

		auto it1 = section_timeslot_1.find(day_1);
		auto it2 = section_timeslot_2.find(day_2);

		if (it1 != section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			int16_t teacher_id_1 = it1->second.teacher_id;
			int16_t teacher_id_2 = it2->second.teacher_id;

			teachers[teacher_id_1].class_count[day_1]--;
			teachers[teacher_id_1].class_count[day_2]++;

			teachers[teacher_id_2].class_count[day_1]++;
			teachers[teacher_id_2].class_count[day_2]--;

			std::swap(it1->second, it2->second);
		} else if (it1 != section_timeslot_1.end() && it2 == section_timeslot_2.end()) {
			int16_t teacher_id = it1->second.teacher_id;

			teachers[teacher_id].class_count[day_1]--;
			teachers[teacher_id].class_count[day_2]++;

			section_timeslot_2[day_2] = std::move(it1->second);
			section_timeslot_1.erase(it1);
		} else if (it1 == section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			int16_t teacher_id = it2->second.teacher_id;

			teachers[teacher_id].class_count[day_1]++;
			teachers[teacher_id].class_count[day_2]--;

			section_timeslot_1[day_1] = std::move(it2->second);
			section_timeslot_2.erase(it2);
		}
	}

	updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
};

int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e) {
	int64_t result = 0;
	result |= (static_cast<int64_t>(a) & 0xFFFF) << 48;
	result |= (static_cast<int64_t>(b) & 0xFFFF) << 32;
	result |= (static_cast<int64_t>(c) & 0xFFFF) << 16;
	result |= (static_cast<int64_t>(d) & 0xFF) << 8;
	result |= (static_cast<int64_t>(e) & 0xFF);
	return result;
}

int32_t packInt16ToInt32(int16_t first, int16_t second) {
	int32_t result = (static_cast<int32_t>(first) << 16) | (static_cast<uint16_t>(second));
	return result;
}

void ObjectiveFunction::evaluate(
    Bee& bee,
    std::unordered_set<int16_t>& update_teachers,
    std::unordered_set<int16_t>& update_sections,
    bool show_penalty,
    bool is_initial) {
	int counter = 0;

	auto& teachers_timetable = bee.timetable.teachers;

	if (is_initial) {
		bee.total_cost = 0;
	}

	// for (const int& teacher_id : update_teachers) {
	for (const int16_t& teacher_id_16 : update_teachers) {
		int teacher_id = static_cast<int>(teacher_id_16);
		// auto it = teachers_timetable.find(teacher_id);

		if (!is_initial) {
			bee.total_cost -= bee.teacher_violations[teacher_id].class_timeslot_overlap;
			bee.total_cost -= bee.teacher_violations[teacher_id].no_break;
			bee.total_cost -= bee.teacher_violations[teacher_id].exceed_workload;
			bee.total_cost -= bee.teacher_violations[teacher_id].class_gap;
		}

		bee.resetTeacherViolation(teacher_id);

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
		const auto& class_count = teachers_timetable.at(teacher_id).class_count;

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (class_count.at(day) > max_teacher_work_load) {
				bee.teacher_violations[teacher_id].exceed_workload += 1;
			}

			if (show_penalty) {
				print(YELLOW, "ff day", day, "size timeslot", timeslot.size(), RESET);
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

			float min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			float max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);

			int rounded_min_allowance = static_cast<int>(std::floor(min_allowance));
			int rounded_max_allowance = static_cast<int>(std::ceil(max_allowance));

			// int gap = 0;
			bool break_found = false;

			// bool overlap_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				// if (class_count >= 5) {
				// 	print("class_count", class_count);
				// }

				if (show_penalty) {
					print(BLUE, "teacher", teacher_id, day, "U timeslot", timeslot_key, class_count, BLUE_B, ++counter, RESET);
				};
				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - 1 - timeslot_key;
					// gap += difference;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= rounded_max_allowance) ||
						    (rounded_min_allowance <= nextKey - 1 && nextKey - 1 <= rounded_max_allowance)) {
							break_found = true;
						}
					}
				}

				// if (class_count == 2) {
				// 	print("jj");
				// 	bee.teacher_violations[teacher_id].class_timeslot_overlap += 100000;
				// }

				// if (class_count > 2 || class_count < 2) {
				if (class_count > 1) {
					// if (!overlap_found && class_count > 1) {
					if (show_penalty) {
						print(RED, "teacher", teacher_id, "day", day, "timeslot", it->first, "value", class_count, RESET);
					}

					// overlap_found = true;
					bee.teacher_violations[teacher_id].class_timeslot_overlap += class_count * 5000;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			// if (overlap_found) {
			// 	bee.teacher_violations[teacher_id].class_timeslot_overlap += 1;
			// }

			if (!break_found && class_count.at(day) >= bee.timetable.s_teacher_break_threshold) {
				if (show_penalty) {
					print(GREEN_B, "teacher with no break", teacher_id, "day", day, RESET);
				}
				bee.teacher_violations[teacher_id].no_break += 1;
			}
		}

		if (show_penalty) {
			print("teacher", teacher_id);
			print("a", bee.teacher_violations[teacher_id].class_timeslot_overlap);
			print("a", bee.teacher_violations[teacher_id].no_break);
			print("a", bee.teacher_violations[teacher_id].exceed_workload);
			print("a", bee.teacher_violations[teacher_id].class_gap);
		}

		bee.total_cost += bee.teacher_violations[teacher_id].class_timeslot_overlap;
		bee.total_cost += bee.teacher_violations[teacher_id].no_break;
		bee.total_cost += bee.teacher_violations[teacher_id].exceed_workload;
		bee.total_cost += bee.teacher_violations[teacher_id].class_gap;

		if (bee.teacher_violations[teacher_id].class_timeslot_overlap == 0 &&
		    bee.teacher_violations[teacher_id].no_break == 0 &&
		    bee.teacher_violations[teacher_id].exceed_workload == 0 &&
		    bee.teacher_violations[teacher_id].class_gap == 0) {
			bee.timetable.teachers_with_conflicts.erase(static_cast<int16_t>(teacher_id));
		} else {
			bee.timetable.teachers_with_conflicts.insert(static_cast<int16_t>(teacher_id));
		}
	}

	// auto& sections_timetable = bee.timetable.school_classes;
	// auto& section_class_start_end = bee.timetable.section_time_range;
	// auto& section_break_time = bee.timetable.section_break_slots;
	return;

	for (const int16_t& section_id_16 : update_sections) {
		int section_id = static_cast<int>(section_id_16);
		// for (const int& section_id : update_sections) {
		// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
		// 	// print("ppp");
		// 	continue;
		// } else {
		// 	// print("hehe");
		// }
		auto& section = bee.timetable.sections[section_id];

		int early_not_allowed_break_duration_gap = Timetable::s_section_not_allowed_breakslot_gap[section_id] * Timetable::s_default_class_duration;
		int late_not_allowed_break_duration_gap = (Timetable::s_section_not_allowed_breakslot_gap[section_id] + 1) * Timetable::s_default_class_duration;

		// auto it = sections_timetable.find(section_id);
		// print(BOLD, "section", section_id, "size", it->second.size());

		if (!is_initial) {
			bee.total_cost -= bee.section_violations[section_id].early_break;
			bee.total_cost -= bee.section_violations[section_id].small_break_gap;
			bee.total_cost -= bee.section_violations[section_id].late_break;
		}

		bee.resetSectionViolation(section_id);

		int max_time = bee.timetable.s_section_start[section_id] + bee.timetable.s_section_total_duration[section_id];

		if (section.break_slots.size() == 1) {
			// print("TITEEEEEEEEEEEEEEEE", section_id);

			int break_time = *section.break_slots.begin();

			if (section.time_range[break_time].end > max_time - late_not_allowed_break_duration_gap) {
				bee.section_violations[section_id].late_break += 10000;
			}

			// print("section_class_start_end[section_id][break_time].start", section_class_start_end[section_id][break_time].start);

			if (section.time_range[break_time].start < early_not_allowed_break_duration_gap) {
				bee.section_violations[section_id].early_break += 10000;
			}
		} else {
			int first_break_time = *section.break_slots.begin();
			int last_break_time = *section.break_slots.rbegin();

			int first_start = section.time_range[first_break_time].start;
			int last_end = section.time_range[last_break_time].end;

			if (last_end > max_time - late_not_allowed_break_duration_gap) {
				bee.section_violations[section_id].late_break += 10000;
			}

			if (first_start < early_not_allowed_break_duration_gap) {
				bee.section_violations[section_id].early_break += 10000;
			}

			// print("DD", section_id, last_end - first_start);

			if (last_end - first_start <= early_not_allowed_break_duration_gap) {
				bee.section_violations[section_id].small_break_gap += 10000;
			}
		}

		bee.total_cost += bee.section_violations[section_id].early_break;
		bee.total_cost += bee.section_violations[section_id].small_break_gap;
		bee.total_cost += bee.section_violations[section_id].late_break;

		{
			// bool has_teacher_with_conflicts = false;

			// auto& section_subjects = bee.timetable.school_classes[section_id];

			// for (const auto& [timeslot, days] : section_subjects) {
			// 	// std::cout << "  Class ID: " << class_id << std::endl;

			// 	for (const auto& [day, school_class] : days) {
			// 		// std::cout << "    Timeslot ID: " << timeslot_id << std::endl;
			// 		// std::cout << "      SchoolClass ID: " << school_class.subject_id << std::endl;
			// 		// std::cout << "      SchoolClass Name: " << school_class.teacher_id << std::endl;

			// 		int16_t teacher_id = school_class.teacher_id;

			// 		if (bee.teacher_violations[teacher_id].class_timeslot_overlap > 0 ||
			// 		    bee.teacher_violations[teacher_id].no_break > 0 ||
			// 		    bee.teacher_violations[teacher_id].exceed_workload > 0 ||
			// 		    bee.teacher_violations[teacher_id].class_gap > 0) {
			// 			has_teacher_with_conflicts = true;
			// 			break;
			// 		}
			// 	}
			// }

			// if (bee.section_violations[section_id].early_break == 0 &&
			//     bee.section_violations[section_id].small_break_gap == 0 &&
			//     bee.section_violations[section_id].late_break == 0 &&
			//     has_teacher_with_conflicts == false) {
			// 	bee.timetable.sections_with_conflicts.erase(static_cast<int16_t>(section_id));
			// } else {
			// 	bee.timetable.sections_with_conflicts.insert(static_cast<int16_t>(section_id));
			// }

			// print("fdf 1", bee.section_violations[section_id].early_break);
			// print("fdf 2", bee.section_violations[section_id].small_break_gap);
			// print("fdf 3", bee.section_violations[section_id].late_break);
		}

		bool has_teacher_with_conflicts = false;

		for (const int16_t& teacher : section.utilized_teachers) {
			if (bee.timetable.teachers_with_conflicts.find(teacher) != bee.timetable.teachers_with_conflicts.end()) {
				has_teacher_with_conflicts = true;
				break;
			}
		}

		if (bee.section_violations[section_id].early_break == 0 &&
		    bee.section_violations[section_id].small_break_gap == 0 &&
		    bee.section_violations[section_id].late_break == 0 &&
		    has_teacher_with_conflicts == false) {
			// print(GREEN_B, "erasing ", bee.timetable.sections_with_conflicts.size(), section_id);
			// print(GREEN_B, bee.timetable.sections_with_conflicts.size());
			bee.timetable.sections_with_conflicts.erase(static_cast<int16_t>(section_id));
		} else {
			// print("inserting ", bee.timetable.sections_with_conflicts.size(), section_id);
			bee.timetable.sections_with_conflicts.insert(static_cast<int16_t>(section_id));
			// print(bee.timetable.sections_with_conflicts.size());
		}
	}
};

void ObjectiveFunction::logConflicts(
    Bee& bee,
    std::ofstream& log_file) {
	auto& teachers_timetable = bee.timetable.teachers;

	teacherViolation overall_total_teacher_violation = {0, 0, 0, 0};
	sectionViolation overall_total_section_violation = {0, 0, 0};

	std::map<int16_t, teacherViolation> teachers_total_violation;
	std::map<int16_t, sectionViolation> sections_total_violation;

	for (const int16_t& teacher_id_16 : bee.timetable.s_teachers_set) {
		const int teacher_id = static_cast<int>(teacher_id_16);

		// auto it = teachers_timetable.find(teacher_id);

		// if (it == teachers_timetable.end()) {
		// 	continue;
		// }

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
		const auto& class_count = teachers_timetable.at(teacher_id).class_count;

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

		for (const auto& [day, timeslot] : teacher_id_and_days) {
			if (class_count.at(day) > max_teacher_work_load) {
				overall_total_teacher_violation.exceed_workload++;
				teachers_total_violation[teacher_id].exceed_workload++;
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

			// float min_allowance = middle - bee.timetable.s_default_class_duration;
			// float max_allowance = middle + bee.timetable.s_default_class_duration;

			float min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			float max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);

			int rounded_min_allowance = static_cast<int>(std::floor(min_allowance));
			int rounded_max_allowance = static_cast<int>(std::ceil(max_allowance));

			// int gap = 0;
			bool break_found = false;

			while (it != timeslot.end()) {
				int timeslot_key = it->first;
				int class_count = it->second;

				if (nextIt != timeslot.end()) {
					int nextKey = nextIt->first;
					int difference = nextKey - timeslot_key - 1;
					// gap += difference;
					if ((difference >= break_time_duration) && !break_found) {
						if ((rounded_min_allowance <= timeslot_key + 1 && timeslot_key + 1 <= rounded_max_allowance) ||
						    (rounded_min_allowance <= nextKey - 1 && nextKey - 1 <= rounded_max_allowance)) {
							break_found = true;
						}
					}
				}

				if (class_count > 1) {
					overall_total_teacher_violation.class_timeslot_overlap += class_count;

					print("class_count", class_count);
					teachers_total_violation[teacher_id]
					    .class_timeslot_overlap += class_count;
				}

				it = nextIt;
				if (nextIt != timeslot.end()) {
					++nextIt;
				}
			}

			// if (gap - break_time_duration > 1) {
			// 	total_teacher_violation.class_gap += gap - break_time_duration;
			// }

			if (!break_found && class_count.at(day) >= bee.timetable.s_teacher_break_threshold) {
				overall_total_teacher_violation.no_break++;
				teachers_total_violation[teacher_id].no_break++;
			}
		}
	}

	// auto& sections_timetable = bee.timetable.school_classes;
	// auto& section_class_start_end = bee.timetable.section_time_range;
	// auto& section_break_time = bee.timetable.section_break_slots;

	for (const int16_t& section_id_16 : bee.timetable.s_sections_set) {
		const int section_id = static_cast<int>(section_id_16);

		auto& section = bee.timetable.sections[section_id];

		int early_not_allowed_break_duration_gap = Timetable::s_section_not_allowed_breakslot_gap[section_id] * Timetable::s_default_class_duration;
		int late_not_allowed_break_duration_gap = (Timetable::s_section_not_allowed_breakslot_gap[section_id] + 1) * Timetable::s_default_class_duration;

		int max_time = Timetable::s_section_start[section_id] + Timetable::s_section_total_duration[section_id];

		// int early_not_allowed_break_duration_gap = bee.timetable.Timetable::s_section_not_allowed_breakslot_gap[section_id] * Timetable::s_default_class_duration;
		// int late_not_allowed_break_duration_gap = (bee.timetable.Timetable::s_section_not_allowed_breakslot_gap[section_id] + 1) * Timetable::s_default_class_duration;

		if (section.break_slots.size() == 1) {
			int break_time = *section.break_slots.begin();

			if (section.time_range[break_time].end > max_time - late_not_allowed_break_duration_gap) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (section.time_range[break_time].start < early_not_allowed_break_duration_gap) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}
		} else {
			int first_break_time = *section.break_slots.begin();
			int last_break_time = *section.break_slots.rbegin();

			int first_start = section.time_range[first_break_time].start;
			int last_end = section.time_range[last_break_time].end;

			if (last_end > max_time - late_not_allowed_break_duration_gap) {
				overall_total_section_violation.late_break++;
				sections_total_violation[section_id].late_break++;
			}

			if (first_start < early_not_allowed_break_duration_gap) {
				overall_total_section_violation.early_break++;
				sections_total_violation[section_id].early_break++;
			}

			if (last_end - first_start <= early_not_allowed_break_duration_gap) {
				overall_total_section_violation.small_break_gap++;
				sections_total_violation[section_id].small_break_gap++;
			}
		}
	}

	log_file << "- + - + - + - + - TOTAL COST: Conflicts: - + - + - + - + - +" << std::endl;
	log_file << "Teacher: " << std::endl;
	log_file << "class timeslot overlap: " << overall_total_teacher_violation.class_timeslot_overlap << std::endl;
	log_file << "no break: " << overall_total_teacher_violation.no_break << std::endl;
	log_file << "exceed workload: " << overall_total_teacher_violation.exceed_workload << std::endl;
	log_file << "class gap: " << overall_total_teacher_violation.class_gap << std::endl;
	log_file << std::endl;

	log_file << "Section: " << std::endl;
	log_file << "late break: " << overall_total_section_violation.late_break << std::endl;
	log_file << "early break: " << overall_total_section_violation.early_break << std::endl;
	log_file << "small break gap: " << overall_total_section_violation.small_break_gap << std::endl;
	log_file << "- + - + - + - + - + - + - + - + - + - + - + - + - + - + - + - +" << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	// log_file << "............................teachers total class:....................." << std::endl;

	// std::vector<int16_t> days;
	// for (const auto& [day, _] : bee.timetable.teachers_class_count) {
	// 	days.push_back(day);
	// }

	// // Output column headers (the days)
	// log_file << std::setw(6) << "id";
	// for (const auto& day : days) {
	// 	log_file << std::setw(6) << "d " + std::to_string(day);
	// }
	// log_file << std::endl;

	// // Find the maximum number of teachers to iterate over.
	// // int max_teacher_count = 0;
	// // for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
	// // 	if (teacher.size() > max_teacher_count) {
	// // 		max_teacher_count = teacher.size();
	// // 	}
	// // }
	// int max_teacher_count = 0;
	// for (const auto& [_, teacher] : bee.timetable.teachers_class_count) {
	// 	if (static_cast<int>(teacher.size()) > max_teacher_count) {
	// 		max_teacher_count = static_cast<int>(teacher.size());
	// 	}
	// }

	// // Output each teacher and their class count for each day.
	// for (int teacher_id = 0; teacher_id < max_teacher_count; ++teacher_id) {
	// 	log_file << std::endl;
	// 	log_file << std::setw(6) << teacher_id;  // Print teacher ID in the first column.

	// 	bool is_consistent = true;
	// 	int first_day_count = -1;  // Initialize to an invalid value for comparison.

	// 	// For each day, print the corresponding class count for this teacher.
	// 	for (const auto& day : days) {
	// 		const auto& teachers = bee.timetable.teachers_class_count.at(day);

	// 		if (teacher_id < static_cast<int>(teachers.size())) {
	// 			int current_count = teachers[teacher_id];

	// 			// Check if this is the first valid count we're seeing for this teacher.
	// 			if (first_day_count == -1) {
	// 				first_day_count = current_count;  // Set first day's class count.
	// 			} else if (current_count != first_day_count) {
	// 				is_consistent = false;  // Inconsistent if current count doesn't match the first day.
	// 			}

	// 			log_file << std::setw(6) << current_count;
	// 		} else {
	// 			log_file << std::setw(6) << "-";  // Print a dash if no teacher exists for this day.
	// 		}
	// 	}

	// 	log_file << std::setw(6) << " | " << (is_consistent ? "Consistent" : "not consistent") << std::endl;
	// 	log_file << std::endl;
	// }

	// log_file << "......................................................................" << std::endl;

	log_file << "/ / / / / / / teachers that have violations: / / / / / / / " << std::endl;

	for (const auto& [teacher_id, teacher_violation] : teachers_total_violation) {
		log_file << "Teacher: " << teacher_id << std::endl;

		if (teacher_violation.class_timeslot_overlap > 0) {
			log_file << "." << std::setw(4) << " class timeslot overlap: " << teacher_violation.class_timeslot_overlap << std::endl;
		}

		if (teacher_violation.no_break > 0) {
			log_file << "." << std::setw(4) << " no break: " << teacher_violation.no_break << std::endl;
		}

		if (teacher_violation.exceed_workload > 0) {
			log_file << "." << std::setw(4) << " exceed workload: " << teacher_violation.exceed_workload << std::endl;
		}
	}

	log_file << "/ / / / / / / / / / / / / / / / / / / / / / / / / / / / / " << std::endl;

	log_file << "\n\n\n\n\n\n\n";

	log_file << "/ / / / / / / sections that have violations: / / / / / / / " << std::endl;

	for (const auto& [section_id, section_violation] : sections_total_violation) {
		log_file << "Section: " << section_id << std::endl;

		if (section_violation.late_break > 0) {
			log_file << "." << std::setw(4) << " late break: " << section_violation.late_break << std::endl;
		}

		if (section_violation.early_break > 0) {
			log_file << "." << std::setw(4) << " early break: " << section_violation.early_break << std::endl;
		}

		if (section_violation.small_break_gap > 0) {
			log_file << "." << std::setw(4) << " small break gap: " << section_violation.small_break_gap << std::endl;
		}
	}

	log_file << "/ / / / / / / / / / / / / / / / / / / / / / / / / / / / / " << std::endl;

	log_file << "\n\n\n\n\n\n\n";
};

void getViolation(
    Bee& bee, int64_t* result_violation) {
	auto& teachers_timetable = bee.timetable.teachers;

	std::unordered_map<int, std::unordered_map<int16_t, int>> teacher_violations;
	std::unordered_map<int, std::unordered_map<int16_t, int>> section_violations;

	for (const int16_t& teacher_id_16 : bee.timetable.s_teachers_set) {
		const int teacher_id = static_cast<int>(teacher_id_16);

		// auto it = teachers_timetable.find(teacher_id);

		// if (it == teachers_timetable.end()) {
		// 	continue;
		// }

		const auto& teacher_id_and_days = teachers_timetable.at(teacher_id).utilized_time;
		const auto& class_count = teachers_timetable.at(teacher_id).class_count;

		const int max_teacher_work_load = bee.timetable.s_max_teacher_work_load;
		const int break_time_duration = bee.timetable.s_break_time_duration;

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

			//     float min_allowance = middle - bee.timetable.s_default_class_duration;
			// float max_allowance = middle + bee.timetable.s_default_class_duration;

			float min_allowance = middle - (bee.timetable.s_default_class_duration * allowance_multiplier);
			float max_allowance = middle + (bee.timetable.s_default_class_duration * allowance_multiplier);

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

			if (!break_found && class_count.at(day) >= bee.timetable.s_teacher_break_threshold) {
				teacher_violations[NO_BREAK_INT][teacher_id]++;
			}
		}
	}

	// auto& section_class_start_end = bee.timetable.section_time_range;
	// auto& section_break_time = bee.timetable.section_break_slots;

	for (const int16_t& section_id_16 : bee.timetable.s_sections_set) {
		const int section_id = static_cast<int>(section_id_16);

		// if (bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.find(section_id) != bee.timetable.Timetable::s_section_dynamic_subject_consistent_duration.end()) {
		// 	// print("ppp");
		// 	continue;
		// } else {
		// 	// print("hehe");
		// }

		auto& section = bee.timetable.sections[section_id];

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

void getResult(Bee& bee, int64_t* result, int64_t* result_2, int offset_duration) {
	print("Getting result...");

	int iter = 0;
	for (const auto& [section_id, section] : bee.timetable.sections) {
		int offset = bee.timetable.s_section_start[section_id];
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
				// std::cout << "packed : " << packed << std::endl;

				int start = section.time_range.at(timeslot).start + offset_duration * timeslot;
				int end = section.time_range.at(timeslot).end + offset_duration * (timeslot + 1);

				start += offset;
				end += offset;

				// print("x", start, end);

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

extern "C" {

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,

    int32_t* section_subjects,
    int32_t* section_subject_duration,
    int32_t* section_subject_order,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* section_subject_units,

    int teacher_subjects_length,
    int bees_population,
    int bees_employed,
    int bees_onlooker,
    int bees_scout,
    int limit,
    int work_week,

    int max_teacher_work_load,
    int break_time_duration,
    int break_timeslot_allowance,
    int teacher_break_threshold,
    int min_total_class_duration_for_two_breaks,
    int default_class_duration,
    int result_buff_length,
    int offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging) {
	Timetable::reset();
	print(CYAN, "RESETT", RESET);

	std::unordered_map<int16_t, Section> sections;
	std::unordered_map<int16_t, Teacher> teachers;

	{
		std::unordered_map<int, int> section_num_of_class_block;

		Timetable::s_break_timeslot_allowance = break_timeslot_allowance;
		Timetable::s_teacher_break_threshold = teacher_break_threshold;
		Timetable::s_default_class_duration = default_class_duration;
		Timetable::s_max_teacher_work_load = max_teacher_work_load;
		Timetable::s_break_time_duration = break_time_duration;
		Timetable::s_work_week = work_week;

		Timetable::s_section_num_breaks.resize(total_section);
		Timetable::initializeSectionsSet(total_section);
		Timetable::initializeTeacherSet(num_teachers);

		sections.reserve(total_section);
		teachers.reserve(num_teachers);

		for (int i = 0; i < total_section; i++) {
			Timetable::s_section_start[i] = section_start[i];
			sections[i].id = i;
		}

		for (int i = 0; i < num_teachers; i++) {
			teachers[i].id = i;
			teachers[i].initializeClass(work_week);
		}

		for (int i = 0; i < teacher_subjects_length; i++) {
			if (teacher_subjects[i] == -1) continue;

			int16_t teacher, subject;
			teacher = static_cast<int16_t>(teacher_subjects[i] >> 16);
			subject = static_cast<int16_t>(teacher_subjects[i] & 0xFFFF);
			Timetable::s_eligible_teachers_in_subject[subject].push_back(teacher);
		}

		// std::cout << "section_subjects_map" << std::endl;
		for (int i = 0; i < total_section_subjects; i++) {
			int16_t unpacked_first_section_subjects, unpacked_second_section_subjects;
			int16_t unpacked_first_section_subjects_units, unpacked_second_section_subjects_units;
			int16_t unpacked_first_section_subjects_duration, unpacked_second_section_subjects_duration;
			int16_t unpacked_first_section_subjects_order, unpacked_second_section_subjects_order;

			unpacked_first_section_subjects = static_cast<int16_t>(section_subjects[i] >> 16);
			unpacked_second_section_subjects = static_cast<int16_t>(section_subjects[i] & 0xFFFF);

			unpacked_first_section_subjects_units = static_cast<int16_t>(section_subject_units[i] >> 16);
			unpacked_second_section_subjects_units = static_cast<int16_t>(section_subject_units[i] & 0xFFFF);

			unpacked_first_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] >> 16);
			unpacked_second_section_subjects_duration = static_cast<int16_t>(section_subject_duration[i] & 0xFFFF);

			unpacked_first_section_subjects_order = static_cast<int16_t>(section_subject_order[i] >> 16);
			unpacked_second_section_subjects_order = static_cast<int16_t>(section_subject_order[i] & 0xFFFF);

			Timetable::s_section_subjects[unpacked_first_section_subjects].push_back(unpacked_second_section_subjects);

			// std::cout << "a : " << unpacked_first_section_subjects << " b : " << unpacked_second_section_subjects << std::endl;
			Timetable::s_section_subjects_units[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_units, unpacked_second_section_subjects_units));
			Timetable::s_section_subjects_duration[unpacked_first_section_subjects][unpacked_first_section_subjects_duration] = unpacked_second_section_subjects_duration;
			Timetable::s_section_subjects_order[unpacked_first_section_subjects][unpacked_first_section_subjects_order] = unpacked_second_section_subjects_order;

			// if (unpacked_first_section_subjects_order != 0) {
			// 	Timetable::s_section_fixed_subject[unpacked_first_section_subjects] = unpacked_first_section_subjects_order;
			// }

			section_num_of_class_block[unpacked_first_section_subjects] += unpacked_second_section_subjects_units == 0 ? work_week : unpacked_second_section_subjects_units;
		}

		for (int i = 0; i < total_section; i++) {
			auto& section_subjects_order = Timetable::s_section_subjects_order[i];

			bool is_consistent_duration = true;
			for (auto it = section_subjects_order.begin(); it != section_subjects_order.end(); it++) {
				if (it->second != 0) {
					continue;
				}

				print(RED, "section ", i, it->first, Timetable::s_section_subjects_duration[i][it->first], default_class_duration);

				if (Timetable::s_section_subjects_duration[i][it->first] != default_class_duration) {
					is_consistent_duration = false;
					break;
				}
			}

			if (is_consistent_duration) {
				Timetable::s_section_dynamic_subject_consistent_duration.insert(i);
			} else {
				print(RED, "section " + std::to_string(i) + " has inconsistent duration");
			}
		}

		// std::cout << "section_subjects_units_map" << std::endl;
		// for (auto it = sections.subjects_units.begin(); it != Timetable::s_section_subjects_units.end(); it++) {
		// std::cout << it->first << " g: ";
		// for (int i = 0; i < static_cast<int>(it->second.size()); i++) {
		// std::cout << it->second[i].first << " h: " << it->second[i].second << " ";
		// }

		// std::cout << std::endl;
		// }

		// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
		// 10-12 why?
		for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
			// std::cout << it->first << " " << it->second << std::endl;

			// std::cout << " xx x xxxxxxxxxxxf : " << (((it->second + work_week - 1) / work_week)) << std::endl;
			int timeslots = (((it->second + work_week - 1) / work_week));

			int section_total_duration = 0;

			for (auto it2 = Timetable::s_section_subjects_duration[it->first].begin(); it2 != Timetable::s_section_subjects_duration[it->first].end(); it2++) {
				section_total_duration += it2->second;
			}

			int num_breaks = section_total_duration <= min_total_class_duration_for_two_breaks ? 1 : 2;
			// std::cout << "ehhe " << section_total_duration << " " << timeslots << " " << num_breaks << " " << timeslots + num_breaks << std::endl;
			Timetable::s_section_timeslot[it->first] = timeslots + num_breaks;
			// below 10 - 1, 2 equal or above

			// sections[it->first].num_breaks = num_breaks;
			Timetable::s_section_num_breaks[it->first] = num_breaks;

			// s_section_not_allowed_breakslot_gap

			// int not_allowed_break_gap;
			int total_num_of_timeslot = timeslots + num_breaks;

			if (total_num_of_timeslot > 8) {
				// not_allowed_break_gap = 3;
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 3;
			} else if (total_num_of_timeslot > 6) {
				// not_allowed_break_gap = 2;
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 2;
			} else {
				// not_allowed_break_gap = 1;
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 1;
			}
		}
	}

	// return;

	// std::cout << "eligible_teachers_in_subject" << std::endl;
	// for (auto it = eligible_teachers_in_subject.begin(); it != eligible_teachers_in_subject.end(); it++) {
	// 	std::cout << it->first << " ";

	// 	for (int i = 0; i < it->second.size(); i++) {
	// 		std::cout << it->second[i] << " ";
	// 	}

	// 	std::cout << std::endl;
	// }

	// std::cout << "eligible_teachers_in_subject end" << std::endl;
	// std::cout << "ff : " << eligible_teachers_in_subject.size() - 1 << std::endl;

	Timetable::initializeRandomSectionDistribution(0, total_section - 1);
	Timetable::initializeRandomFieldDistribution(0, 2);
	Timetable::initializeRandomWorkDayDistribution(1, work_week);

	ObjectiveFunction evaluator;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");
	Bee best_solution(num_teachers, sections, teachers);

	std::unordered_set<int16_t> affected_teachers;
	std::unordered_set<int16_t> affected_sections;

	affected_teachers.reserve(num_teachers);
	affected_sections.reserve(total_section);

	best_solution.timetable.initializeRandomTimetable(affected_teachers);
	printSchoolClasses(best_solution.timetable);
	print(MAGENTA_B, " -- FIRSTTTTTTTTTTTTT -- ");
	evaluator.evaluate(best_solution, affected_teachers, Timetable::s_sections_set, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);

	{
		print("Configuration: ");
		print("max_iterations", max_iterations);
		print("num_teachers", num_teachers);
		print("total_section_subjects", total_section_subjects);
		print("total_section", total_section);
		print("teacher_subjects_length", teacher_subjects_length);
		print("bees_population", bees_population);
		print("bees_employed", bees_employed);
		print("bees_onlooker", bees_onlooker);
		print("bees_scout", bees_scout);
		print("limit", limit);
		print("work_week", work_week);
		print("max_teacher_work_load", max_teacher_work_load);
		print("break_time_duration", break_time_duration);
		print("break_timeslot_allowance", break_timeslot_allowance);
		print("teacher_break_threshold", teacher_break_threshold);
		print("min_total_class_duration_for_two_breaks", min_total_class_duration_for_two_breaks);
		print("default_class_duration", default_class_duration);
		print("result_buff_length", result_buff_length);
		print("offset_duration", offset_duration);
		print("enable_logging", enable_logging);
	}

	vector<Bee>
	    bees_vector(bees_population, Bee(num_teachers, sections, teachers));

	for (int i = 0; i < bees_population; i++) {
		affected_teachers.clear();

		bees_vector[i].timetable.initializeRandomTimetable(affected_teachers);

		evaluator.evaluate(bees_vector[i], affected_teachers, Timetable::s_sections_set, false, true);

		if (bees_vector[i].total_cost <= best_solution.total_cost) {
			best_solution = bees_vector[i];
		}
	}

	// return;

	vector<int> bees_abandoned(bees_population, 0);
	std::unordered_set<int> above_limit_abandoned_bees;
	std::uniform_int_distribution<>
	    dist_bees_employed(0, bees_employed - 1);

	int iteration_count = max_iterations;

	TimeManager tm;
	tm.startTimer();

	std::map<int, int> costs;

	print(YELLOW, "starting iteration");
	for (int iter = 0; iter < max_iterations; iter++) {
		// print("haha", iter);

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
			evaluator.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					above_limit_abandoned_bees.insert(i);
				}
			}

			total_cost += bees_vector[i].total_cost;
		}

		// double averageCost = (total_cost / bees_employed) + 1e-6;  // Add small constant to avoid division by zero
		double averageCost = (total_cost / bees_employed);
		if (averageCost < 1e-6) {
			averageCost = 1e-6;  // Ensure averageCost is never too small
		}

		// print("averageCost", averageCost);

		vector<double> fitness_values(bees_employed, 0);
		double fSum = 0;
		for (int i = 0; i < bees_employed; i++) {
			// print("bees_vector[i].total_cost", bees_vector[i].total_cost);
			// print("averageCost", averageCost);
			// print("bees_vector[i].total_cost / averageCost", bees_vector[i].total_cost / averageCost);
			fitness_values[i] = 1.0 / (1.0 + (bees_vector[i].total_cost / averageCost));
			// fitness_values[i] = exp(-(bees_vector[i].total_cost / averageCost));

			// Add a check to avoid overflow or other numerical issues
			if (std::isinf(fitness_values[i]) || std::isnan(fitness_values[i])) {
				print("Numerical issue with fitness value", i);
				exit(1);
			}

			// if (std::isinf(fitness_values[i])) {
			// 	print("x", std::isinf(fitness_values[i]));
			// 	exit(1);
			// }

			fSum += fitness_values[i];
		}

		if (fSum < 1e-6) {
			print("fSum too small, potential issue with cost values");
			exit(1);
		}

		// print("fSum", fSum);

		vector<double>
		    prob(bees_employed, 0);
		for (int i = 0; i < bees_employed; i++) {
			// print("fitness_values[i] / fSum", fitness_values[i] / fSum);
			prob[i] = fitness_values[i] / fSum;
		}

		auto fitness_proportionate_selection = [&](const vector<double>& prob) {
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
			evaluator.evaluate(new_bee, affected_teachers, affected_sections, false, false);

			if (new_bee.total_cost <= bees_vector[i].total_cost) {
				bees_vector[i] = new_bee;
			} else {
				bees_abandoned[i]++;

				if (bees_abandoned[i] >= limit) {
					print("abandoning bee", i);
					above_limit_abandoned_bees.insert(i);
				}
			}
		}

		for (int itScout = 0; itScout < bees_scout; itScout++) {
			for (auto it = above_limit_abandoned_bees.begin(); it != above_limit_abandoned_bees.end();) {
				Bee new_bee(num_teachers, sections, teachers);
				affected_teachers.clear();
				new_bee.timetable.initializeRandomTimetable(affected_teachers);
				bees_vector[*it] = new_bee;
				evaluator.evaluate(bees_vector[*it], affected_teachers, Timetable::s_sections_set, false, true);
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

	tm.stopTimer();

	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);

	printSchoolClasses(best_solution.timetable);

	if (enable_logging) {
		std::string name_file = std::string(LOG_FOLDER) + "c" + tm.getStartDate() + "-" + tm.getStartTime() + "---" +
		                        std::to_string(num_teachers) + "_" + std::to_string(total_section) + "_" + std::to_string(best_solution.total_cost) + "---" + "timetable.txt";
		std::ofstream txt_file(name_file);
		txt_file << "----------------------------------------------------------------------" << std::endl;
		txt_file << "Best solution: " << std::endl;
		txt_file << "Total cost: " << best_solution.total_cost << std::endl;
		txt_file << "Total process duration: " << tm.getTimelapse() << std::endl;
		txt_file << "Iteration count: " << iteration_count << std::endl;
		txt_file << "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -" << max_iterations << std::endl;
		txt_file << "max_iterations: " << max_iterations << std::endl;
		txt_file << "num_teachers: " << num_teachers << std::endl;
		txt_file << "total_section_subjects: " << total_section_subjects << std::endl;
		txt_file << "total_section: " << total_section << std::endl;
		txt_file << "teacher_subjects_length: " << teacher_subjects_length << std::endl;
		txt_file << "bees_population: " << bees_population << std::endl;
		txt_file << "bees_employed: " << bees_employed << std::endl;
		txt_file << "bees_onlooker: " << bees_onlooker << std::endl;
		txt_file << "bees_scout: " << bees_scout << std::endl;
		txt_file << "limit: " << limit << std::endl;
		txt_file << "work_week: " << work_week << std::endl;
		txt_file << "max_teacher_work_load: " << max_teacher_work_load << std::endl;
		txt_file << "break_time_duration: " << break_time_duration << std::endl;
		txt_file << "break_timeslot_allowance: " << break_timeslot_allowance << std::endl;
		txt_file << "teacher_break_threshold: " << teacher_break_threshold << std::endl;
		txt_file << "min_total_class_duration_for_two_breaks: " << min_total_class_duration_for_two_breaks << std::endl;
		txt_file << "default_class_duration: " << default_class_duration << std::endl;
		txt_file << "result_buff_length: " << result_buff_length << std::endl;
		txt_file << "offset_duration: " << offset_duration << std::endl;
		txt_file << "enable_logging: " << enable_logging << std::endl;

		txt_file << "Date: " << tm.getStartDate() << std::endl;
		txt_file << "Time: " << tm.getStartTime() << std::endl;
		txt_file << "----------------------------------------------------------------------" << std::endl;

		logCosts(costs, txt_file);

		evaluator.logConflicts(best_solution, txt_file);

		logSchoolClasses(best_solution.timetable, txt_file);

		print("----------------------------");
		print("result log file: ", name_file);
		print("----------------------------");

		txt_file.close();
	}

	evaluator.evaluate(best_solution, Timetable::s_teachers_set, Timetable::s_sections_set, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(iteration_count == max_iterations ? RED_BG : CYAN_BG, BOLD, iteration_count == max_iterations ? "MAXIMUM ITERATIONS REACHED" : "EARLY BREAK Best solution: cost ", best_solution.total_cost, " at ", iteration_count, RESET);

	print("Time taken: ", tm.getTimelapse());

	getResult(best_solution, result_timetable, result_timetable_2, offset_duration);
	getViolation(best_solution, result_violation);

	return;
}
}
