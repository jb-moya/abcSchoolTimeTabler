#include "TimeManager.h"

void TimeManager::startTimer() {
	start_time = std::chrono::high_resolution_clock::now();
	is_running = true;
}

void TimeManager::stopTimer() {
	if (is_running) {
		end_time = std::chrono::high_resolution_clock::now();
		is_running = false;
	} else {
		std::cerr << "Timer is not running!" << std::endl;
	}
}

std::string TimeManager::getStartDate() {
	auto start_time_t = std::chrono::high_resolution_clock::to_time_t(start_time);
	std::tm* localStartTime = std::localtime(&start_time_t);

	// Format the date as YYYY-MM-DD
	return std::to_string(localStartTime->tm_year % 100) + "-" +
	       std::to_string(localStartTime->tm_mon + 1) + "-" +
	       std::to_string(localStartTime->tm_mday);
}

// Function to get the start time as a string
std::string TimeManager::getStartTime() {
	auto start_time_t = std::chrono::high_resolution_clock::to_time_t(start_time);
	std::tm* localStartTime = std::localtime(&start_time_t);

	// Format the time as HH-MM-SS
	return std::to_string(localStartTime->tm_hour) + "-" +
	       std::to_string(localStartTime->tm_min) + "-" +
	       std::to_string(localStartTime->tm_sec);
}

std::string TimeManager::getEndDate() {
	auto start_time_t = std::chrono::high_resolution_clock::to_time_t(end_time);
	std::tm* localStartTime = std::localtime(&start_time_t);

	// Format the date as YYYY-MM-DD
	return std::to_string(localStartTime->tm_year % 100) + "-" +
	       std::to_string(localStartTime->tm_mon + 1) + "-" +
	       std::to_string(localStartTime->tm_mday);
}

// Function to get the start time as a string
std::string TimeManager::getEndTime() {
	auto start_time_t = std::chrono::high_resolution_clock::to_time_t(end_time);
	std::tm* localStartTime = std::localtime(&start_time_t);

	// Format the time as HH-MM-SS
	return std::to_string(localStartTime->tm_hour) + "-" +
	       std::to_string(localStartTime->tm_min) + "-" +
	       std::to_string(localStartTime->tm_sec);
}

std::string TimeManager::getTimelapse() {
	if (!is_running) {
		auto duration = end_time - start_time;
		int duration_in_seconds = std::chrono::duration_cast<std::chrono::seconds>(duration).count();

		int hours = duration_in_seconds / 3600;
		int minutes = (duration_in_seconds % 3600) / 60;
		int seconds = duration_in_seconds % 60;

		// Format the time lapse as a string
		return std::to_string(hours) + " hours, " + std::to_string(minutes) + " minutes, " + std::to_string(seconds) + " seconds";
	} else {
		std::cerr << "Timer is still running! Stop the timer first." << std::endl;
		return "0 hours, 0 minutes, 0 seconds";  // Return a default string if still running
	}
}