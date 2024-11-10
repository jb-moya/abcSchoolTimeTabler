#include <cstdint>
#include <iostream>
#include <map>
#include <queue>

struct TeacherWorkload {
	int id;
	int max_work_load;

	TeacherWorkload(int teacher_id, int workload)
	    : id(teacher_id), max_work_load(workload) {}
};

class SubjectTeacherQueue {
   private:
	std::map<int, std::queue<TeacherWorkload>> queue;
	std::map<int, std::vector<TeacherWorkload>> initial_state;

   public:
	void addTeacher(int subject_id, int teacher_id, int max_work_load);
	TeacherWorkload* peekFrontTeacher(int subject_id);
	int getTeacher(int subject_id, int decrement_work_load);
	void resetQueue();
};