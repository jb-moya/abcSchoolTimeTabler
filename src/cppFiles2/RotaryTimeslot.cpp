#include "rotaryTimeslot.h"

void RotaryTimeslot::incrementShift(int increment) {
	total_shift += increment;
}

int RotaryTimeslot::getTotalShift() const {
	return total_shift;
}

int RotaryTimeslot::getTotalTry() const {
	return total_try;
}

std::vector<Timeslot> RotaryTimeslot::getTimeslot(int size, std::vector<Timeslot> skip_timeslots) {
	std::vector<Timeslot> timeslot;
	for (int i = 0; i < size; i++) {
		if (std::count(skip_timeslots.begin(), skip_timeslots.end(), i) > 0) {
			continue;
		}

		timeslot.push_back(i);
	}

	total_shift = total_shift % (size - skip_timeslots.size());

	std::rotate(timeslot.rbegin(), timeslot.rbegin() + total_shift, timeslot.rend());

	for (size_t i = 0; i < skip_timeslots.size(); i++) {
		Timeslot break_timeslot = skip_timeslots[i];

		if (timeslot[0] == break_timeslot) {
			std::rotate(timeslot.rbegin(), timeslot.rbegin() + 1, timeslot.rend());
			total_shift++;
		}
	}

	previous_size = size - skip_timeslots.size();

	total_try++;
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