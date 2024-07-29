#include <cstdint>
#include <iostream>
#include <tuple>

// Combine and reverse for two 16-bit integers
int combine(int class_id, int time_slot) {
	return (class_id << 16) | time_slot;
}

std::tuple<int, int> reverse_combine(int combined) {
	int class_id = (combined >> 16) & 0xFFFF;
	int time_slot = combined & 0xFFFF;
	return std::make_tuple(class_id, time_slot);
}

// Combine and reverse for three 10-bit integers
std::uint32_t combine(std::uint32_t class_id, std::uint32_t time_slot, std::uint32_t teacher_id) {
	return (class_id << 20) | (time_slot << 10) | teacher_id;
}

std::tuple<std::uint32_t, std::uint32_t, std::uint32_t> reverse_combine(std::uint32_t combined) {
	std::uint32_t class_id = (combined >> 20) & 0x3FF;
	std::uint32_t time_slot = (combined >> 10) & 0x3FF;
	std::uint32_t teacher_id = combined & 0x3FF;
	return std::make_tuple(class_id, time_slot, teacher_id);
}

// Combine and reverse for four 16-bit integers
std::uint64_t combine(std::uint32_t a, std::uint32_t b, std::uint32_t c, std::uint32_t d) {
	return (static_cast<std::uint64_t>(a) << 48) | (static_cast<std::uint64_t>(b) << 32) | (static_cast<std::uint64_t>(c) << 16) | d;
}

std::tuple<std::uint32_t, std::uint32_t, std::uint32_t, std::uint32_t> reverse_combine(std::uint64_t combined) {
	std::uint32_t a = (combined >> 48) & 0xFFFF;
	std::uint32_t b = (combined >> 32) & 0xFFFF;
	std::uint32_t c = (combined >> 16) & 0xFFFF;
	std::uint32_t d = combined & 0xFFFF;
	return std::make_tuple(a, b, c, d);
}

int main() {
	// Example for two 16-bit integers
	int class_id = 1, time_slot = 2;
	int combined_16 = combine(class_id, time_slot);
	std::cout << "Combined (16-bit): " << combined_16 << std::endl;
	auto [class_id_16, time_slot_16] = reverse_combine(combined_16);
	std::cout << "Reversed: " << class_id_16 << ", " << time_slot_16 << std::endl;

	// Example for three 10-bit integers
	std::uint32_t class_id_10 = 1, time_slot_10 = 2, teacher_id_10 = 3;
	std::uint32_t combined_10 = combine(class_id_10, time_slot_10, teacher_id_10);
	std::cout << "Combined (10-bit): " << combined_10 << std::endl;
	auto [class_id_10_r, time_slot_10_r, teacher_id_10_r] = reverse_combine(combined_10);
	std::cout << "Reversed: " << class_id_10_r << ", " << time_slot_10_r << ", " << teacher_id_10_r << std::endl;

	// Example for four 16-bit integers
	std::uint32_t a = 1, b = 2, c = 3, d = 4;
	std::uint64_t combined_64 = combine(a, b, c, d);
	std::cout << "Combined (64-bit): " << combined_64 << std::endl;
	auto [a_r, b_r, c_r, d_r] = reverse_combine(combined_64);
	std::cout << "Reversed: " << a_r << ", " << b_r << ", " << c_r << ", " << d_r << std::endl;

	return 0;
}
