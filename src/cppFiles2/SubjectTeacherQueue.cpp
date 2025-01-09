#include "subjectTeacherQueue.h"

void SubjectTeacherQueue::addTeacher(SubjectID subject_id, TeacherID teacher_id, int max_week_work_load) {
	TeacherWorkload new_teacher(teacher_id, max_week_work_load);
	queue[subject_id].push(new_teacher);
	initial_state[subject_id].push_back(new_teacher);
}

TeacherWorkload* SubjectTeacherQueue::peekFrontTeacher(SubjectID subject_id) {
	if (queue.find(subject_id) != queue.end() && !queue[subject_id].empty()) {
		TeacherWorkload& front_teacher = queue[subject_id].front();
		if (front_teacher.max_week_work_load > 0) {
			return &front_teacher;
		}
	}
	return nullptr;
}

TeacherID SubjectTeacherQueue::getTeacher(SubjectID subject_id, int decrement_work_load) {
	TeacherWorkload* front_teacher = peekFrontTeacher(subject_id);
	if (front_teacher) {
		TeacherID teacher_id = front_teacher->id;
		int current_workload = front_teacher->max_week_work_load;

		if (current_workload - decrement_work_load <= 0) {
			queue[subject_id].pop();
		}

		if (current_workload >= decrement_work_load) {
			front_teacher->max_week_work_load -= decrement_work_load;
			return teacher_id;
		} else {
			queue[subject_id].pop();
			return getTeacher(subject_id, decrement_work_load);
		}
	}

	return -1;
}

void SubjectTeacherQueue::resetQueue() {
	for (auto& entry : queue) {
		SubjectID subject_id = entry.first;

		std::queue<TeacherWorkload>& teacher_queue = entry.second;
		while (!teacher_queue.empty()) {
			teacher_queue.pop();
		}

		for (const TeacherWorkload& teacher : initial_state[subject_id]) {
			teacher_queue.push(teacher);
		}
	}
}