#include "abc.h"
#include "log.h"
#include "print.h"
#include "random_util.h"
#include "rotaryTimeslot.h"
#include "timeManager.h"

using namespace std;

#define LOG_FOLDER "logs2/"

RotaryTimeslot Timetable::s_rotary_timeslot;
SubjectTeacherQueue Timetable::s_subject_teacher_queue;

void Timetable::setTeacherBreakThreshold(int s_teacher_break_threshold_) {
	s_teacher_break_threshold = s_teacher_break_threshold_;
}
void Timetable::setDefaultClassDuration(int s_default_class_duration_) {
	s_default_class_duration = s_default_class_duration_;
}
void Timetable::setMaxTeacherWorkLoad(int s_max_teacher_work_load_) {
	s_max_teacher_work_load = s_max_teacher_work_load_;
}
void Timetable::setBreakTimeDuration(int s_break_time_duration_) {
	s_break_time_duration = s_break_time_duration_;
}
void Timetable::setWorkWeek(int s_work_week_) {
	s_work_week = s_work_week_;
}
void Timetable::setTotalSection(int s_total_section_) {
	s_total_section = s_total_section_;
}
void Timetable::setTeachersSet(const std::unordered_set<int>& teachers_set_) {
	s_teachers_set = teachers_set_;
}
void Timetable::setSectionsSet(const std::unordered_set<int>& sections_set_) {
	s_sections_set = sections_set_;
}

int Timetable::s_teacher_break_threshold;
int Timetable::s_default_class_duration;
int Timetable::s_max_teacher_work_load;
int Timetable::s_break_time_duration;
int Timetable::s_work_week;
int Timetable::s_total_section;
std::unordered_set<int> Timetable::s_sections_set;
std::unordered_set<int> Timetable::s_teachers_set;
SubjectEligibilityManager Timetable::s_subject_eligibility_manager;
std::uniform_int_distribution<int> Timetable::s_random_section;
std::uniform_int_distribution<int8_t> Timetable::s_random_workDay;
std::uniform_int_distribution<int> Timetable::s_random_field;

void Timetable::reset() {
	Timetable::setBreakTimeDuration(0);
	Timetable::setWorkWeek(0);

	// initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

void Timetable::addEligibleTeacher(int subject_id, int teacher_id) {
	s_subject_eligibility_manager.addTeacher(subject_id, teacher_id);
};

void Timetable::addSection(int section_id, int num_break, int start_time, int total_timeslot, int not_allowed_breakslot_gap, bool is_dynamic_subject_consistent_duration) {
	sections.emplace(section_id, Section(section_id, num_break, start_time, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration));
}

void Timetable::addTeacher(int teacher_id, int max_work_load) {
	teachers.emplace(teacher_id, Teacher(teacher_id, max_work_load));
}

void Timetable::initializeRandomFieldDistribution(int min, int max) {
	s_random_field = std::uniform_int_distribution<int>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	s_random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}

Section& Timetable::getSectionById(int section_id) {
	auto it = sections.find(section_id);
	if (it != sections.end()) {
		return it->second;  // Return the Section if found
	} else {
		throw std::runtime_error("Section ID not found");  // Handle the error case as needed
	}
}

Teacher& Timetable::getTeacherById(int teacher_id) {
	auto it = teachers.find(teacher_id);
	if (it != teachers.end()) {
		return it->second;  // Return the Teacher if found
	} else {
		throw std::runtime_error("Teacher ID not found");  // Handle the error case as needed
	}
}

int Timetable::getTeacherBreakThreshold() { return s_teacher_break_threshold; }
int Timetable::getDefaultClassDuration() { return s_default_class_duration; }
int Timetable::getMaxTeacherWorkLoad() { return s_max_teacher_work_load; }
int Timetable::getBreakTimeDuration() { return s_break_time_duration; }
int Timetable::getWorkWeek() { return s_work_week; }
int Timetable::getTotalSection() { return s_total_section; }

std::unordered_set<int>& Timetable::getTeachersSet() { return s_teachers_set; }
std::unordered_set<int>& Timetable::getSectionsSet() { return s_sections_set; }

std::shared_ptr<SubjectConfiguration> Timetable::findSubjectConfigurationById(int subject_configuration_id) {
	for (auto& subj : subject_configurations) {
		if (subj->getSubjectConfigurationId() == subject_configuration_id) {
			return subj;
		}
	}
	return nullptr;
}

void Timetable::addSubjectToSection(int section_id, int subject_configuration_id) {
	auto subject = findSubjectConfigurationById(subject_configuration_id);

	if (subject) {
		auto it = sections.find(section_id);
		if (it != sections.end()) {
			// Section exists, add subject to it
			it->second.addSubject(subject);
		} else {
			// Section does not exist
			std::cout << "Section not found!\n";
		}
	} else {
		std::cout << "Section or Subject not found!\n";
	}
}

void Timetable::addSubjectConfiguration(int id, int subject_id, int duration, int units, int order) {
	auto subject_configuration = std::make_shared<SubjectConfiguration>(id, subject_id, duration, units, order);
	subject_configurations.push_back(subject_configuration);
}

void Timetable::changeTeacher(Section& selected_section, int selected_timeslot, int new_teacher_id, std::unordered_set<int>& update_teachers) {
	// 	// changing teachers

	if (selected_section.getClassTimeslotScheduledDay(selected_timeslot).count(ScheduledDay::EVERYDAY) > 0) {
		int subject_id = selected_section.getClassTimeslotSubjectID(ScheduledDay::EVERYDAY, selected_timeslot);
		int old_teacher = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot);

		// TODO: if there's only one teacher available, don't do this way
		// TODO: smart picking teacher

		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			// TODO: MIGHT make this a function
			getTeacherById(old_teacher).decrementClassCount(static_cast<ScheduledDay>(day));
			getTeacherById(new_teacher_id).incrementClassCount(static_cast<ScheduledDay>(day));
		}

		update_teachers.insert(old_teacher);
		update_teachers.insert(new_teacher_id);

		// print("removing utilized teacher", old_teacher);
		selected_section.removeUtilizedTeacher(old_teacher);

		// print("adding utilized teacher", new_teacher_id);
		selected_section.addUtilizedTeacher(new_teacher_id);

		SchoolClass updated_school_class = SchoolClass{subject_id, new_teacher_id};

		int old_teacher_id = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot);

		selected_section.updateClassTimeslotDay(ScheduledDay::EVERYDAY, selected_timeslot, updated_school_class);

		int new_teacher_id = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot);

		// print("hays old teacher", old_teacher_id, "new teacher", new_teacher_id);

	} else {
		// TODO: separate
		// TODO: same teacher on same subject DONE
		// TODO: CHECK IF THIS iS WORKING

		ScheduledDay randomScheduledDay = selected_section.getRandomClassTimeslotWorkingDays(selected_timeslot);

		int selected_timeslot_subject_id = selected_section.getClassTimeslotSubjectID(randomScheduledDay, selected_timeslot);
		int old_teacher = selected_section.getClassTimeslotTeacherID(randomScheduledDay, selected_timeslot);

		std::unordered_set<ScheduledDay> all_scheduled_days = selected_section.getAllScheduledDayOnClasstimeslot(selected_timeslot);
		for (const auto& it : all_scheduled_days) {
			int subject_id = selected_section.getClassTimeslotSubjectID(it, selected_timeslot);

			if (subject_id == selected_timeslot_subject_id) {
				SchoolClass updated_school_class = SchoolClass{subject_id, new_teacher_id};
				selected_section.updateClassTimeslotDay(it, selected_timeslot, updated_school_class);
			}
		}

		update_teachers.insert(old_teacher);
		update_teachers.insert(new_teacher_id);

		// FIXME: only date that are affected
		for (int day = 1; day <= Timetable::getWorkWeek(); day++) {
			getTeacherById(old_teacher).decrementClassCount(static_cast<ScheduledDay>(day));
			getTeacherById(new_teacher_id).incrementClassCount(static_cast<ScheduledDay>(day));
		}

		SchoolClass updated_school_class = SchoolClass{selected_timeslot_subject_id, new_teacher_id};
		selected_section.updateClassTimeslotDay(randomScheduledDay, selected_timeslot, updated_school_class);
	}
}

void Timetable::updateTeachersAndSections(
    std::unordered_set<int>& update_teachers,
    std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itLow,
    std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    Section& selected_section,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);

	auto timeslot_begin = selected_section.getClasses().begin();

	int start = selected_section.getStartTime();

	for (auto it = itLow; it != itUp; ++it) {
		if (it->first == itLow->first + 1 && is_skipping_between) {
			it = itUpPrev;
		}

		auto day_schedule = selected_section.getClasses().find(it->first)->second;
		auto day_zero = day_schedule.find(ScheduledDay::EVERYDAY);

		if (it != timeslot_begin) {
			// start = section.time_range[std::prev(it)->first].end;
			start = selected_section.getTimeslotEnd(std::prev(it)->first);
		}

		if (day_zero != day_schedule.end()) {
			int subject = day_zero->second.subject_id;

			int duration = (subject == -1) ? Timetable::getBreakTimeDuration() : selected_section.getSubject(subject).getDuration();
			int teacher_id = day_zero->second.teacher_id;

			if (!is_reset) {
				selected_section.updateTimeslotStart(it->first, start);
				selected_section.updateTimeslotEnd(it->first, start + duration);
			}

			if (subject != -1) {
				Teacher& teacher = getTeacherById(teacher_id);

				if (is_returning_teachers) {
					update_teachers.insert(teacher_id);
				}

				for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
					for (int j = 0; j < duration; ++j) {
						if (is_reset) {
							if (teacher.decrementUtilizedTime(i, start + j) <= 0) {
								teacher.removeUtilizedTimeslot(i, start + j);

								if (teacher.isUtilizedTimesDayEmpty(i)) {
									teacher.removeUtilizedTimeDay(i);
								}
							};
						} else {
							teacher.incrementUtilizedTime(i, start + j);
						}
					}
				}
			};
		} else {
			int max_duration = 0;

			for (const auto& day : it->second) {
				int subject = day.second.subject_id;

				int duration = selected_section.getSubject(subject).getDuration();

				max_duration = std::max(max_duration, duration);
				int teacher_id = day.second.teacher_id;
				Teacher& teacher = getTeacherById(teacher_id);

				if (is_returning_teachers) {
					update_teachers.insert(teacher_id);
				}

				for (int j = 0; j < duration; ++j) {
					if (is_reset) {
						if (teacher.decrementUtilizedTime(static_cast<int>(day.first), start + j) <= 0) {
							teacher.removeUtilizedTimeslot(static_cast<int>(day.first), start + j);

							if (teacher.isUtilizedTimesDayEmpty(static_cast<int>(day.first))) {
								teacher.removeUtilizedTimeDay(static_cast<int>(day.first));
							}
						}
					} else {
						teacher.incrementUtilizedTime(static_cast<int>(day.first), start + j);
					}
				}
			}

			if (!is_reset) {
				selected_section.updateTimeslotStart(it->first, start);
				selected_section.updateTimeslotEnd(it->first, start + max_duration);
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

int Timetable::getRandomTeacher(int subject_id) {
	return s_subject_eligibility_manager.getNewRandomTeacher(subject_id);
}

void Timetable::setClasstimeslot(Section& section) {
	int class_start = section.getStartTime();

	const auto& classes = section.getClasses();

	for (const auto& [timeslot, day_school_class] : classes) {
		if (day_school_class.count(ScheduledDay::EVERYDAY)) {
			const SchoolClass& schoolClass = day_school_class.at(ScheduledDay::EVERYDAY);
			int subject_id = schoolClass.subject_id;

			int duration = (subject_id == -1) ? Timetable::getBreakTimeDuration() : section.getSubject(subject_id).getDuration();

			section.setTimeRange(timeslot, ClassStartEnd{class_start, class_start + duration});
			class_start += duration;

		} else {
			int max_duration = 0;

			for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
				if (day_school_class.count(static_cast<ScheduledDay>(i))) {
					int subject_id = day_school_class.at(static_cast<ScheduledDay>(i)).subject_id;

					int subject_duration = section.getSubject(subject_id).getDuration();
					if (subject_duration > max_duration) {
						max_duration = subject_duration;
					}
				}
			}

			section.setTimeRange(timeslot, ClassStartEnd{class_start, class_start + max_duration});

			class_start += max_duration;
		}
	}

	section.setTotalDuration(class_start - section.getStartTime());
}

std::vector<int> Timetable::getBreaks(const Section& section) const {
	int num_breaks = section.getNumberOfBreak();
	int gap = section.getNotAllowedBreakslotGap();
	int total_timeslot = section.getTotalTimeslot();

	std::vector<std::vector<int>> possible_breaks = getAllBreaksCombination(
	    total_timeslot,
	    num_breaks,
	    gap,
	    num_breaks == 1 ? gap + 1 : gap);

	// FIXME: temporary fix might be code smell
	// Calculate the reverse index based on the current try count
	int index = (possible_breaks.size() - (s_rotary_timeslot.getTotalTry() % possible_breaks.size())) % possible_breaks.size();

	return possible_breaks[index];
}

void Timetable::setupTimeslots(int total_timeslot, std::deque<int>& timeslot_keys, std::map<int, int>& timeslots, const std::vector<int>& skips) const {
	s_rotary_timeslot.adjustPosition(total_timeslot);
	std::vector<int> timeslot = s_rotary_timeslot.getTimeslot(total_timeslot, skips);
	timeslot_keys.insert(timeslot_keys.end(), timeslot.begin(), timeslot.end());
	s_rotary_timeslot.incrementShift();

	for (size_t i = 0; i < timeslot_keys.size(); ++i) {
		timeslots[timeslot_keys[i]] = Timetable::getWorkWeek();
	}
}

void Timetable::categorizeSubjects(Section& section,
                                   std::vector<int>& full_week_day_subjects,
                                   std::vector<int>& special_unit_subjects,
                                   std::set<int>& non_dynamic_order_start,
                                   std::set<int>& non_dynamic_order_end) const {
	const auto& subject_configurations = section.getSubjectConfigurations();
	for (const auto& [subject_id, _] : subject_configurations) {
		int order = section.getSubject(subject_id).getOrder();
		int units = section.getSubject(subject_id).getUnits();

		if (units == 0) {
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
}

void Timetable::processTimeslots(std::map<int, int>& fixed_subject_order,
                                 std::set<int>& reserved_timeslots,
                                 std::deque<int>& timeslot_keys,
                                 std::map<int, int>& timeslots,
                                 const std::set<int>& non_dynamic_order_start,
                                 const std::set<int>& non_dynamic_order_end) const {
	// Lambda to assign timeslots to subject order and mark them as reserved
	auto assignTimeslots = [&](auto begin, auto end, auto& timeslot_it) {
		for (auto itr = begin; itr != end; ++itr) {
			fixed_subject_order[*itr] = *timeslot_it;
			reserved_timeslots.insert(*timeslot_it);
			++timeslot_it;
		}
	};

	auto timeslot_it = timeslot_keys.begin();
	assignTimeslots(non_dynamic_order_start.begin(), non_dynamic_order_start.end(), timeslot_it);

	auto timeslot_it_reverse = timeslot_keys.rbegin();
	assignTimeslots(non_dynamic_order_end.rbegin(), non_dynamic_order_end.rend(), timeslot_it_reverse);

	// Erase reserved timeslots from timeslot_keys and timeslots in a single pass
	timeslot_keys.erase(std::remove_if(timeslot_keys.begin(), timeslot_keys.end(),
	                                   [&](int t) { return reserved_timeslots.count(t); }),
	                    timeslot_keys.end());

	for (int t : reserved_timeslots) {
		timeslots.erase(t);
	}
}

void Timetable::initializeRandomTimetable(std::unordered_set<int>& update_teachers) {
	if (sections.size() == 0) {
		print("no sections");
		exit(1);
	}

	for (auto& [section_id, section] : sections) {
		// print("section", section_id);
		std::vector<int> breaks = getBreaks(section);
		section.assignBreaks(breaks);

		std::deque<int> timeslot_keys;
		std::map<int, int> timeslots;
		setupTimeslots(section.getTotalTimeslot(), timeslot_keys, timeslots, breaks);

		std::vector<int> full_week_day_subjects;
		std::vector<int> special_unit_subjects;
		std::set<int> non_dynamic_order_start;
		std::set<int> non_dynamic_order_end;
		categorizeSubjects(section, full_week_day_subjects, special_unit_subjects, non_dynamic_order_start, non_dynamic_order_end);

		std::map<int, int> fixed_subject_order;
		std::set<int> reserved_timeslots;

		processTimeslots(fixed_subject_order, reserved_timeslots, timeslot_keys, timeslots, non_dynamic_order_start, non_dynamic_order_end);

		for (const auto& subject_id : full_week_day_subjects) {
			int order = section.getSubject(subject_id).getOrder();

			int subject_duration = section.getSubject(subject_id).getDuration() * Timetable::getWorkWeek();  // TODO: not elegant
			int queued_teacher = Timetable::s_subject_teacher_queue.getTeacher(subject_id, subject_duration);
			int selected_teacher = getRandomTeacher(subject_id);

			if (queued_teacher == -1) {
				print("Bobo");
			}

			section.addUtilizedTeacher(selected_teacher);

			for (int day = 1; day <= Timetable::getWorkWeek(); ++day) {
				getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
			}

			if (order == 0) {
				int timeslot_key = timeslot_keys.front();

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				section.addClass(timeslot_key, ScheduledDay::EVERYDAY, SchoolClass{subject_id, selected_teacher});

				timeslots.erase(timeslot_key);
			} else {
				int timeslot_key = fixed_subject_order[order];

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				section.addClass(timeslot_key, ScheduledDay::EVERYDAY, SchoolClass{subject_id, selected_teacher});

				section.addFixedTimeSlotDay(timeslot_key, ScheduledDay::EVERYDAY);

				timeslots.erase(timeslot_key);
			}
		}

		int day = 1;
		for (const auto& subject_id : special_unit_subjects) {
			int order = section.getSubject(subject_id).getOrder();
			int units = section.getSubject(subject_id).getUnits();

			int selected_teacher = getRandomTeacher(subject_id);
			getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));

			section.addUtilizedTeacher(selected_teacher);

			for (int iter = 1; iter <= units; ++iter) {
				if (order == 0) {
					auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
					                       [&timeslots](int key) { return timeslots[key] > 0; });

					if (it == timeslot_keys.end()) {
						print("no more timeslots");
						break;
					}

					int timeslot = *it;

					section.addClass(timeslot, static_cast<ScheduledDay>(day), SchoolClass{subject_id, selected_teacher});
					section.addSegmentedTimeSlot(timeslot);

					if (--timeslots[timeslot] == 0) {
						timeslot_keys.erase(it);
						timeslots.erase(timeslot);
					}
				} else {
					int timeslot_key = fixed_subject_order[order];

					section.addClass(timeslot_key, static_cast<ScheduledDay>(day), SchoolClass{subject_id, selected_teacher});

					section.addSegmentedTimeSlot(timeslot_key);

					section.addFixedTimeSlotDay(timeslot_key, static_cast<ScheduledDay>(day));

					if (--timeslots[timeslot_key] == 0) {
						timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
						timeslots.erase(timeslot_key);
					}
				}

				if (++day > Timetable::getWorkWeek()) day = 1;
			}
		}

		setClasstimeslot(section);

		auto& classes = section.getClasses();
		updateTeachersAndSections(update_teachers, classes.begin(), classes.end(), true, false, section, false);
	}
}

int Timetable::getRandomInRange(int n) {
	std::uniform_int_distribution<int> distribution(0, n);
	return distribution(randomizer_engine);
}

std::pair<int, int> Timetable::pickRandomTimeslots(Section& selected_section, int field) {
	int selected_timeslot_1;
	int selected_timeslot_2;

	int timeslots = selected_section.getTotalTimeslot();
	auto& section_break_slots = selected_section.getBreakSlots();
	auto& fixed_timeslot_day = selected_section.getFixedTimeslotDay();

	if (field == 0) {
		bool is_timeslot_1_at_start_or_end_of_schedule = false;
		bool is_timeslot_2_at_start_or_end_of_schedule = false;

		bool is_timeslot_1_break = false;
		bool is_timeslot_2_break = false;

		bool is_fixed_subject = false;

		bool ignore_break_slots = false;

		bool is_consistent_duration = selected_section.isDynamicSubjectConsistentDuration();

		do {
			selected_timeslot_1 = getRandomInRange(timeslots - 1);
			selected_timeslot_2 = getRandomInRange(timeslots - 1);

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == timeslots - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == timeslots - 1;

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

		return {selected_timeslot_1, selected_timeslot_2};

	} else if (field == 1) {
		selected_timeslot_1 = getRandomInRange(timeslots - 1);

		do {
			selected_timeslot_1 = getRandomInRange(timeslots - 1);

		} while (selected_section.isInBreakSlots(selected_timeslot_1));

		selected_timeslot_2 = selected_timeslot_1;

		return {selected_timeslot_1, selected_timeslot_2};

	} else if (field == 2) {
		std::vector<int> timeslots;
		for (const auto& entry : selected_section.getSegmentedTimeslot()) {
			timeslots.push_back(entry);
		}

		std::uniform_int_distribution<> dis2(0, timeslots.size() - 1);
		selected_timeslot_1 = timeslots[dis2(randomizer_engine)];
		selected_timeslot_2 = timeslots[dis2(randomizer_engine)];

		return {selected_timeslot_1, selected_timeslot_2};
	} else {
		return {0, 0};
	}
}

Section& Timetable::pickRandomSection() {
	// return Timetable::s_random_section(randomizer_engine);
	int section_id = Timetable::s_random_section(randomizer_engine);

	// print("ff", getSectionById(section_id).getId());

	return getSectionById(section_id);

	// if (sections_with_conflicts.empty()) {
	// } else {
	// 	std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

	// 	int random_index = dis(randomizer_engine);

	// 	auto it = sections_with_conflicts.begin();
	// 	std::advance(it, random_index);

	// 	int section_id = *it;

	// 	return getSectionById(section_id);
	// }
}

int Timetable::pickRandomField(Section& selected_section) {
	return 1;

	// if (selected_section.getSegmentedTimeslot().empty()) {
	// 	std::uniform_int_distribution<> dis(0, 1);

	// 	return dis(randomizer_engine);
	// } else {
	// 	return Timetable::s_random_field(randomizer_engine);
	// }
}

bool Timetable::isSkippingUpdateBetween(Section& selected_section, std::pair<int, int> selected_timeslots) const {
	int selected_timeslot_1 = selected_timeslots.first;
	int selected_timeslot_2 = selected_timeslots.second;

	int duration_1 = selected_section.getTimeslotEnd(selected_timeslot_1) - selected_section.getTimeslotStart(selected_timeslot_1);
	int duration_2 = selected_section.getTimeslotEnd(selected_timeslot_2) - selected_section.getTimeslotStart(selected_timeslot_2);

	return duration_1 == duration_2;
}

void Timetable::modify(Section& selected_section,
                       int choice,
                       std::pair<int, int> selected_timeslots,
                       std::unordered_set<int>& update_teachers,
                       std::unordered_set<int>& update_sections,
                       SubjectEligibilityManager& eligibility_manager) {
	// if (sections_with_conflicts.size() >= 1) {
	// 	print(RED, "j");
	// 	print(RED, "conflicts count", sections_with_conflicts.size());
	// }

	if (choice == 0) {
		update_sections.insert(selected_section.getId());
	}

	// choice = 1;
	// print("section", selected_section.getId(), "selected_timeslot_1", selected_timeslot_1, "selected_timeslot_2", selected_timeslot_2);

	auto selected_timeslot_1 = selected_timeslots.first;
	auto selected_timeslot_2 = selected_timeslots.second;
	auto& classes = selected_section.getClasses();
	auto itLow = classes.lower_bound(std::min(selected_timeslot_1, selected_timeslot_2));
	auto itUp = classes.upper_bound(std::max(selected_timeslot_1, selected_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	bool is_skipping_between = isSkippingUpdateBetween(selected_section, selected_timeslots);
	updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);
	if (choice == 0) {
		// swapping of classes between timeslots in the same section

		if (selected_section.isInBreakSlots(itLow->first) && !selected_section.isInBreakSlots(itUpPrev->first)) {
			selected_section.removeBreakSlot(itLow->first);
			selected_section.removeBreakSlot(itUpPrev->first);
		} else if (selected_section.isInBreakSlots(itUpPrev->first) && !selected_section.isInBreakSlots(itLow->first)) {
			selected_section.removeBreakSlot(itUpPrev->first);
			selected_section.removeBreakSlot(itLow->first);
		}

		std::swap(classes[selected_timeslot_1], classes[selected_timeslot_2]);

		if (!selected_section.getSegmentedTimeslot().empty()) {
			if (selected_section.isInSegmentedTimeslot(selected_timeslot_1) && !selected_section.isInSegmentedTimeslot(selected_timeslot_2)) {
				selected_section.removeSegmentedTimeSlot(selected_timeslot_1);
				selected_section.addSegmentedTimeSlot(selected_timeslot_2);
			} else if (selected_section.isInSegmentedTimeslot(selected_timeslot_2) && !selected_section.isInSegmentedTimeslot(selected_timeslot_1)) {
				selected_section.removeSegmentedTimeSlot(selected_timeslot_2);
				selected_section.addSegmentedTimeSlot(selected_timeslot_1);
			}
		}

	} else if (choice == 1) {
		int subject_id = selected_section.getClassTimeslotSubjectID(ScheduledDay::EVERYDAY, selected_timeslot_1);

		// TODO: leave breakslots alone
		if (subject_id == -1) {
			return;
		}

		std::unordered_set<ScheduledDay> days = selected_section.getClassTimeslotScheduledDay(selected_timeslot_1);

		if (days.count(ScheduledDay::EVERYDAY) > 0) {
			// print(RED_BG, "yes");
			int old_teacher_id = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot_1);
			int new_teacher = eligibility_manager.getNewRandomTeacher(subject_id, old_teacher_id);

			// print("selected_section", selected_section.getId(), "x old teacher", old_teacher_id, "x new teacher", new_teacher);
			changeTeacher(selected_section, selected_timeslot_1, new_teacher, update_teachers);
		} else {
			// print(RED_BG, "no");
			// TODO: implement
		}

	} else if (choice == 2) {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		ScheduledDay day_1, day_2;

		auto& section_timeslot_1 = classes[selected_timeslot_1];
		auto& section_timeslot_2 = classes[selected_timeslot_2];

		do {
			day_1 = static_cast<ScheduledDay>(Timetable::s_random_workDay(randomizer_engine));
			day_2 = static_cast<ScheduledDay>(Timetable::s_random_workDay(randomizer_engine));

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
			int teacher_id_1 = it1->second.teacher_id;
			int teacher_id_2 = it2->second.teacher_id;

			getTeacherById(teacher_id_1).decrementClassCount(static_cast<ScheduledDay>(day_1));
			getTeacherById(teacher_id_1).incrementClassCount(static_cast<ScheduledDay>(day_2));
			getTeacherById(teacher_id_2).incrementClassCount(static_cast<ScheduledDay>(day_1));
			getTeacherById(teacher_id_2).decrementClassCount(static_cast<ScheduledDay>(day_2));

			std::swap(it1->second, it2->second);
		} else if (it1 != section_timeslot_1.end() && it2 == section_timeslot_2.end()) {
			int teacher_id = it1->second.teacher_id;

			getTeacherById(teacher_id).decrementClassCount(static_cast<ScheduledDay>(day_1));
			getTeacherById(teacher_id).incrementClassCount(static_cast<ScheduledDay>(day_2));

			section_timeslot_2[day_2] = std::move(it1->second);
			section_timeslot_1.erase(it1);
		} else if (it1 == section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			int teacher_id = it2->second.teacher_id;

			getTeacherById(teacher_id).incrementClassCount(static_cast<ScheduledDay>(day_1));
			getTeacherById(teacher_id).decrementClassCount(static_cast<ScheduledDay>(day_2));

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

int32_t packInt8ToInt32(int8_t first, int8_t second, int8_t third, int8_t fourth) {
	int32_t result = (static_cast<int32_t>(first) << 24) |
	                 (static_cast<uint8_t>(second) << 16) |
	                 (static_cast<uint8_t>(third) << 8) |
	                 (static_cast<uint8_t>(fourth));
	return result;
}

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
    int32_t* subject_configuration_subject_order,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* teacher_max_weekly_load,

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
	// Timetable::reset();
	print(CYAN, "RESETT", RESET);

	std::unordered_map<int, Section> sections;
	std::unordered_map<int, Teacher> teachers;

	Timetable timetable;

	{
		Timetable::setTotalSection(total_section);
		Section::total_section = total_section;
		Teacher::total_teacher = num_teachers;

		Timetable::s_random_section = std::uniform_int_distribution<int>(0, total_section - 1);
		// Timetable::initializeRandomSectionDistribution(0, total_section - 1);
		Timetable::initializeRandomFieldDistribution(0, 2);
		Timetable::initializeRandomWorkDayDistribution(1, work_week);
		Timetable::s_rotary_timeslot = RotaryTimeslot();
		Timetable::s_subject_teacher_queue = SubjectTeacherQueue();
		Timetable::s_subject_eligibility_manager = SubjectEligibilityManager();

		std::unordered_map<int, int> section_num_of_class_block;

		Timetable::setTeacherBreakThreshold(teacher_break_threshold);
		Timetable::setDefaultClassDuration(default_class_duration);
		Timetable::setMaxTeacherWorkLoad(max_teacher_work_load);
		Timetable::setBreakTimeDuration(break_time_duration);
		Timetable::setWorkWeek(work_week);

		sections.reserve(total_section);
		teachers.reserve(num_teachers);

		std::unordered_set<int> section_set;
		for (int i = 0; i < total_section; i++) {
			section_set.insert(i);
		}

		Timetable::setSectionsSet(section_set);

		std::unordered_set<int> teacher_set;
		for (int i = 0; i < num_teachers; i++) {
			teacher_set.insert(i);
		}

		Timetable::setTeachersSet(teacher_set);

		for (int i = 0; i < number_of_subject_configuration; i++) {
			int subject_id;
			int subject_units;
			int subject_duration;
			int subject_order;

			subject_id = static_cast<int>(subject_configuration_subject_units[i] >> 16);
			subject_units = static_cast<int>(subject_configuration_subject_units[i] & 0xFFFF);
			subject_duration = static_cast<int>(subject_configuration_subject_duration[i] & 0xFFFF);
			subject_order = static_cast<int>(subject_configuration_subject_order[i] & 0xFFFF);

			timetable.addSubjectConfiguration(i, subject_id, subject_duration, subject_units, subject_order);
		}

		for (int i = 0; i < total_section; i++) {
			int section_id = i;
			int num_break = static_cast<int>((section_configuration[i] >> 24) & 0xFF);
			int total_timeslot = static_cast<int>((section_configuration[i] >> 16) & 0xFF);
			int not_allowed_breakslot_gap = static_cast<int>((section_configuration[i] >> 8) & 0xFF);
			bool is_dynamic_subject_consistent_duration = static_cast<bool>(section_configuration[i] & 0xFF);
			int start = static_cast<int>(section_start[i]);

			print("ff", section_id,
			      num_break,
			      total_timeslot,
			      not_allowed_breakslot_gap,
			      is_dynamic_subject_consistent_duration,
			      start);

			Section::s_all_sections.insert(section_id);
			timetable.addSection(section_id, num_break, start, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration);
		}

		for (int i = 0; i < num_teachers; i++) {
			int max_weekly_load = teacher_max_weekly_load[i];

			Teacher::s_all_teachers.insert(i);
			Teacher teacher(i, max_weekly_load);

			timetable.addTeacher(i, max_weekly_load);
		}

		for (int i = 0; i < teacher_subjects_length; i++) {
			if (teacher_subjects[i] == -1) continue;

			int teacher, subject;
			teacher = static_cast<int>(teacher_subjects[i] >> 16);
			subject = static_cast<int>(teacher_subjects[i] & 0xFFFF);

			Timetable::addEligibleTeacher(subject, teacher);

			Timetable::s_subject_teacher_queue.addTeacher(subject, teacher, 70);
		}

		for (int i = 0; i < total_section_subjects; i++) {
			int section_id;
			int subject_configuration_id;

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
	                   bees_population, bees_employed, bees_onlooker, bees_scout, limit, work_week, max_teacher_work_load,
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

	evaluator.evaluate(final_bee, Teacher::s_all_teachers, Section::s_all_sections, false, true);
	print(GREEN_B, " -- -- Best solution: cost ", RED_B, final_bee.total_cost, GREEN_B, " -- -- ", RESET);

	print("Time taken: ", tm.getTimelapse());

	abc.getResult(result_timetable, result_timetable_2, offset_duration);
	abc.getViolation(result_violation);

	return;
}
}
