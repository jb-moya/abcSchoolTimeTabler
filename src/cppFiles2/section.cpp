#include "section.h"

#include "print.h"
#include "random_util.h"

int Section::total_section;
std::unordered_set<SectionID> Section::s_all_sections;

SubjectConfiguration& Section::getSubject(SubjectID subject_id) {
	return *subject_configurations[subject_id];
}

void Section::addSubject(const std::shared_ptr<SubjectConfiguration>& subject_configuration_) {
	SubjectID subject_id = subject_configuration_->getSubjectId();
	subject_configurations[subject_id] = subject_configuration_;
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

void Section::assignBreaks(std::vector<Timeslot>& breaks) {
	for (Timeslot break_slot : breaks) {
		addClass(break_slot, ScheduledDay::EVERYDAY, SchoolClass{-1, -1});
		timeslot_manager.addBreakSlot(break_slot);
	}
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
	std::swap(classes[timeslot_1], classes[timeslot_2]);
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
		return {};
	};

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

const std::unordered_map<SubjectID, std::shared_ptr<SubjectConfiguration>>& Section::getSubjectConfigurations() const {
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

const std::unordered_map<Timeslot, std::set<ScheduledDay>>& Section::getFixedTimeslotDay() const {
	return timeslot_manager.getFixedTimeslotDay();
}

const std::unordered_set<TeacherID>& Section::getUtilizedTeachers() const {
	return utilized_teachers;
}

TimePoint Section::getStartTime() const {
	return start_time;
}
void Section::addBreakSlot(Timeslot break_slot) {
	timeslot_manager.addBreakSlot(break_slot);
}
void Section::addSegmentedTimeSlot(Timeslot timeslot) {
	timeslot_manager.addSegmentedTimeSlot(timeslot);
}
void Section::addFixedTimeSlotDay(Timeslot timeslot, ScheduledDay day) {
	timeslot_manager.addFixedTimeSlotDay(timeslot, day);
}
void Section::addDynamicTimeSlotDay(Timeslot timeslot, ScheduledDay day) {
	timeslot_manager.addDynamicTimeSlotDay(timeslot, day);
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
const std::unordered_set<Timeslot>& Section::getSegmentedTimeslot() const {
	return timeslot_manager.getSegmentedTimeslot();
}
bool Section::isPairTimeslotDurationEqual(std::pair<Timeslot, Timeslot> selected_timeslots) const {
	return timeslot_manager.isPairTimeslotDurationEqual(selected_timeslots);
}