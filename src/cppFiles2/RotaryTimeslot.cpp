#include "rotaryTimeslot.h"

void RotaryTimeslot::incrementShift(int increment) {
	total_shift += increment;
}

std::vector<int> RotaryTimeslot::getTimeslot(int size, std::vector<int> skip) {
	std::vector<int> timeslot;
	for (int i = 0; i < size; i++) {
		if (std::count(skip.begin(), skip.end(), i) > 0) {
			continue;
		}

		timeslot.push_back(i);
	}

	total_shift = total_shift % (size - skip.size());

	std::rotate(timeslot.rbegin(), timeslot.rbegin() + total_shift, timeslot.rend());

	for (size_t i = 0; i < skip.size(); i++) {
		int element = skip[i];

		if (timeslot[0] == element) {
			std::rotate(timeslot.rbegin(), timeslot.rbegin() + 1, timeslot.rend());
			total_shift++;
		}
	}

	previous_size = size - skip.size();

	return timeslot;
}

void RotaryTimeslot::resetShift() {
	total_shift = 0;
}

void RotaryTimeslot::adjustPosition(int size) {
	if (previous_size == -1) {
		return;
	}

	int difference = std::abs(size - previous_size);

	if (difference == 0) {
		return;
	}
}