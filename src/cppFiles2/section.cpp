#include "section.h"

int Section::total_section;
std::unordered_set<int> Section::s_all_sections;

SubjectConfiguration& Section::getSubject(int subject_id) {
	return *subject_configurations[subject_id];
}

void Section::addSubject(const std::shared_ptr<SubjectConfiguration>& subject_configuration_) {
	int subject_id = subject_configuration_->getSubjectId();
	subject_configurations[subject_id] = subject_configuration_;
}

void Section::setTimeRange(int timeslot, ClassStartEnd time_range_) {
	time_range[timeslot] = time_range_;
}

void Section::setClasses(const std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>& classes_) {
	classes = classes_;
}

bool Section::isDynamicSubjectConsistentDuration() const {
	return is_dynamic_subject_consistent_duration;
}

void Section::setTimeRange(const std::unordered_map<int, ClassStartEnd>& time_range_) {
	time_range = time_range_;
}

void Section::setBreakSlots(const std::unordered_set<int>& break_slots_) {
	break_slots = break_slots_;
}

void Section::setSegmentedTimeslot(const std::unordered_set<int>& segmented_timeslot_) {
	segmented_timeslot = segmented_timeslot_;
}

void Section::setDynamicTimeslot(const std::unordered_set<int>& dynamic_timeslot_) {
	dynamic_timeslot = dynamic_timeslot_;
}

void Section::setFixedTimeslotDay(const std::unordered_map<int, std::set<ScheduledDay>>& fixed_timeslot_day_) {
	fixed_timeslot_day = fixed_timeslot_day_;
}

void Section::setUtilizedTeachers(const std::unordered_set<int>& utilized_teachers_) {
	utilized_teachers = utilized_teachers_;
}

void Section::setViolation(bool violation) {
	has_violation = violation;
}

void Section::setTotalDuration(int total_duration_) {
	total_duration = total_duration_;
}

int Section::getId() const {
	return id;
}

const std::unordered_map<int, std::shared_ptr<SubjectConfiguration>>& Section::getSubjectConfigurations() const {
	return subject_configurations;
}

ScheduledDay Section::getClassTimeslotScheduledDay(int timeslot) const {
	return classes.find(timeslot)->second.begin()->first;
}

bool Section::isInBreakSlots(int timeslot) const {
	return break_slots.find(timeslot) != break_slots.end();
}

bool Section::isInSegmentedTimeslot(int timeslot) const {
	return segmented_timeslot.find(timeslot) != segmented_timeslot.end();
}

void Section::removeSegmentedTimeSlot(int timeslot) {
	segmented_timeslot.erase(timeslot);
}

void Section::addSegmentedTimeSlot(int timeslot) {
	segmented_timeslot.insert(timeslot);
}

void Section::addBreakSlot(int timeslot) {
	break_slots.insert(timeslot);
}

void Section::removeBreakSlot(int timeslot) {
	break_slots.erase(timeslot);
}

void Section::addClass(int timeslot, ScheduledDay day, const SchoolClass& school_class_) {
	classes[timeslot][day] = school_class_;
}

int Section::getTotalTimeslot() const {
	return total_timeslot;
}

void Section::addFixedTimeSlotDay(int timeslot, ScheduledDay day) {
	fixed_timeslot_day[timeslot].insert(day);
}

void Section::addUtilizedTeacher(int teacher_id) {
	utilized_teachers.insert(teacher_id);
}

void Section::removeUtilizedTeacher(int teacher_id) {
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

std::map<int, std::unordered_map<ScheduledDay, SchoolClass>>& Section::getClasses() {
	return classes;
}

const std::unordered_map<int, ClassStartEnd>& Section::getTimeRange() const {
	return time_range;
}

const std::unordered_set<int>& Section::getBreakSlots() const {
	return break_slots;
}

int Section::getTotalDuration() const {
	return total_duration;
}

int Section::getTimeslotStart(int timeslot) const {
	return time_range.find(timeslot)->second.start;
}

int Section::getTimeslotEnd(int timeslot) const {
	return time_range.find(timeslot)->second.end;
}
void Section::updateTimeslotStart(int timeslot, int start) {
	time_range.find(timeslot)->second.start = start;
}

void Section::updateTimeslotEnd(int timeslot, int end) {
	time_range.find(timeslot)->second.end = end;
}

const std::unordered_set<int>& Section::getSegmentedTimeslot() const {
	return segmented_timeslot;
}

const std::unordered_set<int>& Section::getDynamicTimeslot() const {
	return dynamic_timeslot;
}

const std::unordered_map<int, std::set<ScheduledDay>>& Section::getFixedTimeslotDay() const {
	return fixed_timeslot_day;
}

const std::unordered_set<int>& Section::getUtilizedTeachers() const {
	return utilized_teachers;
}

int Section::getStartTime() const {
	return start_time;
}