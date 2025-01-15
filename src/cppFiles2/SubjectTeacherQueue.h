#pragma once

#include <cstdint>
#include <iostream>
#include <map>
#include <queue>

#include "types.h"

struct TeacherWorkload {
	TeacherID id;
	int max_week_work_load;

	TeacherWorkload(TeacherID id, int workload)
	    : id(id), max_week_work_load(workload) {}
};

class SubjectTeacherQueue {
   private:
	std::map<SubjectID, std::queue<TeacherWorkload>> queue;
	std::map<SubjectID, std::vector<TeacherWorkload>> initial_state;

   public:
	void addTeacher(SubjectID subject_id, TeacherID teacher_id, int max_work_load);
	TeacherWorkload* peekFrontTeacher(SubjectID subject_id);
	TeacherID getTeacher(SubjectID subject_id, int decrement_work_load);
	void resetQueue();
};