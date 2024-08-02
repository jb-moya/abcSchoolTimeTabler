#include <bits/stdc++.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <cassert>
#include <chrono>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>

#include "abc.h"

using namespace std;

void test_hello_react() {
	int max_iterations = 70000;
	vector<int> beesPopulations = {5};
	vector<int> beesEmployedOptions = {5};
	vector<int> beesOnlookerOptions = {2};
	vector<int> beesScoutOptions = {2};
	vector<int> limits = {800};  // dependent on no. of school class

	int num_curriculum = 16;
	int num_teacher = 120;
	int num_room = 120;
	int num_timeslot = 8;

	std::vector<Curriculum> curriculum = {
	    {0, {1, 2, 3, 4, 5, 6, 7, 8}, {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}},

	    {4, {11, 12, 13, 14, 15, 16, 17, 18}, {31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60}},

	    // {8, {21, 22, 23, 24, 25, 26, 27, 28}, {61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90}},

	    // {12, {31, 32, 33, 34, 35, 36, 37, 38}, {91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120}},

	    // {0, {1, 2, 3, 4, 5, 6, 7, 9}, {35, 36}},
	    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}},
	    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3, 4, 5}},
	    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2, 3}},
	    // {0, {1, 2, 3, 4, 5, 6, 7}, {1, 2}},
	    // {1, {1, 2, 3}, {1}}
	};

	std::unordered_map<int16_t, std::vector<int16_t>> teacher_subjects = {
	    // {0, {1}},
	    // {1, {2}},
	    // {2, {3}},
	    // {3, {4}},
	    // {4, {5}},
	    // {5, {6}},
	    // {6, {7}},
	    // {7, {8}},
	    // {8, {1}},
	    // {9, {2}},
	    // {10,{3}},
	    // {11,{4}},
	    // {12,{5}},
	    // {13,{6}},
	    // {14,{7}},
	    // {15,{8}},
	    // {16,{1}},
	    // {17,{2}},
	    // {18,{3}},
	    // {19,{4}},
	    // {20,{5}},
	    // {21,{6}},
	    // {22,{7}},
	    // {23,{8}},
	    // {24,{1}},
	    // {25,{2}},
	    // {26,{3}},
	    // {27,{4}},
	    // {28,{5}},
	    // {29,{6}},
	    // {30,{7}},
	    // {31,{8}},
	};

	for (int beesPopulation : beesPopulations) {
		for (int beesEmployed : beesEmployedOptions) {
			for (int beesOnlooker : beesOnlookerOptions) {
				for (int beesScout : beesScoutOptions) {
					for (int limit : limits) {
						std::cout << "Running experiment with configuration: "
						          << max_iterations << ", "
						          << beesPopulation << ", "
						          << beesEmployed << ", "
						          << beesOnlooker << ", "
						          << beesScout << ", "
						          << limit << std::endl;
						runExperiment(max_iterations, num_curriculum, num_teacher, num_room, num_timeslot, curriculum, teacher_subjects, beesPopulation, beesEmployed, beesOnlooker, beesScout, limit);
					}
				}
			}
		}
	}
}


int main() {
    test_hello_react();
    return 0;
}
