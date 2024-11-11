#pragma once

#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "types.h"

class RotaryTimeslot {
   private:
	int total_shift;
	int total_try;
	int previous_size;

   public:
	RotaryTimeslot() : total_shift(0), total_try(0), previous_size(-1) {}

	int getTotalShift() const;
	int getTotalTry() const;
	void incrementShift(int increment = 1);
	void resetShift();
	void adjustPosition(int size);

	std::vector<Timeslot> getTimeslot(int size, std::vector<Timeslot> skip_timeslots);
};
