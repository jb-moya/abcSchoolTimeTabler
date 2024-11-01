#ifndef RANDOM_UTIL_H
#define RANDOM_UTIL_H

#include <random>

// Declare global random device and random engine.
extern std::random_device rd;
extern std::mt19937 randomizer_engine;

#endif  // RANDOM_UTIL_H