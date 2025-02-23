
#include "bit_utils.h"
#include "print.h"
#include "random_util.h"
#include "rotaryVector.h"
#include "schoolClass.h"
#include "timeManager.h"

using namespace std;

RotaryVector Timetable::s_rotary_timeslot;
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
void Timetable::setOffsetDuration(int offset_duration_) {
	offset_duration = offset_duration_;
}

int Timetable::s_teacher_break_threshold;
int Timetable::s_teacher_middle_time_point_grow_allowance_for_break_timeslot;
TimeDuration Timetable::s_default_class_duration;
TimeDuration Timetable::s_break_time_duration;
int Timetable::s_work_week;
int Timetable::s_total_section;
int Timetable::offset_duration;
std::unordered_set<SectionID> Timetable::s_sections_set;
std::unordered_set<TeacherID> Timetable::s_teachers_set;
std::uniform_int_distribution<SectionID> Timetable::s_random_section_id;
std::uniform_int_distribution<int8_t> Timetable::s_random_workDay;
std::uniform_int_distribution<int> Timetable::s_random_field;

void Timetable::reset() {
	Timetable::setBreakTimeDuration(0);
	Timetable::setWorkWeek(0);

	initializeRandomSectionDistribution(0, 0);
	initializeRandomWorkDayDistribution(0, 0);
	initializeRandomFieldDistribution(0, 0);
}

void Timetable::connectBuildings(BuildingID building_1, BuildingID building_2) {
	Building::connectBuildings(building_1, building_2);
}

void Timetable::initializeBuildingAdjacency(int32_t* building_adjacency) {
	for (int i = 0; building_adjacency[i] != -1; i++) {
		int16_t building_id_1;
		int16_t building_id_2;

		unpackInt16FromInt32(building_adjacency[i], building_id_1, building_id_2);

		connectBuildings(static_cast<BuildingID>(building_id_1), static_cast<BuildingID>(building_id_2));
	}
}

void Timetable::initializeBuildingConfiguration(int32_t* building_info) {
	std::vector<std::vector<int>> building_floor_room_counts;
	for (int i = 0; building_info[i] != -1; i++) {
		int16_t building_id_1;
		int16_t floor_room_counts;

		unpackInt16FromInt32(building_info[i], building_id_1, floor_room_counts);

		if (building_id_1 >= building_floor_room_counts.size()) {
			building_floor_room_counts.resize(building_id_1 + 1);
		}

		building_floor_room_counts[building_id_1].push_back(floor_room_counts);
	}

	for (int i = 0; i < building_floor_room_counts.size(); i++) {
		buildings.emplace(i, Building(i, building_floor_room_counts[i]));
	}
}

void Timetable::addEligibleTeacher(SubjectID subject_id, TeacherID teacher_id) {
	s_subject_eligibility_manager.addTeacher(subject_id, teacher_id);
};

void Timetable::addSection(SectionID section_id,
                           int num_break,
                           TimePoint start_time,
                           int total_timeslot,
                           int not_allowed_breakslot_gap,
                           bool is_dynamic_subject_consistent_duration,
                           Location location) {
	sections.emplace(section_id, Section(section_id, num_break, start_time, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration, location));
}

void Timetable::addTeacher(TeacherID teacher_id, TimeDuration max_week_work_load, TimeDuration min_week_work_load) {
	teachers.emplace(teacher_id, Teacher(teacher_id, max_week_work_load, min_week_work_load));
}

void Timetable::initializeRandomFieldDistribution(int min, int max) {
	s_random_field = std::uniform_int_distribution<int>(min, max);
}
void Timetable::initializeRandomWorkDayDistribution(int min, int max) {
	s_random_workDay = std::uniform_int_distribution<int8_t>(min, max);
}
void Timetable::initializeRandomSectionDistribution(int min, int max) {
	s_random_section_id = std::uniform_int_distribution<int>(min, max);
}
void Timetable::initializeSectionSet(int total_section) {
	std::unordered_set<SectionID> section_set;
	for (SectionID subject_id = 0; subject_id < total_section; subject_id++) {
		section_set.insert(subject_id);
	}

	Timetable::setSectionsSet(section_set);
}
void Timetable::initializeTeachersSet(int total_teacher) {
	std::unordered_set<TeacherID> teacher_set;
	for (TeacherID teacher_id = 0; teacher_id < total_teacher; teacher_id++) {
		teacher_set.insert(teacher_id);
	}

	Timetable::setTeachersSet(teacher_set);
}

void Timetable::initializeTeacherReservedSchedule(int32_t* teacher_reservation_config, int32_t* teacher_reservation_config_id) {
	std::unordered_map<int, ClassStartEnd> teacher_reserved_schedule;

	for (int i = 0; teacher_reservation_config[i] != -1; i++) {
		int start_time = static_cast<int>(teacher_reservation_config_id[i] >> 16);
		int end_time = static_cast<int>(teacher_reservation_config[i] & 0xFFFF);

		teacher_reserved_schedule[i] = ClassStartEnd{start_time, end_time};
	}

	int day_iter = Timetable::getWorkWeek();

	for (int i = 0; teacher_reservation_config_id[i] != -1; i++) {
		int teacher_id = static_cast<int>(teacher_reservation_config_id[i] >> 16);
		int reservation_config_id = static_cast<int>(teacher_reservation_config[i] & 0xFFFF);

		TimePoint start_time = teacher_reserved_schedule[reservation_config_id].start;
		TimePoint end_time = teacher_reserved_schedule[reservation_config_id].end;

		for (TimePoint time = start_time; time < end_time; time += 1) {  // FIXME: 1 ?? code smell
			getTeacherById(teacher_id).incrementUtilizedTime(day_iter, time, 3, -1);
		}

		day_iter -= 1;
		if (day_iter < 0) {
			day_iter = Timetable::getWorkWeek();
		}
	}
}

void Timetable::initializeSubjectConfigurations(int number_of_subject_configuration,
                                                int32_t* subject_configuration_subject_units,
                                                int32_t* subject_configuration_subject_duration,
                                                int32_t* subject_configuration_subject_fixed_timeslot,
                                                int32_t* subject_configuration_subject_fixed_day,
                                                int32_t* subject_configuration_subject_is_overlappable) {
	for (SubjectConfigurationID subject_configuration_id = 0; subject_configuration_id < number_of_subject_configuration; subject_configuration_id++) {
		SubjectID subject_id = static_cast<int>(subject_configuration_subject_units[subject_configuration_id] >> 16);
		int subject_units = static_cast<int>(subject_configuration_subject_units[subject_configuration_id] & 0xFFFF);
		TimeDuration subject_duration = static_cast<int>(subject_configuration_subject_duration[subject_configuration_id] & 0xFFFF);
		Timeslot subject_fixed_timeslot = static_cast<int>(subject_configuration_subject_fixed_timeslot[subject_configuration_id] & 0xFFFF);
		ScheduledDay subject_fixed_days = static_cast<ScheduledDay>(subject_configuration_subject_fixed_day[subject_configuration_id] & 0xFFFF);
		bool is_overlappable = static_cast<bool>(subject_configuration_subject_is_overlappable[subject_configuration_id] & 0xFFFF);

		print("subject_configuration_id", subject_configuration_id, subject_id, subject_duration, subject_units, subject_fixed_timeslot, static_cast<int>(subject_fixed_days));

		addSubjectConfiguration(subject_configuration_id, subject_id, subject_duration, subject_units, subject_fixed_timeslot, subject_fixed_days, is_overlappable);
	}
}

void Timetable::initializeSections(int number_of_section,
                                   int32_t* section_configuration,
                                   int32_t* section_start,
                                   int32_t* section_location) {
	for (SectionID i = 0; i < number_of_section; i++) {
		SectionID section_id = i;
		int num_break = static_cast<int>((section_configuration[i] >> 24) & 0xFF);
		int total_timeslot = static_cast<int>((section_configuration[i] >> 16) & 0xFF);
		int not_allowed_breakslot_gap = static_cast<int>((section_configuration[i] >> 8) & 0xFF);
		bool is_dynamic_subject_consistent_duration = static_cast<bool>(section_configuration[i] & 0xFF);
		TimePoint start = static_cast<int>(section_start[i]);

		Location location = {0, 0, 0};
		unpackThreeSignedIntsFromInt32(section_location[i], location.building_id, location.floor, location.room);

		print("section configuration",
		      "section_id", section_id,
		      "num_break", num_break,
		      "total_timeslot", total_timeslot,
		      "not_allowed_breakslot_gap", not_allowed_breakslot_gap,
		      "is_dynamic_subject_consistent_duration", is_dynamic_subject_consistent_duration,
		      "start", start);

		addSection(section_id, num_break, start, total_timeslot, not_allowed_breakslot_gap, is_dynamic_subject_consistent_duration, location);
	}
}

void Timetable::initializeSectionFixedSubjectTeacher(int32_t* subject_fixed_teacher_section, int32_t* subject_fixed_teacher) {
	size_t count = 0;
	while (subject_fixed_teacher_section[count] != -1) {
		SectionID section_id = static_cast<int>(subject_fixed_teacher_section[count]);
		SubjectID subject_id = static_cast<int>(subject_fixed_teacher[count] >> 16);
		TeacherID teacher_id = static_cast<int>(subject_fixed_teacher[count] & 0xFFFF);

		// print("section_id", section_id, "subject_id", subject_id, "teacher_id", teacher_id);

		getSectionById(section_id).addSubjectFixedTeacher(subject_id, teacher_id);

		++count;
	}
}

void Timetable::initializeTeachers(int number_of_teacher,
                                   int32_t* teacher_week_load_config) {
	for (TeacherID teacher_id = 0; teacher_id < number_of_teacher; teacher_id++) {
		TimeDuration max_weekly_load = static_cast<int>(teacher_week_load_config[teacher_id] >> 16);
		TimeDuration min_weekly_load = static_cast<int>(teacher_week_load_config[teacher_id] & 0xFFFF);

		addTeacher(teacher_id, max_weekly_load, min_weekly_load);
	}
}

void Timetable::initializeTeacherSubjectsAndQueue(int teacher_subjects_length, int32_t* teacher_subjects, int32_t* teacher_week_load_config) {
	for (int i = 0; i < teacher_subjects_length; i++) {
		TeacherID teacher_id;
		SubjectID subject_id;
		teacher_id = static_cast<int>(teacher_subjects[i] >> 16);
		subject_id = static_cast<int>(teacher_subjects[i] & 0xFFFF);

		TimeDuration max_weekly_load = static_cast<int>(teacher_week_load_config[teacher_id] >> 16);

		Timetable::addEligibleTeacher(subject_id, teacher_id);

		Timetable::s_subject_teacher_queue.addTeacher(subject_id, teacher_id, max_weekly_load);
	}
}

void Timetable::initializeSectionSubjects(int total_section_subjects, int32_t* section_subject_configuration) {
	for (int i = 0; i < total_section_subjects; i++) {
		SectionID section_id;
		SubjectConfigurationID subject_configuration_id;

		section_id = static_cast<int>(section_subject_configuration[i] >> 16);
		subject_configuration_id = static_cast<int>(section_subject_configuration[i] & 0xFFFF);

		// print("section_id", section_id, "subject_configuration_id", subject_configuration_id);

		addSubjectToSection(section_id, subject_configuration_id);
	}
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

Building& Timetable::getBuildingById(BuildingID building_id) {
	auto it = buildings.find(building_id);
	if (it != buildings.end()) {
		return it->second;
	} else {
		throw std::runtime_error("Building ID not found");
	}
}

int Timetable::getTeacherBreakThreshold() { return s_teacher_break_threshold; }
int Timetable::getTeacherMiddleTimePointGrowAllowanceForBreakTimeslot() { return s_teacher_middle_time_point_grow_allowance_for_break_timeslot; }
TimeDuration Timetable::getDefaultClassDuration() { return s_default_class_duration; }
TimeDuration Timetable::getBreakTimeDuration() { return s_break_time_duration; }
int Timetable::getWorkWeek() { return s_work_week; }
int Timetable::getTotalSection() { return s_total_section; }
int Timetable::getOffsetDuration() { return offset_duration; }

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
	if (teacher_id == -1) return;

	getTeacherById(teacher_id).decrementClassCount(static_cast<ScheduledDay>(from_day));
	getTeacherById(teacher_id).incrementClassCount(static_cast<ScheduledDay>(to_day));
}

void Timetable::addSubjectConfiguration(SubjectConfigurationID id, SubjectID subject_id, TimeDuration duration, int is_consistent_everyday, Timeslot fixed_timeslot, ScheduledDay fixed_days, bool is_overlappable) {
	auto subject_configuration = std::make_shared<SubjectConfiguration>(id, subject_id, duration, is_consistent_everyday, fixed_timeslot, fixed_days, is_overlappable);
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

	SchoolClass school_class = selected_section.getSchoolClass(selected_timeslot, day);
	school_class.teacher_id = new_teacher_id;

	// std::cout << "new teacher id " << new_teacher_id << "\n";

	// SchoolClass updated_school_class = SchoolClass{subject_id, new_teacher_id};
	TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(day, selected_timeslot);

	selected_section.updateClassTimeslotDay(day, selected_timeslot, school_class);
}

void Timetable::updateTeachersAndSections(
    std::unordered_set<TeacherID>& update_teachers,
    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itLow,
    std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>::iterator itUp,
    bool is_returning_teachers,
    bool is_skipping_between,
    Section& selected_section,
    bool is_reset) {
	// print("updateTeachersAndSections", is_reset);

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
			TimeDuration duration = day_zero->second.duration;
			Timeslot timeslot = day_zero->second.fixed_timeslot;
			bool is_overlappable = day_zero->second.is_overlappable;

			int class_type = is_overlappable ? 1 : 2;

			// print("duration", subject, day_zero->second.teacher_id, timeslot, duration);

			// TimeDuration duration = (subject == -1) ? Timetable::getBreakTimeDuration() : selected_section.getSubject(subject).getDuration();
			TeacherID teacher_id = day_zero->second.teacher_id;

			if (teacher_id == -1) {
				continue;
			}

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
							if (teacher.decrementUtilizedTime(i, start + time_point, class_type) <= 0) {
								teacher.removeUtilizedTimePoint(i, start + time_point);

								if (teacher.isUtilizedTimesDayEmpty(i)) {
									teacher.removeUtilizedTimeDay(i);
								}
							};
						} else {
							teacher.incrementUtilizedTime(i, start + time_point, class_type, selected_section.getId());
						}
					}
				}
			};
		} else {
			TimeDuration max_duration = 0;

			for (const auto& day : it->second) {
				SubjectID subject = day.second.subject_id;
				TimeDuration duration = day.second.duration;
				bool is_overlappable = day.second.is_overlappable;

				max_duration = std::max(max_duration, duration);
				TeacherID teacher_id = day.second.teacher_id;

				if (teacher_id == -1) {
					continue;
				}

				Teacher& teacher = getTeacherById(teacher_id);

				int class_type = is_overlappable ? 1 : 2;

				if (is_returning_teachers) {
					update_teachers.insert(teacher_id);
				}

				for (TimePoint time_point = 0; time_point < duration; ++time_point) {
					if (is_reset) {
						if (teacher.decrementUtilizedTime(static_cast<int>(day.first), start + time_point, class_type) <= 0) {
							teacher.removeUtilizedTimePoint(static_cast<int>(day.first), start + time_point);

							if (teacher.isUtilizedTimesDayEmpty(static_cast<int>(day.first))) {
								teacher.removeUtilizedTimeDay(static_cast<int>(day.first));
							}
						}
					} else {
						teacher.incrementUtilizedTime(static_cast<int>(day.first), start + time_point, class_type, selected_section.getId());
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
		// print("timeslot", timeslot);

		if (day_school_class.count(ScheduledDay::EVERYDAY)) {
			const SchoolClass& schoolClass = day_school_class.at(ScheduledDay::EVERYDAY);
			SubjectID subject_id = schoolClass.subject_id;

			TimeDuration duration = schoolClass.duration;
			// TimeDuration duration = (subject_id == -1) ? Timetable::getBreakTimeDuration() : section.getSubject(subject_id).getDuration();

			section.setTimeRange(timeslot, ClassStartEnd{class_start, class_start + duration});
			class_start += duration;

		} else {
			TimeDuration max_duration = 0;

			for (int i = 1; i <= Timetable::getWorkWeek(); ++i) {
				if (day_school_class.count(static_cast<ScheduledDay>(i))) {
					SubjectID subject_id = day_school_class.at(static_cast<ScheduledDay>(i)).subject_id;

					TimeDuration subject_duration = day_school_class.at(static_cast<ScheduledDay>(i)).duration;
					// TimeDuration subject_duration = section.getSubject(subject_id).getDuration();
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

	// std::cout << "total timeslot " << total_timeslot << std::endl;
	// std::cout << "num_breaks " << num_breaks << std::endl;
	// std::cout << "gap " << gap << std::endl;
	// std::cout << "end gap " << (num_breaks == 1 ? gap + 1 : gap) << std::endl;

	// gap = 1;

	std::vector<std::vector<Timeslot>>
	    possible_breaks = getAllBreaksCombination(
	        total_timeslot,
	        num_breaks,
	        gap,
	        num_breaks == 1 ? gap + 1 : gap);  // FIXME: temporary fix. make this dynamic

	// FIXME: temporary fix might be code smell
	// Calculate the reverse index based on the current try count
	// std::cout << "possible breaks size " << possible_breaks.size() << std::endl;
	// for (size_t i = 0; i < possible_breaks.size(); ++i) {
	// 	std::cout << "possible break " << i << ": ";
	// 	for (size_t j = 0; j < possible_breaks[i].size(); ++j) {
	// 		std::cout << possible_breaks[i][j] << " ";
	// 	}
	// 	std::cout << std::endl;
	// }

	int index = (possible_breaks.size() - (s_rotary_timeslot.getTotalTry() % possible_breaks.size())) % possible_breaks.size();

	// int index = s_rotary_timeslot.getTotalTry() % possible_breaks.size();
	// std::cout << "index " << index << std::endl;

	// std::cout << "possible breaks end " << std::endl;

	return possible_breaks[index];
	// return {3};
}

void Timetable::setupTimeslots(int total_timeslot, std::deque<Timeslot>& timeslot_keys, std::map<Timeslot, std::vector<ScheduledDay>>& timeslots, const std::vector<Timeslot>& skips) const {
	s_rotary_timeslot.adjustPosition(total_timeslot);
	std::vector<Timeslot> timeslot = s_rotary_timeslot.getVector(total_timeslot, skips);
	timeslot_keys.insert(timeslot_keys.end(), timeslot.begin(), timeslot.end());
	s_rotary_timeslot.incrementShift();

	// std::cout << "list of timeslot rotary" << std::endl;
	// for (size_t i = 0; i < timeslot.size(); ++i) {
	// 	std::cout << "e " << timeslot[i] << " ";
	// }
	// std::cout << "end of timeslot " << std::endl;
	for (size_t i = 0; i < timeslot_keys.size(); ++i) {
		for (int j = 1; j <= Timetable::getWorkWeek(); ++j) {
			timeslots[timeslot_keys[i]].push_back(static_cast<ScheduledDay>(j));
		}
	}
}

TeacherID Timetable::getRandomInitialTeacherInQueue(Section& section, SubjectID subject_id, TimeDuration class_duration) const {
	TeacherID fixed_teacher_id = section.getSubjectFixedTeacher(subject_id);
	if (fixed_teacher_id == -1) {
		TeacherID queued_teacher = Timetable::s_subject_teacher_queue.getTeacher(subject_id, class_duration);
		TeacherID selected_teacher = queued_teacher != -1 ? queued_teacher : getRandomTeacher(subject_id);
		return selected_teacher;
		// return getRandomTeacher(subject_id);
	}

	return fixed_teacher_id;
}

void Timetable::initializeClassBlock(Section& section,
                                     std::vector<SchoolClass>& with_fixed_full_week_day_subjects,
                                     std::vector<SchoolClass>& with_fixed_special_unit_subjects,
                                     std::vector<SchoolClass>& dynamic_full_week_day_subjects,
                                     std::vector<SchoolClass>& dynamic_special_unit_subjects) {
	const auto& subject_configurations = section.getSubjectConfigurations();

	int offset_duration = Timetable::getOffsetDuration();

	for (const auto& subject_configuration : subject_configurations) {
		SubjectConfigurationID subject_configuration_id = subject_configuration->getSubjectConfigurationId();
		SubjectID subject_id = subject_configuration->getSubjectId();
		TimeDuration duration = subject_configuration->getDuration();
		bool is_consistent_everyday = subject_configuration->isConsistentEveryday();
		Timeslot fixed_timeslot = subject_configuration->getFixedTimeslot();
		ScheduledDay fixed_days = subject_configuration->getFixedDay();
		bool is_overlappable = subject_configuration->isOverlappable();

		TeacherID teacher_id;
		if (is_overlappable) {
			teacher_id = getRandomInitialTeacherInQueue(section, subject_id, is_consistent_everyday ? (duration + offset_duration) * Timetable::getWorkWeek() : duration + offset_duration);
		} else {
			teacher_id = Timetable::getRandomTeacher(subject_id);
		}

		SchoolClass school_class = SchoolClass{subject_configuration_id, subject_id, teacher_id, duration, is_consistent_everyday, fixed_timeslot, fixed_days, is_overlappable};

		if (is_consistent_everyday == 1) {
			if (fixed_timeslot == 0) {
				dynamic_full_week_day_subjects.push_back(school_class);
			} else {
				with_fixed_full_week_day_subjects.push_back(school_class);
			}
		} else {
			if (fixed_timeslot == 0 && fixed_days == ScheduledDay::ANYDAY) {
				dynamic_special_unit_subjects.push_back(school_class);
			} else {
				if (fixed_timeslot != 0 && fixed_days != ScheduledDay::ANYDAY) {
					with_fixed_special_unit_subjects.push_back(school_class);
					std::rotate(with_fixed_special_unit_subjects.rbegin(), with_fixed_special_unit_subjects.rbegin() + 1, with_fixed_special_unit_subjects.rend());
				} else {
					with_fixed_special_unit_subjects.push_back(school_class);
				}
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
		std::deque<Timeslot> timeslot_keys;
		std::map<Timeslot, std::vector<ScheduledDay>> timeslots;
		setupTimeslots(section.getTotalTimeslot(), timeslot_keys, timeslots, std::vector<Timeslot>());

		std::vector<SchoolClass> with_fixed_full_week_day_subjects;
		std::vector<SchoolClass> with_fixed_special_unit_subjects;
		std::vector<SchoolClass> dynamic_full_week_day_subjects;
		std::vector<SchoolClass> dynamic_special_unit_subjects;
		initializeClassBlock(section, with_fixed_full_week_day_subjects, with_fixed_special_unit_subjects, dynamic_full_week_day_subjects, dynamic_special_unit_subjects);

		for (auto& school_class : with_fixed_special_unit_subjects) {
			TeacherID selected_teacher = school_class.teacher_id;
			Timeslot school_class_timeslot = school_class.fixed_timeslot;
			ScheduledDay school_class_day = school_class.fixed_days;

			if (selected_teacher != -1) {
				section.addUtilizedTeacher(selected_teacher);
			}

			print("with_fixed_special_unit_subjects timeslot", school_class_timeslot);

			Timeslot timeslot_key = school_class_timeslot - 1;

			// if (timeslot_key == 0) {
			// 	auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
			// 	                       [&timeslots](int key) { return timeslots[key].size() > 0; });

			// 	if (it == timeslot_keys.end()) {
			// 		print("no more timeslots");
			// 		break;
			// 	}

			// 	timeslot_key = *it;
			// }
			print("timeslot_key", timeslot_key);

			ScheduledDay day = school_class_day;
			if (school_class_day == ScheduledDay::ANYDAY) {
				std::vector<ScheduledDay>& days = timeslots[timeslot_key];
				std::uniform_int_distribution<int> dis_work_day(0, days.size() - 1);
				day = days[dis_work_day(randomizer_engine)];
				section.addDynamicTimeSlotDay(timeslot_key, static_cast<ScheduledDay>(day));
			}

			school_class.fixed_days = day;

			section.addClass(timeslot_key, static_cast<ScheduledDay>(day), school_class);

			if (selected_teacher != -1) {
				getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
			}

			section.addSegmentedTimeSlot(timeslot_key);

			timeslots[timeslot_key].erase(std::remove(timeslots[timeslot_key].begin(), timeslots[timeslot_key].end(), day), timeslots[timeslot_key].end());
			if (timeslots[timeslot_key].size() == 0) {
				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
				timeslots.erase(timeslot_key);
			}
		}

		for (const auto& school_class : with_fixed_full_week_day_subjects) {
			TeacherID selected_teacher = school_class.teacher_id;

			if (selected_teacher == -1) {
				section.addUtilizedTeacher(selected_teacher);

				for (int day = 1; day <= Timetable::getWorkWeek(); ++day) {
					getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
				}
			}

			print("with_fixed_full_week_day_subjects timeslot", school_class.fixed_timeslot);

			Timeslot timeslot_key = school_class.fixed_timeslot - 1;

			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

			section.addClass(timeslot_key, ScheduledDay::EVERYDAY, school_class);

			timeslots.erase(timeslot_key);
		}

		// print("section", section_id);
		std::vector<Timeslot> breaks = getBreaks(section);

		auto first_timeslot_key = timeslot_keys.front();

		if (std::find(breaks.begin(), breaks.end(), first_timeslot_key) != breaks.end()) {
			if (!timeslot_keys.empty()) {
				int last = timeslot_keys.back();  // Store the last element
				timeslot_keys.pop_back();         // Remove the last element
				timeslot_keys.push_front(last);   // Insert it at the front
			}

			s_rotary_timeslot.incrementShift();
		}

		// breaks = {2};
		// printContainer(breaks);

		for (Timeslot timeslot : breaks) {
			Timeslot break_slot = timeslot;

			auto available = std::find(timeslot_keys.begin(), timeslot_keys.end(), break_slot) != timeslot_keys.end();

			if (!available) {
				// find random that is empty throughout the week
				auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
				                       [&timeslots](int key) { return timeslots[key].size() == 5; });

				if (it == timeslot_keys.end()) {
					print("no more timeslots");
					break;
				}

				break_slot = *it;
			}

			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), break_slot), timeslot_keys.end());
			timeslots.erase(break_slot);

			section.assignBreak(break_slot, Timetable::getBreakTimeDuration(), 0, ScheduledDay::EVERYDAY);
			section.addDynamicTimeSlot(break_slot);
		}

		for (const auto& school_class : dynamic_full_week_day_subjects) {
			TeacherID selected_teacher = school_class.teacher_id;

			if (selected_teacher != -1) {
				section.addUtilizedTeacher(selected_teacher);

				for (int day = 1; day <= Timetable::getWorkWeek(); ++day) {
					getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
				}
			}
			auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
			                       [&timeslots](int key) { return timeslots[key].size() == 5; });

			if (it == timeslot_keys.end()) {
				print("no more timeslots");
				break;
			}

			Timeslot timeslot_key = *it;

			timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());

			section.addClass(timeslot_key, ScheduledDay::EVERYDAY, school_class);

			section.addDynamicTimeSlot(timeslot_key);

			timeslots.erase(timeslot_key);
		}

		for (auto& school_class : dynamic_special_unit_subjects) {
			TeacherID selected_teacher = school_class.teacher_id;
			Timeslot school_class_timeslot = school_class.fixed_timeslot;
			ScheduledDay school_class_day = school_class.fixed_days;

			if (selected_teacher != -1) {
				section.addUtilizedTeacher(selected_teacher);
			}

			auto it = std::find_if(timeslot_keys.begin(), timeslot_keys.end(),
			                       [&timeslots](int key) { return timeslots[key].size() > 0; });

			if (it == timeslot_keys.end()) {
				print("no more timeslots");
				break;
			}

			Timeslot timeslot_key = timeslot_key = *it;

			std::vector<ScheduledDay>& days = timeslots[timeslot_key];
			std::uniform_int_distribution<int> dis_work_day(0, days.size() - 1);
			ScheduledDay day = days[dis_work_day(randomizer_engine)];
			section.addDynamicTimeSlotDay(timeslot_key, static_cast<ScheduledDay>(day));

			school_class.fixed_days = day;

			section.addClass(timeslot_key, static_cast<ScheduledDay>(day), school_class);

			if (selected_teacher != -1) {
				getTeacherById(selected_teacher).incrementClassCount(static_cast<ScheduledDay>(day));
			}

			section.addSegmentedTimeSlot(timeslot_key);

			timeslots[timeslot_key].erase(std::remove(timeslots[timeslot_key].begin(), timeslots[timeslot_key].end(), day), timeslots[timeslot_key].end());
			if (timeslots[timeslot_key].size() == 0) {
				timeslot_keys.erase(std::remove(timeslot_keys.begin(), timeslot_keys.end(), timeslot_key), timeslot_keys.end());
				timeslots.erase(timeslot_key);
			}
		}

		// FIXME: segmented timeslot with all of its subject are dynamic timeslot should be included on dyanmic timeslot container

		// print("section id ", section.getId());
		for (const auto& [timeslot, days] : timeslots) {
			for (const auto& day : days) {
				// print("initialized day", static_cast<int>(day));
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

	// std::cout << "field: " << field << std::endl;

	if (field == 0) {
		bool is_timeslot_1_at_start_or_end_of_schedule = false;
		bool is_timeslot_2_at_start_or_end_of_schedule = false;

		bool is_timeslot_1_break = false;
		bool is_timeslot_2_break = false;

		bool ignore_break_slots = false;

		// bool is_consistent_duration = selected_section.isDynamicSubjectConsistentDuration();

		do {
			selected_timeslot_1 = selected_section.getRandomDynamicTimeslot();
			selected_timeslot_2 = selected_section.getRandomDynamicTimeslot();

			is_timeslot_1_at_start_or_end_of_schedule = selected_timeslot_1 == 0 || selected_timeslot_1 == timeslot_count - 1;
			is_timeslot_2_at_start_or_end_of_schedule = selected_timeslot_2 == 0 || selected_timeslot_2 == timeslot_count - 1;

			is_timeslot_1_break = section_break_slots.find(selected_timeslot_1) != section_break_slots.end();
			is_timeslot_2_break = section_break_slots.find(selected_timeslot_2) != section_break_slots.end();

			// if (is_consistent_duration && (is_timeslot_1_break || is_timeslot_2_break)) {
			if ((is_timeslot_1_break || is_timeslot_2_break)) {
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
		for (const auto& entry : selected_section.getDynamicSegmentedTimeslot()) {
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
	if (sections_with_conflicts.empty()) {
	} else {
		std::uniform_int_distribution<> dis(0, sections_with_conflicts.size() - 1);

		int random_index = dis(randomizer_engine);

		auto it = sections_with_conflicts.begin();
		std::advance(it, random_index);

		SectionID section_id = *it;

		return getSectionById(section_id);
	}
}

int Timetable::pickRandomField(Section& selected_section) {
	// return 1;

	if (selected_section.getDynamicSegmentedTimeslot().empty()) {
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

	Timeslot selected_timeslot_1 = selected_timeslots.first;
	Timeslot selected_timeslot_2 = selected_timeslots.second;

	// print("choice: ", choice);
	// print("section", selected_section.getId(), "selected_timeslot_1", selected_timeslot_1, "selected_timeslot_2", selected_timeslot_2);

	auto& classes = selected_section.getClasses();
	auto itLow = classes.lower_bound(std::min(selected_timeslot_1, selected_timeslot_2));
	auto itUp = classes.upper_bound(std::max(selected_timeslot_1, selected_timeslot_2));
	auto itUpPrev = std::prev(itUp);

	bool is_skipping_between = selected_section.isPairTimeslotDurationEqual(selected_timeslots);

	switch (choice) {
	case 0: {
		updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);
		selected_section.swapClassesByTimeslot(selected_timeslot_1, selected_timeslot_2);
		selected_section.adjustBreakslots(itLow->first, itUpPrev->first);

		if (!selected_section.getDynamicSegmentedTimeslot().empty()) {
			selected_section.adjustSegmentedTimeslots(selected_timeslot_1, selected_timeslot_2);
		}

		updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);

	}

	break;
	case 1: {
		ScheduledDay randomScheduledDay = selected_section.getRandomClassTimeslotWorkingDays(selected_timeslot_1);
		SubjectID selected_timeslot_subject_id = selected_section.getClassTimeslotSubjectID(randomScheduledDay, selected_timeslot_1);
		TeacherID selected_timeslot_teacher_id = selected_section.getClassTimeslotTeacherID(randomScheduledDay, selected_timeslot_1);

		if (selected_timeslot_subject_id == -1 || selected_timeslot_teacher_id == -1) {
			print("can't change teacher with no subject or teacher");
			break;
		}

		if (selected_section.getSubjectFixedTeacher(selected_timeslot_subject_id) == selected_timeslot_teacher_id) {
			break;
		}

		updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);

		if (randomScheduledDay == ScheduledDay::EVERYDAY) {
			// print(RED_BG, "yes");
			TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(ScheduledDay::EVERYDAY, selected_timeslot_1);
			TeacherID new_teacher = eligibility_manager.getNewRandomTeacher(selected_timeslot_subject_id, old_teacher_id);

			// print("selected_section", selected_section.getId(), "x old teacher", old_teacher_id, "x new teacher", new_teacher);

			changeTeacher(selected_section, selected_timeslot_1, ScheduledDay::EVERYDAY, new_teacher, update_teachers);
		} else {
			TeacherID old_teacher_id = selected_section.getClassTimeslotTeacherID(randomScheduledDay, selected_timeslot_1);  // pick only one of the scheduled days because they have the same teacher
			TeacherID new_teacher = eligibility_manager.getNewRandomTeacher(selected_timeslot_subject_id, old_teacher_id);

			std::unordered_map<Timeslot, std::vector<ScheduledDay>> all_segmented_class;
			std::unordered_set<Timeslot> all_segmented_timeslot = selected_section.getDynamicSegmentedTimeslot();

			for (const int segmented_timeslot : all_segmented_timeslot) {
				std::unordered_set<ScheduledDay> all_scheduled_days = selected_section.getAllScheduledDayOnClasstimeslot(segmented_timeslot);

				for (const ScheduledDay day : all_scheduled_days) {
					SubjectID subject_id = selected_section.getClassTimeslotSubjectID(day, segmented_timeslot);

					if (subject_id == selected_timeslot_subject_id) {
						all_segmented_class[segmented_timeslot].push_back(day);
					}
				}
			}

			for (const auto& [segmented_timeslot, days_to_update] : all_segmented_class) {
				for (const auto& day_to_update : days_to_update) {
					changeTeacher(selected_section, segmented_timeslot, day_to_update, new_teacher, update_teachers);
				}
			}
		}

		updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
	}

	break;
	case 2: {
		// std::cout << " : ( " << random_section << " " << random_timeslot_1 << " " << random_timeslot_2 << std::endl;

		updateTeachersAndSections(update_teachers, itLow, itUp, false, is_skipping_between, selected_section, true);

		ScheduledDay day_1, day_2;

		auto& section_timeslot_1 = classes[selected_timeslot_1];
		auto& section_timeslot_2 = classes[selected_timeslot_2];

		do {
			day_1 = selected_section.getRandomDynamicTimeslotDay(selected_timeslot_1);
			day_2 = selected_section.getRandomDynamicTimeslotDay(selected_timeslot_2);

			// print("fff");

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

		updateTeachersAndSections(update_teachers, itLow, itUp, true, is_skipping_between, selected_section, false);
	}

	break;

	default:
		print("unreachable");
		break;
	}

	// std::cout << "u t on modify: " << update_teachers.size() << std::endl;
	// for (const int& value : update_teachers) {
	// 	std::cout << value << " ";
	// }

	// std::cout << "after modify classes: " << std::endl;
	// for (auto& timeslot : classes) {
	// 	for (auto& day : timeslot.second) {
	// 		print(day.second.subject_id);
	// 		print(day.second.teacher_id);
	// 	}
	// }
	// std::cout << "after emd" << std::endl;
};