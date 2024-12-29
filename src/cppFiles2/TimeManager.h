#pragma once

#include <chrono>
#include <ctime>
#include <iostream>
#include <string>
#include <thread>
#include <tuple>

class TimeManager {
   private:
	std::chrono::high_resolution_clock::time_point start_time;
	std::chrono::high_resolution_clock::time_point end_time;
	bool is_running = false;

   public:
	void startTimer();
	void stopTimer();
	std::string getStartDate();
	std::string getEndDate();
	std::string getStartTime();
	std::string getEndTime();
	std::string getTimelapse();
};
