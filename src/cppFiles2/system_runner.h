#include <cstdint>
#include "types.h"

#ifdef __cplusplus
extern "C" {
#endif

void runExperiment(
    int max_iterations,
    int num_teachers,
    int total_section_subjects,
    int total_section,
    int number_of_subject_configuration,

    int32_t* section_configuration,
    int32_t* section_subject_configuration,
    int32_t* section_subjects,
    int32_t* subject_configuration_subject_units,
    int32_t* subject_configuration_subject_duration,
    int32_t* subject_configuration_subject_fixed_timeslot,
    int32_t* subject_configuration_subject_fixed_day,
    int32_t* section_start,
    int32_t* teacher_subjects,
    int32_t* teacher_week_load_config,

    int teacher_subjects_length,
    int bees_population,
    int bees_employed,
    int bees_onlooker,
    int bees_scout,
    int limit,
    int work_week,

    TimeDuration break_time_duration,
    int teacher_break_threshold,
    int teacher_middle_time_point_grow_allowance_for_break_timeslot,
    TimeDuration min_total_class_duration_for_two_breaks,
    TimeDuration default_class_duration,
    int result_buff_length,
    TimePoint offset_duration,
    int64_t* result_timetable,
    int64_t* result_timetable_2,
    int64_t* result_violation,

    bool enable_logging);

#ifdef __cplusplus
}
#endif