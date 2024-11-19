
#include "print.h"
#include "random_util.h"
#include "rotaryTimeslot.h"
#include "timeManager.h"

using namespace std;

RotaryTimeslot Timetable::s_rotary_timeslot;
SubjectTeacherQueue Timetable::s_subject_teacher_queue;
SubjectEligibilityManager Timetable::s_subject_eligibility_manager;

void Timetable::setTeacherBreakThreshold(int s_teacher_break_threshold_) {
	s_teacher_break_threshold = s_teacher_break_threshold_;
}
void Timetable::setTeacherMiddleTimePointGrowAllowanceForBreakTimeslot(int s_teacher_middle_time_point_grow_allowance_for_break_timeslot_) {
	s_teacher_middle_time_point_grow_allowance_for_break_timeslot = s_teacher_middle_time_point_grow_allowance_for_break_timeslot_;
}
void Timetable::setDefaultClassDuration(TimeDuration s_default_class_duration_) {
	s_default_class_duration = s_default_class_duration_;
}
void Timetable::setBreakTimeDuration(TimeDuration s_break_time_duration_) {
	s_break_time_duration = s_break_time_duration_;
}
void Timetable::setWorkWeek(int s_work_week_) {
	s_work_week = s_work_week_;
}
void Timetable::setTotalSection(int s_total_section_) {
	s_total_section = s_total_section_;
}
void Timetable::setTeachersSet(const std::unordered_set<TeacherID>& teachers_set_) {
	s_teachers_set = teachers_set_;
}
void Timetable::setSectionsSet(const std::unordered_set<SectionID>& sections_set_) {
	s_sections_set = sections_set_;
}

int Timetable::s_teacher_break_threshold;
int Timetable::s_teacher_middle_time_point_grow_allowance_for_break_timeslot;
TimeDuration Timetable::s_default_class_duration;
TimeDuration Timetable::s_break_time_duration;
int Timetable::s_work_week;
int Timetable::s_total_section;
std::unordered_set<SectionID> Timetable::s_sections_set;
std::unordered_set<TeacherID> Timetable::s_teachers_set;
std::uniform_int_distribution<SectionID> Timetable::s_random_section_id;
std::uniform_int_distribution<int8_t> Timetable::s_random_workDay;
std::uniform_int_distribution<int> Timetable::s_random_field;

void Timetable::reset() {
	Timetable::setBreakTimeDuration(0);
	Timetable::setWorkWeek(0);

	// initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

void Timetable::addEligibleTeacher(SubjectID subject_id, TeacherID teacher_id) {
	s_subject_eligibility_manager.addTeacher(subject_id, teacher_id);
};

void Timetable::addSection(SectionID section_id, int num_break, TimePoint start_time, int total_timeslot, int not_allowed_breakslot_gap, bool is_dynamic_subject_consistent_duration) {
	sections.emplace(section_id, Section(section_id, num_break, start_time, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration));
}

void Timetable::addTeacher(TeacherID teacher_id, TimeDuration max_work_load, TimeDuration min_work_load) {
	teachers.emplace(teacher_id, Teacher(teacher_id, max_work_load, min_work_load));
}

void Timetable::initializeRandomFieldDistribution(int min, int max) {
	s_random_field = std::uniform_int_distribution<int>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	s_random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}

Section& Timetable::getSectionById(SectionID section_id) {
	auto it = sections.find(section_id);
	if (it != sections.end()) {
		return it->second;
	} else {
		throw std::runtime_error("Section ID not found");
	}
}

Teacher& Timetable::getTeacherById(TeacherID teacher_id) {
	auto it = teachers.find(teacher_id);
	if (it != teachers.end()) {
		return it->second;
	} else {
		throw std::runtime_error("Teacher ID not found");
	}
}

int Timetable::getTeacherBreakThreshold() { return s_teacher_break_threshold; }
int Timetable::getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot() { return s_teacher_middle_time_point_grow_allowance_for_break_timeslot; }
TimeDuration Timetable::getDefaultClassDuration() { return s_default_class_duration; }
TimeDuration Timetable::getBreakTimeDuration() { return s_break_time_duration; }
int Timetable::getWorkWeek() { return s_work_week; }
int Timetable::getTotalSection() { return s_total_section; }

std::unordered_set<TeacherID>& Timetable::getTeachersSet() { return s_teachers_set; }
std::unordered_set<SectionID>& Timetable::getSectionsSet() { return s_sections_set; }

std::shared_ptr<SubjectConfiguration> Timetable::findSubjectConfigurationById(SubjectConfigurationID id) {
	for (auto& subject_configuration : subject_configurations) {
		if (subject_configuration->getSubjectConfigurationId() == id) {
			return subject_configuration;
		}
	}
	return nullptr;
}

void Timetable::addSubjectToSection(SectionID section_id, SubjectConfigurationID subject_configuration_id) {
	auto subject = findSubjectConfigurationById(subject_configuration_id);

	if (subject) {
		auto it = sections.find(section_id);
		if (it != sections.end()) {
			it->second.addSubject(subject);
		} else {
			std::cout << "Section not found!\n";
		}
	} else {
		std::cout << "Section or Subject not found!\n";
	}
}

void Timetable::moveTeacherClassCountToNewDay(TeacherID teacher_id, ScheduledDay from_day, ScheduledDay to_day) {
	getTeacherById(teacher_id).decrementClassCount(static_cast<ScheduledDay>(from_day));
	getTeacherById(teacher_id).incrementClassCount(static_cast<ScheduledDay>(to_day));
}

void Timetable::addSubjectConfiguration(SubjectConfigurationID id, SubjectID subject_id, TimeDuration duration, int units, Timeslot fixed_timeslot, std::vector<ScheduledDay> fixed_days) {
	auto subject_configuration = std::make_shared<SubjectConfiguration>(id, subject_id, duration, units, fixed_timeslot, fixed_days);
	subject_configurations.push_back(subject_configuration);
}

void Timetable::changeTeacher(Section& selected_section, Timeslot selected_timeslot, ScheduledDay day, TeacherID new_teacher_id, std::unordered_set<TeacherID>& update_teachers) {
	SubjectID subject_id = selected_section.getClassTimeslotSubjectID(day, selected_timeslot);
	TeacherID old_teacher = selected_section.getClassTimeslotTeacherID(day, selected_timeslot);

	getTeacherById(old_teacher).decrementClassCount(static_cast<ScheduledDay>(day));
	getTeacherById(new_teacher_id).incrementClassCount(static_cast<ScheduledDay>(day));

	update_teachers.insert(old_teacher);
	update_teachers.insert(new_teacher_id);

	selected_section.removeUtilizedTeacher(old_teacher);
	selected_section.addUtilizedTeacher(new_teacher_id);

	SchoolClass updated_school_class = SchoolClass{subject_id, new_teacher_id};
	TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(day, selected_timeslot);

	selected_section.updateClassTimeslotDay(day, selected_timeslot, updated_school_class);
}

void Timetable::updateTeachersAndSections(
    std::unordered_set<TeacherID>& update_teachers,
    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itLow,
    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    Section& selected_section,
    bool is_reset) {
	auto itUpPrev = std::prev(itUp);

	auto timeslot_begin = selected_section.getClasses().begin();

	TimePoint start = selected_section.getStartTime();

	for (auto it = itLow; it != itUp; ++it) {
		if (it->first == itLow->first + 1 && is_skipping_between) {
			it = itUpPrev;
		}

		auto day_schedule = selected_section.getClasses().find(it->first)->second;
		auto day_zero = day_schedule.find(ScheduledDay::EVERYDAY);

		if (it != timeslot_begin) {
			start = selected_section.getTimeslotEnd(std::prev(it)->first);
		}

		if (day_zero != day_schedule.end()) {
			SubjectID subject = day_zero->second.subject_id;

			TimeDuration duration = (subject == -1) ? Timetable::getBreakTimeDuration() : selected_section.getSubject(subject).getDuration();
			TeacherID teacher_id = day_zero->second.teacher_id;

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
					for (TimePoint time_point = 0; time_point < duration; ++time_point) {
						if (is_reset) {
							if (teacher.decrementUtilizedTime(i, start + time_point) <= 0) {
								teacher.removeUtilizedTimePoint(i, start + time_point);

								if (teacher.isUtilizedTimesDayEmpty(i)) {
									teacher.removeUtilizedTimeDay(i);
								}
							};
						} else {
							teacher.incrementUtilizedTime(i, start + time_point);
						}
					}
				}
			};
		} else {
			TimeDuration max_duration = 0;

			for (const auto& day : it->second) {
				SubjectID subject = day.second.subject_id;

				TimeDuration duration = selected_section.getSubject(subject).getDuration();

				max_duration = std::max(max_duration, duration);
				TeacherID teacher_id = day.second.teacher_id;
				Teacher& teacher = getTeacherById(teacher_id);

				if (is_returning_teachers) {
					update_teachers.insert(teacher_id);
				}

				for (TimePoint time_point = 0; time_point < duration; ++time_point) {
					if (is_reset) {
						if (teacher.decrementUtilizedTime(static_cast<int>(day.first), start + time_point) <= 0) {
							teacher.removeUtilizedTimePoint(static_cast<int>(day.first), start + time_point);

							if (teacher.isUtilizedTimesDayEmpty(static_cast<int>(day.first))) {
								teacher.removeUtilizedTimeDay(static_cast<int>(day.first));
							}
						}
					} else {
						teacher.incrementUtilizedTime(static_cast<int>(day.first), start + time_point);
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

std::vector<std::vector<Timeslot>> getAllBreaksCombination(int slot_count, int break_count, Timeslot gap, Timeslot end_gap) {
	std::set<Timeslot> breaks;
	std::set<Timeslot> possible_breaks;

	for (Timeslot i = gap; i < slot_count - end_gap; ++i) {
		possible_breaks.insert(i);
	}

	if (break_count == 1) {
		std::vector<std::vector<Timeslot>> break_combinations;

		for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
			break_combinations.push_back({*it});
		}

		return break_combinations;
	}

	std::vector<std::vector<Timeslot>> break_combinations;

	for (auto it = possible_breaks.begin(); it != possible_breaks.end(); ++it) {
		Timeslot breakslot = *it;

		for (auto it2 = it; it2 != possible_breaks.end(); ++it2) {
			if (std::abs(breakslot + 1 - *it2) >= gap) {
				break_combinations.push_back({breakslot, *it2});
			}
		}
	}

	return break_combinations;
}

std::vector<Timeslot> getDefaultBreaksCombination(std::vector<std::vector<Timeslot>>& breaks_combination) {
	return breaks_combination[breaks_combination.size() / 2];
}

TeacherID Timetable::getRandomTeacher(SubjectID subject_id) {
	return s_subject_eligibility_manager.getNewRandomTeacher(subject_id);
}

void Timetable::setClasstimeslot(Section& section) {
	TimePoint class_start = section.getStartTime();

	const auto& classes = section.getClasses();

	for (const auto& [timeslot, day_school_class] : classes) {
		if (day_school_class.count(ScheduledDay::EVERYDAY)) {
			const SchoolClass& schoolClass = day_school_class.at(ScheduledDay::EVERYDAY);
			SubjectID subject_id = schoolClass.subject_id;

			TimeDuration duration = (subject_id == -1) ? Timetable::getBreakTimeDuration() : section.getSubject(subject_id).getDuration();

			section.setTimeRange(timeslot, ClassStartEnd{class_start, class_start + duration});
			class_start += duration;

		} else {
			TimeDuration max_duration = 0;

			for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
				if (day_school_class.count(static_cast<ScheduledDay>(i))) {
					SubjectID subject_id = day_school_class.at(static_cast<ScheduledDay>(i)).subject_id;

					TimeDuration subject_duration = section.getSubject(subject_id).getDuration();
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

std::vector<Timeslot> Timetable::getBreaks(const Section& section) const {
	int num_breaks = section.getNumberOfBreak();
	Timeslot gap = section.getNotAllowedBreakslotGap();
	int total_timeslot = section.getTotalTimeslot();

	std::vector<std::vector<Timeslot>> possible_breaks = getAllBreaksCombination(
	    total_timeslot,
	    num_breaks,
	    gap,
	    num_breaks == 1 ? gap + 1 : gap);

	// FIXME: temporary fix might be code smell
	// Calculate the reverse index based on the current try count
	int index = (possible_breaks.size() - (s_rotary_timeslot.getTotalTry() % possible_breaks.size())) % possible_breaks.size();

	return possible_breaks[index];
}

void Timetable::setupTimeslots(int total_timeslot, std::deque<Timeslot>& timeslot_keys, std::map<Timeslot, std::vector<ScheduledDay>>& timeslots, const std::vector<Timeslot>& skips) const {
	s_rotary_timeslot.adjustPosition(total_timeslot);
	std::vector<Timeslot> timeslot = s_rotary_timeslot.getTimeslot(total_timeslot, skips);
	timeslot_keys.insert(timeslot_keys.end(), timeslot.begin(), timeslot.end());
	s_rotary_timeslot.incrementShift();

	for (size_t i = 0; i < timeslot_keys.size(); ++i) {
		for (int j = 1; j <= Timetable::getWorkWeek(); ++j) {
			timeslots[timeslot_keys[i]].push_back(static_cast<ScheduledDay>(j));
		}
	}
}

void Timetable::categorizeSubjects(Section& section,
                                   std::vector<SubjectID>& full_week_day_subjects,
                                   std::vector<SubjectID>& special_unit_subjects) const {
	const auto& subject_configurations = section.getSubjectConfigurations();
	for (const auto& [subject_id, _] : subject_configurations) {
		int units = section.getSubject(subject_id).getUnits();
		std::vector<ScheduledDay> fixed_days = section.getSubject(subject_id).getFixedDays();

		if (units == 0) {
			full_week_day_subjects.push_back(subject_id);
		} else {
			if (std::find(fixed_days.begin(), fixed_days.end(), ScheduledDay::ANYDAY) != fixed_days.end()) {
				special_unit_subjects.push_back(subject_id);
				std::rotate(special_unit_subjects.rbegin(), special_unit_subjects.rbegin() + 1, special_unit_subjects.rend());
			} else {
				special_unit_subjects.push_back(subject_id);
			}
		}
	}
}

void Timetable::initializeRandomTimetable(std::unordered_set<int>& update_teachers) {
	if (sections.size() == 0) {
		print("no sections");
		exit(1);
	}

	for (auto& [section_id, section] : sections) {
		// print("section", section_id);
		std::vector<Timeslot> breaks = getBreaks(section);
		section.assignBreaks(breaks);

		std::deque<Timeslot> timeslot_keys;
		std::map<Timeslot, std::vector<ScheduledDay>> timeslots;
		setupTimeslots(section.getTotalTimeslot(), timeslot_keys, timeslots, breaks);

		std::vector<SubjectID> full_week_day_subjects;
		std::vector<SubjectID> special_unit_subjects;
		categorizeSubjects(section, full_week_day_subjects, special_unit_subjects);

		for (const auto& subject_id : full_week_day_subjects) {
			Timeslot fixed_timeslot = section.getSubject(subject_id).getFixedTimeslot();

			TimeDuration subject_duration = section.getSubject(subject_id).getDuration() * Timetable::getWorkWeek();  // TODO: not elegant
			TeacherID queued_teacher = Timetable::s_subject_teacher_queue.getTeacher(subject_id, subject_duration);
			TeacherID selected_teacher = getRandomTeacher(subject_id);

			section.addUtilizedTeacher(selected_teacher);

			for (int day = 1; day <= Timetable::getWorkWeek(); ++day) {
				getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
			}

			if (fixed_timeslot == 0) {
				Timeslot timeslot_key = timeslot_keys.front();

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				section.addClass(timeslot_key, ScheduledDay::EVERYDAY, SchoolClass{subject_id, selected_teacher});

				section.addDynamicTimeSlot(timeslot_key);

				timeslots.erase(timeslot_key);
			} else {
				Timeslot timeslot_key = fixed_timeslot;

				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

				section.addClass(timeslot_key, ScheduledDay::EVERYDAY, SchoolClass{subject_id, selected_teacher});

				timeslots.erase(timeslot_key);
			}
		}

		for (const auto& subject_id : special_unit_subjects) {
			print("c subject", subject_id);

			Timeslot fixed_timeslot = section.getSubject(subject_id).getFixedTimeslot();
			int units = section.getSubject(subject_id).getUnits();

			TeacherID selected_teacher = getRandomTeacher(subject_id);
			std::vector<ScheduledDay> fixed_days = section.getSubject(subject_id).getFixedDays();

			section.addUtilizedTeacher(selected_teacher);

			// set of fixed day

			for (int iter = 1; iter <= units; ++iter) {
				if (fixed_timeslot == 0) {
					auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
					                       [&timeslots](int key) { return timeslots[key].size() > 0; });

					if (it == timeslot_keys.end()) {
						print("no more timeslots");
						break;
					}

					Timeslot timeslot = *it;

					ScheduledDay day;
					if (std::find(fixed_days.begin(), fixed_days.end(), ScheduledDay::ANYDAY) != fixed_days.end()) {
						std::vector<ScheduledDay>& days = timeslots[timeslot];
						std::uniform_int_distribution<int> dis_work_day(0, days.size() - 1);
						day = days[dis_work_day(randomizer_engine)];
						section.addDynamicTimeSlotDay(timeslot, static_cast<ScheduledDay>(day));
					} else {
						std::uniform_int_distribution<int> dis_work_day(0, fixed_days.size() - 1);
						day = fixed_days[dis_work_day(randomizer_engine)];
					}

					section.addClass(timeslot, static_cast<ScheduledDay>(day), SchoolClass{subject_id, selected_teacher});
					getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
					section.addSegmentedTimeSlot(timeslot);

					timeslots[timeslot].erase(std::remove(timeslots[timeslot].begin(), timeslots[timeslot].end(), day), timeslots[timeslot].end());
					if (timeslots[timeslot].size() == 0) {
						timeslot_keys.erase(it);
						timeslots.erase(timeslot);
					}
				} else {
					Timeslot timeslot_key = fixed_timeslot;

					ScheduledDay day;
					if (std::find(fixed_days.begin(), fixed_days.end(), ScheduledDay::ANYDAY) != fixed_days.end()) {
						std::vector<ScheduledDay>& days = timeslots[timeslot_key];
						std::uniform_int_distribution<int> dis_work_day(0, days.size() - 1);
						day = days[dis_work_day(randomizer_engine)];
						section.addDynamicTimeSlotDay(timeslot_key, static_cast<ScheduledDay>(day));
					} else {
						std::uniform_int_distribution<int> dis_work_day(0, fixed_days.size() - 1);
						day = fixed_days[dis_work_day(randomizer_engine)];
					}

					section.addClass(timeslot_key, static_cast<ScheduledDay>(day), SchoolClass{subject_id, selected_teacher});

					section.addSegmentedTimeSlot(timeslot_key);

					timeslots[timeslot_key].erase(std::remove(timeslots[timeslot_key].begin(), timeslots[timeslot_key].end(), day), timeslots[timeslot_key].end());
					if (timeslots[timeslot_key].size() == 0) {
						timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
						timeslots.erase(timeslot_key);
					}
				}
			}
		}

		for (const auto& [timeslot, days] : timeslots) {
			for (const auto& day : days) {
				section.addDynamicTimeSlotDay(timeslot, static_cast<ScheduledDay>(day));
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

std::pair<Timeslot, Timeslot> Timetable::pickRandomTimeslots(Section& selected_section, int field) {
	Timeslot selected_timeslot_1;
	Timeslot selected_timeslot_2;

	int timeslot_count = selected_section.getTotalTimeslot();
	auto& section_break_slots = selected_section.getBreakSlots();

	// TODO: SMART PICKING: when the violation is wrong break slot, pick one breakslot than swap it with non-break timeslot


	if (field == 0) {
		bool is_timeslot_1_at_start_or_end_of_schedule = false;
		bool is_timeslot_2_at_start_or_end_of_schedule = false;

		bool is_timeslot_1_break = false;
		bool is_timeslot_2_break = false;

		bool ignore_break_slots = false;

		bool is_consistent_duration = selected_section.isDynamicSubjectConsistentDuration();

		do {
			selected_timeslot_1 = selected_section.getRandomDynamicTimeslot();
			selected_timeslot_2 = selected_section.getRandomDynamicTimeslot();

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == timeslot_count - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == timeslot_count - 1;

			is_timeslot_1_break = section_break_slots.find(selected_timeslot_1) != section_break_slots.end();
			is_timeslot_2_break = section_break_slots.find(selected_timeslot_2) != section_break_slots.end();

			if (is_consistent_duration && (is_timeslot_1_break || is_timeslot_2_break)) {
				ignore_break_slots = true;
			} else {
				ignore_break_slots = false;
			}

		} while (selected_timeslot_1 == selected_timeslot_2 ||
		         (is_timeslot_1_at_start_or_end_of_schedule && is_timeslot_2_break) ||
		         (is_timeslot_2_at_start_or_end_of_schedule && is_timeslot_1_break) || ignore_break_slots);

		return {selected_timeslot_1, selected_timeslot_2};

	} else if (field == 1) {
		selected_timeslot_1 = getRandomInRange(timeslot_count - 1);

		do {
			selected_timeslot_1 = getRandomInRange(timeslot_count - 1);

		} while (selected_section.isInBreakSlots(selected_timeslot_1));

		selected_timeslot_2 = selected_timeslot_1;

		return {selected_timeslot_1, selected_timeslot_2};

	} else if (field == 2) {
		std::vector<Timeslot> timeslots;
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
	SectionID section_id = Timetable::s_random_section_id(randomizer_engine);

	// print("ff", getSectionById(section_id).getId());

	return getSectionById(section_id);

	// if (sections_with_conflicts.empty()) {
	// } else {
	// 	std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

	// 	int random_index = dis(randomizer_engine);

	// 	auto it = sections_with_conflicts.begin();
	// 	std::advance(it, random_index);

	// 	SectionID section_id = *it;

	// 	return getSectionById(section_id);
	// }
}

int Timetable::pickRandomField(Section& selected_section) {
	// return 1;llllll

	if (selected_section.getSegmentedTimeslot().empty()) {
		std::uniform_int_distribution<> dis(0, 1);

		return dis(randomizer_engine);
	} else {
		return Timetable::s_random_field(randomizer_engine);
	}
}

void Timetable::modify(Section& selected_section,
                       int choice,
                       std::pair<Timeslot, Timeslot> selected_timeslots,
                       std::unordered_set<TeacherID>& update_teachers,
                       std::unordered_set<SubjectID>& update_sections,
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

	Timeslot selected_timeslot_1 = selected_timeslots.first;
	Timeslot selected_timeslot_2 = selected_timeslots.second;
	auto& classes = selected_section.getClasses();
	auto itLow = classes.lower_bound(std::min(selected_timeslot_1, selected_timeslot_2));
	auto itUp = classes.upper_bound(std::max(selected_timeslot_1, selected_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	bool is_skipping_between = selected_section.isPairTimeslotDurationEqual(selected_timeslots);
	updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);
	if (choice == 0) {
		selected_section.swapClassesByTimeslot(selected_timeslot_1, selected_timeslot_2);
		selected_section.adjustBreakslots(itLow->first, itUpPrev->first);

		if (!selected_section.getSegmentedTimeslot().empty()) {
			selected_section.adjustSegmentedTimeslots(selected_timeslot_1, selected_timeslot_2);
		}
	} else if (choice == 1) {
		// TODO: AVOID FIXED TEACHER

		ScheduledDay randomScheduledDay = selected_section.getRandomClassTimeslotWorkingDays(selected_timeslot_1);
		SubjectID selected_timeslot_subject_id = selected_section.getClassTimeslotSubjectID(randomScheduledDay, selected_timeslot_1);

		if (randomScheduledDay == ScheduledDay::EVERYDAY) {
			// TODO: leave breakslots alone
			// FIXME: Bug for implementation of fixed teacher in the future
			if (selected_timeslot_subject_id == -1) {
				print("it shouldn't picked a breakslot");
				return;
			}
			// print(RED_BG, "yes");
			TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot_1);
			TeacherID new_teacher = eligibility_manager.getNewRandomTeacher(selected_timeslot_subject_id, old_teacher_id);

			// print("selected_section", selected_section.getId(), "x old teacher", old_teacher_id, "x new teacher", new_teacher);
			changeTeacher(selected_section, selected_timeslot_1, ScheduledDay::EVERYDAY, new_teacher, update_teachers);
		} else {
			std::vector<ScheduledDay> days_to_update;
			std::unordered_set<ScheduledDay> all_scheduled_days = selected_section.getAllScheduledDayOnClasstimeslot(selected_timeslot_1);

			for (const ScheduledDay day : all_scheduled_days) {
				SubjectID subject_id = selected_section.getClassTimeslotSubjectID(day, selected_timeslot_1);

				if (subject_id == selected_timeslot_subject_id) {
					days_to_update.push_back(day);
				}
			}

			for (const auto& day_to_update : days_to_update) {
				TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(day_to_update, selected_timeslot_1);
				TeacherID new_teacher = eligibility_manager.getNewRandomTeacher(selected_timeslot_subject_id, old_teacher_id);

				changeTeacher(selected_section, selected_timeslot_1, day_to_update, new_teacher, update_teachers);
			}
		}
	} else if (choice == 2) {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;
		ScheduledDay day_1, day_2;

		auto& section_timeslot_1 = classes[selected_timeslot_1];
		auto& section_timeslot_2 = classes[selected_timeslot_2];

		do {
			day_1 = selected_section.getRandomDynamicTimeslotDay(selected_timeslot_1);
			day_2 = selected_section.getRandomDynamicTimeslotDay(selected_timeslot_2);
		} while ((day_1 == day_2 && selected_timeslot_1 == selected_timeslot_2));

		auto it1 = section_timeslot_1.find(day_1);
		auto it2 = section_timeslot_2.find(day_2);

		if (it1 != section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			TeacherID teacher_id_1 = it1->second.teacher_id;
			TeacherID teacher_id_2 = it2->second.teacher_id;

			moveTeacherClassCountToNewDay(teacher_id_1, day_1, day_2);
			moveTeacherClassCountToNewDay(teacher_id_2, day_2, day_1);

			std::swap(it1->second, it2->second);
		} else if (it1 != section_timeslot_1.end() && it2 == section_timeslot_2.end()) {
			TeacherID teacher_id = it1->second.teacher_id;

			moveTeacherClassCountToNewDay(teacher_id, day_1, day_2);

			section_timeslot_2[day_2] = std::move(it1->second);
			section_timeslot_1.erase(it1);
		} else if (it1 == section_timeslot_1.end() && it2 != section_timeslot_2.end()) {
			TeacherID teacher_id = it2->second.teacher_id;

			moveTeacherClassCountToNewDay(teacher_id, day_2, day_1);

			section_timeslot_1[day_1] = std::move(it2->second);
			section_timeslot_2.erase(it2);
		}
	}

	updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
};