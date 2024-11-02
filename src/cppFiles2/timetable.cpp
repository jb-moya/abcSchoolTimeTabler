#include "abc.h"
#include "log.h"
#include "print.h"
#include "random_util.h"
#include "rotaryTimeslot.h"
#include "timeManager.h"

using namespace std;

#define LOG_FOLDER "logs2/"

std::unordered_map<int16_t, std::vector<std::pair<int16_t, int16_t>>> Timetable::s_section_subjects_units;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_duration;
std::unordered_map<int16_t, std::unordered_map<int16_t, int16_t>> Timetable::s_section_subjects_order;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_eligible_teachers_in_subject;
std::unordered_set<int16_t> Timetable::s_section_dynamic_subject_consistent_duration;
std::unordered_map<int16_t, std::vector<int16_t>> Timetable::s_section_subjects;
std::unordered_map<int16_t, int> Timetable::s_section_not_allowed_breakslot_gap;
std::unordered_map<int16_t, int> Timetable::s_section_total_duration;
std::unordered_map<int16_t, int> Timetable::s_section_total_timeslot;
std::unordered_map<int16_t, int> Timetable::s_section_start;
std::unordered_set<int16_t> Timetable::s_teachers_set;
std::unordered_set<int16_t> Timetable::s_sections_set;
std::vector<int> Timetable::s_section_num_breaks;

RotaryTimeslot Timetable::s_rotary_timeslot;
SubjectTeacherQueue Timetable::s_subject_teacher_queue;
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
	s_section_total_timeslot.clear();
	s_section_start.clear();
	s_teachers_set.clear();
	s_sections_set.clear();

	s_break_time_duration = 0;
	s_work_week = 0;

	initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

void Teacher::initializeClass(int work_week) {
	for (int day = 1; day <= work_week; ++day) {
		class_count[day] = 0;
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
				auto& utilized_time = teachers[teacher].utilized_time;

				if (is_returning_teachers) {
					update_teachers.insert(static_cast<int16_t>(teacher));
				}

				for (int i = 1; i <= Timetable::s_work_week; ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							if (--utilized_time[i][j + start] <= 0) {
								utilized_time[i].erase(j + start);

								if (utilized_time[i].empty()) {
									utilized_time.erase(i);
								}
							};
						} else {
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
						if (--utilized_time[day.first][start + j] <= 0) {
							// can i use: std::optional<T>::swap on this.

							utilized_time[day.first].erase(start + j);

							if (utilized_time[day.first].empty()) {
								utilized_time.erase(day.first);
							}
						}
					} else {
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

std::vector<std::vector<int>> getAllBreaksCombination(int slot_count, int break_count, int gap, int end_gap) {
	std::set<int> breaks;
	std::set<int> possible_breaks;

	for (int i = gap; i < slot_count - end_gap; ++i) {
		possible_breaks.insert(i);
	}

	if (break_count == 1) {
		std::vector<std::vector<int>> combinations;

		for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
			combinations.push_back({*it});
		}

		return combinations;
	}

	std::vector<std::vector<int>> combinations;

	for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
		int first = *it;

		for (auto it2 = it; it2 != possible_breaks.end(); ++it2) {
			if (std::abs(first + 1 - *it2) >= gap) {
				combinations.push_back({first, *it2});
			}
		}
	}

	return combinations;
}

std::vector<int> getDefaultBreaksCombination(std::vector<std::vector<int>>& breaks_combination) {
	return breaks_combination[breaks_combination.size() / 2];
}

int16_t Timetable::getRandomTeacher(int16_t subject_id) {
	std::uniform_int_distribution<> dis(0, Timetable::s_eligible_teachers_in_subject[subject_id].size() - 1);
	return Timetable::s_eligible_teachers_in_subject[subject_id][dis(randomizer_engine)];
}

void Timetable::setClasstimeslot(Section& section) {
	int class_start = Timetable::s_section_start[section.id];

	for (const auto& [timeslot, day_school_class] : section.classes) {
		if (day_school_class.count(0)) {
			const SchoolClass& schoolClass = day_school_class.at(0);
			int16_t subject_id = schoolClass.subject_id;

			int duration = (subject_id == -1) ? Timetable::s_break_time_duration : Timetable::s_section_subjects_duration[section.id][subject_id];

			section.time_range[timeslot] = ClassStartEnd{class_start, class_start + duration};
			class_start += duration;

		} else {
			int max_duration = 0;

			for (int i = 1; i <= s_work_week; ++i) {
				if (day_school_class.count(i)) {
					int subject_id = day_school_class.at(i).subject_id;

					if (Timetable::s_section_subjects_duration[section.id][subject_id] > max_duration) {
						max_duration = Timetable::s_section_subjects_duration[section.id][subject_id];
					}
				}
			}

			section.time_range[timeslot] = ClassStartEnd{class_start, class_start + max_duration};

			class_start += max_duration;
		}
	}

	Timetable::s_section_total_duration[section.id] = class_start - Timetable::s_section_start[section.id];
}

void Timetable::initializeRandomTimetable(std::unordered_set<int16_t>& update_teachers) {
	if (sections.size() == 0) {
		print("no sections");
		exit(1);
	}

	for (auto& [section_id, section] : sections) {
		std::vector<int16_t> random_subjects = s_section_subjects[section_id];

		auto& classes = section.classes;

		int num_breaks = s_section_num_breaks[section_id];
		int gap = s_section_not_allowed_breakslot_gap[section_id];
		int total_timeslot = s_section_total_timeslot[section_id];

		std::vector<std::vector<int>> possible_breaks = getAllBreaksCombination(
		    total_timeslot,
		    num_breaks,
		    gap,
		    num_breaks == 1 ? gap + 1 : gap);

		std::vector<int> breaks = possible_breaks[section_id % possible_breaks.size()];

		for (int break_slot : breaks) {
			classes[break_slot][0] = SchoolClass{-1, -1};
			section.break_slots.insert(break_slot);
		}

		s_rotary_timeslot.adjustPosition(total_timeslot);
		std::vector<int> timeslot = s_rotary_timeslot.getTimeslot(total_timeslot, breaks);
		s_rotary_timeslot.incrementShift();

		std::deque<int>
		    timeslot_keys(timeslot.begin(), timeslot.end());
		std::map<int, int>
		    timeslots;

		for (size_t i = 0; i < timeslot_keys.size(); ++i) {
			timeslots[timeslot_keys[i]] = Timetable::s_work_week;
		}

		std::vector<int16_t> full_week_day_subjects;
		std::vector<int16_t> special_unit_subjects;

		std::map<int, int> fixed_subject_order;
		std::set<int> non_dynamic_order_start;
		std::set<int> non_dynamic_order_end;
		std::set<int> reserved_timeslots;

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

		auto timeslot_it = timeslot_keys.begin();
		for (auto itr : non_dynamic_order_start) {
			fixed_subject_order[itr] = *timeslot_it;
			reserved_timeslots.insert(*timeslot_it);

			++timeslot_it;
		}

		auto timeslot_it_reverse = timeslot_keys.rbegin();
		for (auto itr = non_dynamic_order_end.rbegin(); itr != non_dynamic_order_end.rend(); ++itr) {
			fixed_subject_order[*itr] = *timeslot_it_reverse;
			reserved_timeslots.insert(*timeslot_it_reverse);

			++timeslot_it_reverse;
		}

		for (const auto timeslot : reserved_timeslots) {
			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot), timeslot_keys.end());
			timeslots.erase(timeslot);
		}

		for (const auto& subject_id : full_week_day_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			int subject_duration = Timetable::s_section_subjects_duration[section_id][subject_id] * Timetable::s_work_week;
			int queued_teacher = Timetable::s_subject_teacher_queue.getTeacher(subject_id, subject_duration);
			// int16_t selected_teacher = queued_teacher != -1 ? queued_teacher : getRandomTeacher(subject_id);
			int16_t selected_teacher = getRandomTeacher(subject_id);

			section.utilized_teachers.insert(selected_teacher);

			for (int day = 1; day <= s_work_week; ++day) {
				teachers[selected_teacher].class_count[day]++;
			}

			if (order == 0) {
				int timeslot_key = timeslot_keys.front();

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				classes[timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				timeslots.erase(timeslot_key);
			} else {
				int timeslot_key = fixed_subject_order[order];

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
				classes[timeslot_key][0] = SchoolClass{subject_id, selected_teacher};

				section.fixed_timeslot_day[timeslot_key].insert(0);

				timeslots.erase(timeslot_key);
			}
		}

		int day = 1;
		for (const auto& subject_id : special_unit_subjects) {
			int order = Timetable::s_section_subjects_order[section_id][subject_id];

			int16_t num_unit = units_map.at(subject_id).second;

			int16_t selected_teacher = getRandomTeacher(subject_id);
			teachers[selected_teacher].class_count[day]++;

			section.utilized_teachers.insert(selected_teacher);

			for (int iter = 1; iter <= num_unit; ++iter) {
				if (order == 0) {
					auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
					                       [&timeslots](int key) { return timeslots[key] > 0; });

					if (it == timeslot_keys.end()) {
						print("no more timeslots");
						break;
					}

					int timeslot = *it;

					classes[timeslot][day] = SchoolClass{subject_id, selected_teacher};
					section.segmented_timeslot.insert(timeslot);

					if (--timeslots[timeslot] == 0) {
						timeslot_keys.erase(it);
						timeslots.erase(timeslot);
					}
				} else {
					int timeslot_key = fixed_subject_order[order];

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

		setClasstimeslot(section);
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

	int timeslots = s_section_total_timeslot[selected_section];
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
			selected_timeslot_1 = getRandomInRange(s_section_total_timeslot[selected_section] - 1);
			selected_timeslot_2 = getRandomInRange(s_section_total_timeslot[selected_section] - 1);

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == s_section_total_timeslot[selected_section] - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == s_section_total_timeslot[selected_section] - 1;

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
	}

	return {selected_timeslot_1, selected_timeslot_2};
}

int16_t Timetable::pickRandomSection() {
	// return Timetable::s_random_section(randomizer_engine);

	if (sections_with_conflicts.empty()) {
		return Timetable::s_random_section(randomizer_engine);
	} else {
		std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

		int random_index = dis(randomizer_engine);

		auto it = sections_with_conflicts.begin();
		std::advance(it, random_index);

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

	// TODO: select timeslot first then choice base on section and selected timeslot

	int16_t selected_section = Timetable::pickRandomSection();
	int16_t choice = Timetable::pickRandomField(selected_section);

	if (choice == 0) {
		update_sections.insert(selected_section);
	}

	choice = 1;

	auto selected_timeslots = pickRandomTimeslots(selected_section, choice);

	int selected_timeslot_1 = selected_timeslots.first;
	int selected_timeslot_2 = selected_timeslots.second;

	// print("selected_timeslot_1", selected_timeslot_1, "selected_timeslot_2", selected_timeslot_2);

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

				section_timeslot[0] = SchoolClass{subject_id, random_teacher};
			};
		} else {
			// TODO: same teacher on same subject DONE
			// TODO: CHECK IF THIS iS WORKING
			std::uniform_int_distribution<> dis_work_day(0, section_timeslot.size() - 1);

			int randomIndex = dis_work_day(randomizer_engine);

			auto it = section_timeslot.begin();
			std::advance(it, randomIndex);

			int16_t selected_timeslot_subject_id = section_timeslot[it->first].subject_id;
			int16_t old_teacher = section_timeslot[it->first].teacher_id;

			std::uniform_int_distribution<> dis(0, s_eligible_teachers_in_subject[selected_timeslot_subject_id].size() - 1);
			int16_t random_teacher;

			do {
				random_teacher = s_eligible_teachers_in_subject[selected_timeslot_subject_id][dis(randomizer_engine)];
			} while (random_teacher == old_teacher && s_eligible_teachers_in_subject[selected_timeslot_subject_id].size() > 1);

			for (auto it = section_timeslot.begin(); it != section_timeslot.end(); it++) {
				int16_t subject_id = section_timeslot[it->first].subject_id;

				if (subject_id == selected_timeslot_subject_id) {
					section_timeslot[it->first] = SchoolClass{subject_id, random_teacher};
				}
			}

			// FIXME: only date that are affected
			for (int day = 1; day <= s_work_week; day++) {
				teachers[old_teacher].class_count[day]--;
				teachers[random_teacher].class_count[day]++;
			}

			// std::cout << subject_id << " old teacher : " << old_teacher << " <- workday : " << _staticcast<int>(workday) << " Randomized: " << random_section << " " << random_timeslot << " " << random_teacher << std::endl;
			section_timeslot[it->first] = SchoolClass{selected_timeslot_subject_id, random_teacher};
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

			Timetable::s_subject_teacher_queue.addTeacher(subject, teacher, 90);
		}

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

			Timetable::s_section_subjects_units[unpacked_first_section_subjects].push_back(std::make_pair(unpacked_first_section_subjects_units, unpacked_second_section_subjects_units));
			Timetable::s_section_subjects_duration[unpacked_first_section_subjects][unpacked_first_section_subjects_duration] = unpacked_second_section_subjects_duration;
			Timetable::s_section_subjects_order[unpacked_first_section_subjects][unpacked_first_section_subjects_order] = unpacked_second_section_subjects_order;

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

		// FUTURE FEAUTRE: THIS CAN BE TURNED ON/OFF
		// 10-12 why?
		for (auto it = section_num_of_class_block.begin(); it != section_num_of_class_block.end(); it++) {
			int timeslots = (((it->second + work_week - 1) / work_week));

			int section_total_duration = 0;

			for (auto it2 = Timetable::s_section_subjects_duration[it->first].begin(); it2 != Timetable::s_section_subjects_duration[it->first].end(); it2++) {
				section_total_duration += it2->second + offset_duration;
			}

			int num_breaks = section_total_duration <= min_total_class_duration_for_two_breaks ? 1 : 2;
			std::cout << "ehhe " << section_total_duration << " ff " << min_total_class_duration_for_two_breaks << " " << timeslots << " " << num_breaks << " " << timeslots + num_breaks << std::endl;
			Timetable::s_section_total_timeslot[it->first] = timeslots + num_breaks;
			// below 10 - 1, 2 equal or above

			Timetable::s_section_num_breaks[it->first] = num_breaks;

			int total_num_of_timeslot = timeslots + num_breaks;

			if (total_num_of_timeslot > 8) {
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 3;
			} else if (total_num_of_timeslot > 6) {
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 2;
			} else {
				Timetable::s_section_not_allowed_breakslot_gap[it->first] = 1;
			}
		}
	}

	Timetable::initializeRandomSectionDistribution(0, total_section - 1);
	Timetable::initializeRandomFieldDistribution(0, 2);
	Timetable::initializeRandomWorkDayDistribution(1, work_week);

	ObjectiveFunction evaluator;

	print("For function abcTestMine:", max_iterations, "iterations for each experiment.");

	Bee best_solution(num_teachers, total_section, sections, teachers);

	ABC abc(
	    total_section,
	    num_teachers,
	    max_iterations,
	    bees_population,
	    bees_employed,
	    bees_onlooker,
	    bees_scout,
	    limit,
	    best_solution,
	    sections,
	    teachers);

	Timetable::s_rotary_timeslot = RotaryTimeslot();

	TimeManager tm;
	tm.startTimer();

	printConfiguration(max_iterations, num_teachers, total_section_subjects, total_section, teacher_subjects_length,
	                   bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week, max_teacher_work_load,
	                   break_time_duration, teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, result_buff_length, offset_duration, enable_logging, tm.getStartTime());

	abc.run();

	// std::map<int, int> costs;

	tm.stopTimer();

	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, best_solution.total_cost, GREEN_B, " -- -- ", RESET);
	print(GREEN_B, " -- -- -- -- -- -- -- -- -- -- -- -- -- -- ", RESET);

	Bee final_bee = abc.getBestSolution();

	printSchoolClasses(final_bee.timetable);

	if (enable_logging) {
		std::string name_file = std::string(LOG_FOLDER) + "c" + tm.getStartDate() + "-" + tm.getStartTime() + "---" +
		                        std::to_string(num_teachers) + "_" + std::to_string(total_section) + "_" + std::to_string(final_bee.total_cost) + "---" + "timetable.txt";
		std::ofstream txt_file(name_file);
		logResults(txt_file, final_bee.total_cost, tm.getTimelapse(), tm.getStartDate(), tm.getStartTime(), 69, max_iterations, num_teachers, total_section_subjects,
		           total_section, teacher_subjects_length, bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week, max_teacher_work_load, break_time_duration,
		           teacher_break_threshold, min_total_class_duration_for_two_breaks, default_class_duration, result_buff_length, offset_duration, enable_logging);

		// logCosts(costs, txt_file);
		logConflicts(&final_bee, txt_file);
		logSchoolClasses(final_bee.timetable, txt_file);

		print("----------------------------");
		print("result log file: ", name_file);
		print("----------------------------");

		txt_file.close();
	}

	evaluator.evaluate(final_bee, Timetable::s_teachers_set, Timetable::s_sections_set, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, final_bee.total_cost, GREEN_B, " -- -- ", RESET);

	print("Time taken: ", tm.getTimelapse());

	abc.getResult(result_timetable, result_timetable_2, offset_duration);
	abc.getViolation(result_violation);

	return;
}
}
