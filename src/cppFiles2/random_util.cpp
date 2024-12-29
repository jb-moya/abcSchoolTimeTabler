#include "random_util.h"

std::random_device rd;
std::mt19937 randomizer_engine(rd());
