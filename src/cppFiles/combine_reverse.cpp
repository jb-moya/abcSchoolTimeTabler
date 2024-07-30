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

// void onlookerBeePhase(std::vector<Bee>& beesVector, const ObjectiveFunction& objFunc, int num_classes, int num_teachers, int num_rooms, int num_timeslots) {
// 	std::vector<double> fitnessValues(beesVector.size());

// 	// Calculate fitness values for all bees
// 	for (size_t i = 0; i < beesVector.size(); ++i) {
// 		fitnessValues[i] = 1.0 / (1.0 + beesVector[i].cost);  // Higher cost -> Lower fitness
// 	}

// 	std::default_random_engine generator;
// 	std::uniform_real_distribution<double> distribution(0.0, 1.0);

// 	// Onlooker bees phase
// 	for (size_t i = 0; i < beesVector.size(); ++i) {
// 		double random_value = distribution(generator);
// 		double sum_fitness = std::accumulate(fitnessValues.begin(), fitnessValues.end(), 0.0);
// 		double probability_threshold = random_value * sum_fitness;

// 		double cumulative_probability = 0.0;
// 		size_t selected_bee_index = 0;
// 		for (size_t j = 0; j < beesVector.size(); ++j) {
// 			cumulative_probability += fitnessValues[j];
// 			if (cumulative_probability >= probability_threshold) {
// 				selected_bee_index = j;
// 				break;
// 			}
// 		}

// 		// Generate a new neighbor solution
// 		Bee newBee = beesVector[selected_bee_index];
// 		std::uniform_int_distribution<int> teacher_dist(0, num_teachers - 1);
// 		std::uniform_int_distribution<int> room_dist(0, num_rooms - 1);
// 		std::uniform_int_distribution<int> timeslot_dist(0, num_timeslots - 1);

// 		// Modify one of the classes randomly to create a new neighbor
// 		int class_index = std::uniform_int_distribution<int>(0, num_classes - 1)(generator);
// 		newBee.timetable.classes[class_index].teacher_id = teacher_dist(generator);
// 		newBee.timetable.classes[class_index].room_id = room_dist(generator);
// 		newBee.timetable.classes[class_index].timeslot = timeslot_dist(generator);

// 		// Recalculate the cost of the new solution
// 		newBee.cost = objFunc.evaluate(newBee.timetable);

// 		// Replace the old solution if the new one is better
// 		if (newBee.cost < beesVector[selected_bee_index].cost) {
// 			beesVector[selected_bee_index] = newBee;
// 		}
// 	}
// }

// void testCombineInteger() {
// 	int result = combine(0, 0, 0);
// 	assert(result == 0);

// 	result = combine(0, 0, 1);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(0, 1, 0);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(0, 1, 1);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 0, 0);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 0, 1);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 0);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 1);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 2);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 3);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 4);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 10);
// 	std::cout << "result: " << result << std::endl;

// 	result = combine(1, 1, 100000000);
// 	std::cout << "result: " << result << std::endl;

// 	std::cout << "testCombineInteger All tests passed!" << std::endl;
// }