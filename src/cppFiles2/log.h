#ifndef LOG_H
#define LOG_H
#include "timetable.h"

void logSchoolClasses(Timetable& timetable, std::ofstream& file);
void logCosts(std::map<int, int>& nums, std::ofstream& file);
void logResults(std::ofstream& txt_file,
                double total_cost,
                std::string timelapse,
                std::string date_issued,
                std::string time_issued,
                int iteration_count,
                int max_iterations,
                int num_teachers,
                int total_section_subjects,
                int total_section,
                int teacher_subjects_length,
                int bees_population,
                int bees_employed,
                int bees_onlooker,
                int bees_scout,
                int limit,
                int work_week,
                int max_teacher_work_load,
                int break_time_duration,
                int break_timeslot_allowance,
                int teacher_break_threshold,
                int min_total_class_duration_for_two_breaks,
                int default_class_duration,
                int result_buff_length,
                int offset_duration,
                bool enable_logging);

void logConflicts(
    Bee& bee,
    std::ofstream& log_file);

#endif  // LOG_H
