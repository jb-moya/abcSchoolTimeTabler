#ifndef ROTARYTIMESLOT_H
#define ROTARYTIMESLOT_H

#include <algorithm>
#include <cstdlib>  // For std::abs with integers
#include <iostream>
#include <vector>

class RotaryTimeslot {
   private:
	int total_shift;
	int previous_size;

   public:
	RotaryTimeslot() : total_shift(0), previous_size(-1) {}

	void incrementShift(int increment = 1);
	void resetShift();
	void adjustPosition(int size);

	std::vector<int> getTimeslot(int size, std::vector<int> skip);
};

#endif  // ROTARYTIMESLOT_H.