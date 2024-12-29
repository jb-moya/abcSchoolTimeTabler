#pragma once

#include <iostream>
#include <unordered_map>
#include <vector>

class NodeAdjacency {
   private:
	std::unordered_map<int, std::vector<int>> adjacent_node;

   public:
	void addNode(int node);

	void connectNode(int node1, int node2);

	std::vector<int> getFirstLevelAdjacentNodes(int node);

	void displayGraph();
};