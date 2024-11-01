#include "random_util.h"

// Define the random device and random engine.
std::random_device rd;
std::mt19937 randomizer_engine(rd());
