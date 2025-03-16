#include "section.h"

#include "print.h"
#include "random_util.h"

int Section::total_section;

void Section::addSubject(const std::shared_ptr<SubjectConfiguration>& subject_configuration_) {
	subject_configurations.push_back(subject_configuration_);
}

bool Section::isDynamicSubjectConsistentDuration() const {
	return is_dynamic_subject_consistent_duration;
}

SubjectID Section::getClassTimeslotSubjectID(ScheduledDay day, Timeslot timeslot) const {
	auto& classTimeslot = classes.find(timeslot)->second.find(day)->second;
	return classTimeslot.subject_id;
}

TeacherID Section::getClassTimeslotTeacherID(ScheduledDay day, Timeslot timeslot) const {
	auto& classTimeslot = classes.find(timeslot)->second.find(day)->second;
	return classTimeslot.teacher_id;
}

SchoolClass Section::getSchoolClass(Timeslot timeslot, ScheduledDay day) const {
	auto timeslot_it = classes.find(timeslot);
	if (timeslot_it == classes.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
	}

	auto day_it = timeslot_it->second.find(day);
	if (day_it == timeslot_it->second.end()) {
		print("cannot find day", static_cast<int>(day));
		throw std::runtime_error("Class day not found");
	}

	return day_it->second;
}

void Section::assignBreak(Timeslot break_slot, TimeDuration break_duration, Timeslot fixed_timeslot, ScheduledDay day) {
	addClass(break_slot, ScheduledDay::EVERYDAY, SchoolClass{-1, -1, -1, break_duration, true, fixed_timeslot, day});
	timeslot_manager.addBreakSlot(break_slot);
}

void Section::adjustBreakslots(Timeslot timeslot_1, Timeslot timeslot_2) {
	if (timeslot_manager.isInBreakSlots(timeslot_1) && !timeslot_manager.isInBreakSlots(timeslot_2)) {
		timeslot_manager.removeBreakSlot(timeslot_1);
		timeslot_manager.addBreakSlot(timeslot_2);
	} else if (timeslot_manager.isInBreakSlots(timeslot_2) && !timeslot_manager.isInBreakSlots(timeslot_1)) {
		timeslot_manager.removeBreakSlot(timeslot_2);
		timeslot_manager.addBreakSlot(timeslot_1);
	}
}

void Section::adjustSegmentedTimeslots(Timeslot timeslot_1, Timeslot timeslot_2) {
	if (timeslot_manager.isInSegmentedTimeslot(timeslot_1) && !timeslot_manager.isInSegmentedTimeslot(timeslot_2)) {
		timeslot_manager.removeSegmentedTimeSlot(timeslot_1);
		timeslot_manager.addSegmentedTimeSlot(timeslot_2);
	} else if (timeslot_manager.isInSegmentedTimeslot(timeslot_2) && !timeslot_manager.isInSegmentedTimeslot(timeslot_1)) {
		timeslot_manager.removeSegmentedTimeSlot(timeslot_2);
		timeslot_manager.addSegmentedTimeSlot(timeslot_1);
	}
}

void Section::swapClassesByTimeslot(Timeslot timeslot_1, Timeslot timeslot_2) {
	if (classes.find(timeslot_1) == classes.end() || classes.find(timeslot_2) == classes.end()) {
		print("cannot find timeslot", timeslot_1, timeslot_2);
		throw std::runtime_error("Class timeslot not found");
	};

	std::swap(classes[timeslot_1], classes[timeslot_2]);
}

void Section::swapClassesByDay(Timeslot timeslot_1, Timeslot timeslot_2, ScheduledDay day_1, ScheduledDay day_2) {
	if (classes.find(timeslot_1) == classes.end() || classes.find(timeslot_2) == classes.end()) {
		print("cannot find timeslot", timeslot_1, timeslot_2);
		throw std::runtime_error("Class timeslot not found");
	}

	if (classes[timeslot_1].find(day_1) == classes[timeslot_1].end() || classes[timeslot_2].find(day_2) == classes[timeslot_2].end()) {
		print("cannot find day", static_cast<int>(day_1), static_cast<int>(day_2));
		throw std::runtime_error("Class day not found");
	}

	std::swap(classes[timeslot_1][day_1], classes[timeslot_2][day_2]);
}

ScheduledDay Section::getRandomClassTimeslotWorkingDays(Timeslot timeslot) const {
	if (classes.find(timeslot) == classes.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
		// return ScheduledDay::EVERYDAY;
	};

	std::uniform_int_distribution<>
	    dis_work_day(0, classes.find(timeslot)->second.size() - 1);

	auto it = classes.find(timeslot)->second.begin();
	std::advance(it, dis_work_day(randomizer_engine));

	return it->first;
}

ScheduledDay Section::getRandomDynamicTimeslotDay(Timeslot timeslot) {
	return timeslot_manager.getRandomDynamicTimeslotDay(timeslot);
}

std::unordered_set<ScheduledDay> Section::getAllScheduledDayOnClasstimeslot(Timeslot timeslot) const {
	if (classes.find(timeslot) == classes.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
	};

	// does this only include the day that has class

	std::unordered_set<ScheduledDay> result;
	for (auto& classTimeslot : classes.find(timeslot)->second) {
		result.insert(classTimeslot.first);
	}

	return result;
}
Timeslot Section::getRandomDynamicTimeslot() const {
	return timeslot_manager.getRandomDynamicTimeslot();
}
void Section::updateClassTimeslotDay(
    ScheduledDay day,
    Timeslot timeslot,
    SchoolClass& school_class) {
	classes[timeslot][day] = school_class;

	// std::cout << "updateClassTimeslotDay\n";
	// for (auto& classTimeslot : classes.find(timeslot)->second) {
	// 	std::cout << classTimeslot.second.subject_id << "\n";
	// 	std::cout << classTimeslot.second.teacher_id << "\n";
	// }
	// std::cout << "e n d updateClassTimeslotDay\n";
}

void Section::setViolation(bool violation) {
	has_violation = violation;
}

void Section::setTotalDuration(TimeDuration total_duration_) {
	total_duration = total_duration_;
}

SectionID Section::getId() const {
	return id;
}

const std::vector<std::shared_ptr<SubjectConfiguration>>& Section::getSubjectConfigurations() const {
	return subject_configurations;
}

std::unordered_set<ScheduledDay> Section::getClassTimeslotScheduledDay(Timeslot timeslot) const {
	if (classes.find(timeslot) == classes.end()) {
		print("cannot find timeslot", timeslot);
		throw std::runtime_error("Class timeslot not found");
	};

	std::unordered_set<ScheduledDay> scheduled_days;
	for (auto& classTimeslot : classes.find(timeslot)->second) {
		scheduled_days.insert(classTimeslot.first);
	}

	return scheduled_days;
}

void Section::addSubjectFixedTeacher(SubjectID subject_id, TeacherID teacher_id) {
	subject_fixed_teacher[subject_id] = teacher_id;
}

TeacherID Section::getSubjectFixedTeacher(SubjectID subject_id) const {
	if (subject_fixed_teacher.find(subject_id) == subject_fixed_teacher.end()) {
		return -1;
	}
	return subject_fixed_teacher.at(subject_id);
}

void Section::addClass(Timeslot timeslot, ScheduledDay day, const SchoolClass& school_class_) {
	classes[timeslot][day] = school_class_;
}

int Section::getTotalTimeslot() const {
	return total_timeslot;
}

void Section::addUtilizedTeacher(TeacherID teacher_id) {
	utilized_teachers.insert(teacher_id);
}

void Section::removeUtilizedTeacher(TeacherID teacher_id) {
	utilized_teachers.erase(teacher_id);
}

int Section::getNotAllowedBreakslotGap() const {
	return not_allowed_breakslot_gap;
}

int Section::getNumberOfBreak() const {
	return num_break;
}

bool Section::hasViolation() const {
	return has_violation;
}

std::map<Timeslot, std::unordered_map<ScheduledDay, SchoolClass>>& Section::getClasses() {
	return classes;
}
TimeDuration Section::getTotalDuration() const {
	return total_duration;
}
const std::unordered_set<TeacherID>& Section::getUtilizedTeachers() const {
	return utilized_teachers;
}
TimePoint Section::getStartTime() const {
	return start_time;
}
Location Section::getLocation() const {
	return location;
}
void Section::addBreakSlot(Timeslot break_slot) {
	timeslot_manager.addBreakSlot(break_slot);
}
void Section::addSegmentedTimeSlot(Timeslot timeslot) {
	timeslot_manager.addSegmentedTimeSlot(timeslot);
}
void Section::addDynamicTimeSlotDay(Timeslot timeslot, ScheduledDay day) {
	timeslot_manager.addDynamicTimeSlotDay(timeslot, day);
}
void Section::addDynamicTimeSlot(Timeslot timeslot) {
	timeslot_manager.addDynamicTimeSlot(timeslot);
}
void Section::removeBreakSlot(Timeslot timeslot) {
	timeslot_manager.removeBreakSlot(timeslot);
}
void Section::removeSegmentedTimeSlot(Timeslot timeslot) {
	timeslot_manager.removeSegmentedTimeSlot(timeslot);
}
void Section::updateTimeslotStart(Timeslot timeslot, TimePoint start) {
	timeslot_manager.updateTimeslotStart(timeslot, start);
}
void Section::updateTimeslotEnd(Timeslot timeslot, TimePoint end) {
	timeslot_manager.updateTimeslotEnd(timeslot, end);
}
void Section::setTimeRange(Timeslot timeslot, ClassStartEnd time_range) {
	timeslot_manager.setTimeRange(timeslot, time_range);
}
ClassStartEnd Section::getClassStartTime(Timeslot timeslot) const {
	return timeslot_manager.getClassStartTime(timeslot);
}
TimePoint Section::getTimeslotStart(Timeslot timeslot) const {
	return timeslot_manager.getTimeslotStart(timeslot);
}
TimePoint Section::getTimeslotEnd(Timeslot timeslot) const {
	return timeslot_manager.getTimeslotEnd(timeslot);
}
bool Section::isInBreakSlots(Timeslot timeslot) const {
	return timeslot_manager.isInBreakSlots(timeslot);
}
bool Section::isInSegmentedTimeslot(Timeslot timeslot) const {
	return timeslot_manager.isInSegmentedTimeslot(timeslot);
}
const std::unordered_set<Timeslot>& Section::getBreakSlots() const {
	return timeslot_manager.getBreakSlots();
}
const std::unordered_set<Timeslot>& Section::getDynamicSegmentedTimeslot() const {
	return timeslot_manager.getDynamicSegmentedTimeslot();
}
bool Section::isPairTimeslotDurationEqual(std::pair<Timeslot, Timeslot> selected_timeslots) const {
	return timeslot_manager.isPairTimeslotDurationEqual(selected_timeslots);
}