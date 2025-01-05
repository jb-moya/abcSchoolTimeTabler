#include "building.h"

#include <iostream>

NodeAdjacency Building::building_adjacency;

void Building::connectBuildings(BuildingID building_id_1, BuildingID building_id_2) {
	building_adjacency.connectNode(building_id_1, building_id_2);
}

std::vector<BuildingID> Building::getAdjacentBuildings(BuildingID building_id) {
	return building_adjacency.getFirstLevelAdjacentNodes(building_id);
}

int Building::getDistanceTo(Location& from, Location& to_location, Building& to_building) const {
	int total_cost = 0;

	BuildingID to_building_id = to_building.getId();

	bool is_same_building = true;

	// std::cout << "floor" << from.floor << "to" << to_location.floor << std::endl;

	if (id != to_building_id) {
		is_same_building = false;

		auto adjacent_building = Building::getAdjacentBuildings(id);

		auto it = std::find(adjacent_building.begin(), adjacent_building.end(), to_building_id);
		if (it != adjacent_building.end()) {
			total_cost += 100;

			// std::cout << "adjacent building" << std::endl;
		}
	}

	if (is_same_building) {
		int distance = std::abs(from.floor - to_location.floor);

		total_cost += distance;

		// std::cout << "distance: " << distance << std::endl;
	} else {
		int distance = from.floor + to_location.floor;
		total_cost += distance;

		// std::cout << "distance (different): " << distance << std::endl;
	}

	return total_cost;
}

int Building::getFloorRoomCount(int floor) const {
	if (floor >= 0 && floor < floor_room_counts.size()) {
		return floor_room_counts[floor];
	}
	return -1;
}

int Building::getId() const {
	return id;
}