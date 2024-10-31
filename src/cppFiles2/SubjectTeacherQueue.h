#ifndef SUBJECTTEACHERQUEUE_H
#define SUBJECTTEACHERQUEUE_H

#include <cstdint>
#include <iostream>
#include <map>
#include <queue>

struct TeacherWorkload {
	int16_t id;
	int max_work_load;

	TeacherWorkload(int16_t teacher_id, int workload)
	    : id(teacher_id), max_work_load(workload) {}
};

class SubjectTeacherQueue {
   private:
	std::map<int16_t, std::queue<TeacherWorkload>> queue;
	std::map<int16_t, std::vector<TeacherWorkload>> initial_state;

   public:
	void addTeacher(int16_t subject_id, int16_t teacher_id, int max_work_load);
	TeacherWorkload* peekFrontTeacher(int16_t subject_id);
	int16_t getTeacher(int16_t subject_id, int decrement_work_load);
	void resetQueue();
};

#endif  // SUBJECTTEACHERQUEUE_H
