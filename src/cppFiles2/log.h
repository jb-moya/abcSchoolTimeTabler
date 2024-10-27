#ifndef LOG_H
#define LOG_H
#include "abc2.h"

void logSchoolClasses(Timetable& timetable, std::ofstream& file);
void logCosts(std::map<int, int>& nums, std::ofstream& file);

#endif  // LOG_H
