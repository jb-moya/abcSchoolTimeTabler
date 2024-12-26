#pragma once

#include <iostream>

#include "location.h"
#include "nodeAdjacency.h"
#include "types.h"

class Building {
   private:
	BuildingID id;
	std::vector<int> floor_room_counts;

	static NodeAdjacency building_adjacency;
	static std::vector<BuildingID> getAdjacentBuildings(BuildingID building_id);

   public:
	static void connectBuildings(BuildingID building_id_1, BuildingID building_id_2);

	Building(BuildingID id, std::vector<int> floor_room_counts) : id(id), floor_room_counts(floor_room_counts) {}
	int getId() const;
	int getFloorRoomCount(int floor) const;
	int getDistanceTo(Location& from, Location& to_location, Building& to_building) const;
};