#include "nodeAdjacency.h"

#include <iostream>
#include <unordered_map>
#include <vector>

void NodeAdjacency::addNode(int node) {
	if (adjacent_node.find(node) == adjacent_node.end()) {
		adjacent_node[node] = std::vector<int>();
	}
}

void NodeAdjacency::connectNode(int node1, int node2) {
	addNode(node1);
	addNode(node2);

	if (std::find(adjacent_node[node1].begin(), adjacent_node[node1].end(), node2) == adjacent_node[node1].end()) {
		adjacent_node[node1].push_back(node2);
	}

	if (std::find(adjacent_node[node2].begin(), adjacent_node[node2].end(), node1) == adjacent_node[node2].end()) {
		adjacent_node[node2].push_back(node1);
	}
}

std::vector<int> NodeAdjacency::getFirstLevelAdjacentNodes(int node) {
	if (adjacent_node.find(node) != adjacent_node.end()) {
		return adjacent_node[node];
	}
	return {};
}

void NodeAdjacency::displayGraph() {
	for (const auto& pair : adjacent_node) {
		std::cout << "node " << pair.first << " is connected to: ";
		for (int neighbor : pair.second) {
			std::cout << neighbor << " ";
		}
		std::cout << "\n";
	}
}
