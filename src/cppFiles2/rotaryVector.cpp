#include "rotaryVector.h"
void RotaryVector::incrementShift(int increment) {
	total_shift += increment;
}

int RotaryVector::getTotalShift() const {
	return total_shift;
}

int RotaryVector::getTotalTry() const {
	return total_try;
}

std::vector<Timeslot> RotaryVector::getVector(int size, std::vector<int> skips) {
	std::vector<int> rotary_vector;
	for (int i = 0; i < size; i++) {
		if (std::count(skips.begin(), skips.end(), i) > 0) {
			continue;
		}

		rotary_vector.push_back(i);
	}

	total_shift = total_shift % (size - skips.size());

	std::rotate(rotary_vector.rbegin(), rotary_vector.rbegin() + total_shift, rotary_vector.rend());

	for (size_t i = 0; i < skips.size(); i++) {
		Timeslot skip_element = skips[i];

		if (rotary_vector[0] == skip_element) {
			std::rotate(rotary_vector.rbegin(), rotary_vector.rbegin() + 1, rotary_vector.rend());
			total_shift++;
		}
	}

	previous_size = size - skips.size();

	total_try++;
	return rotary_vector;
}

void RotaryVector::resetShift() {
	total_shift = 0;
}

void RotaryVector::adjustPosition(int size) {
	if (previous_size == -1) {
		return;
	}

	int difference = std::abs(size - previous_size);

	if (difference == 0) {
		return;
	}
}