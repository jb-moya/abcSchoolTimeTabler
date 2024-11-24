#pragma once

#include <cstdint>
#include <vector>

#include "scheduledDay.h"

inline int64_t pack5IntToInt64(int16_t a, int16_t b, int16_t c, int8_t d, int8_t e) {
	int64_t result = 0;
	result |= (static_cast<int64_t>(a) & 0xFFFF) << 48;
	result |= (static_cast<int64_t>(b) & 0xFFFF) << 32;
	result |= (static_cast<int64_t>(c) & 0xFFFF) << 16;
	result |= (static_cast<int64_t>(d) & 0xFF) << 8;
	result |= (static_cast<int64_t>(e) & 0xFF);
	return result;
}

inline int32_t packInt16ToInt32(int16_t first, int16_t second) {
	int32_t result = (static_cast<int32_t>(first) << 16) | (static_cast<uint16_t>(second));
	return result;
}

inline int32_t packInt8ToInt32(int8_t first, int8_t second, int8_t third, int8_t fourth) {
	int32_t result = (static_cast<int32_t>(first) << 24) |
	                 (static_cast<uint8_t>(second) << 16) |
	                 (static_cast<uint8_t>(third) << 8) |
	                 (static_cast<uint8_t>(fourth));
	return result;
}

inline uint8_t assignFixedDay(bool anyDay, bool monday, bool tuesday, bool wednesday,
                              bool thursday, bool friday, bool saturday, bool sunday) {
	uint8_t config = 0;

	if (anyDay) config |= (1 << static_cast<uint8_t>(ScheduledDay::ANYDAY));  // Set the most significant bit (bit 7))
	if (monday) config |= (1 << static_cast<uint8_t>(ScheduledDay::MONDAY));
	if (tuesday) config |= (1 << static_cast<uint8_t>(ScheduledDay::TUESDAY));
	if (wednesday) config |= (1 << static_cast<uint8_t>(ScheduledDay::WEDNESDAY));
	if (thursday) config |= (1 << static_cast<uint8_t>(ScheduledDay::THURSDAY));
	if (friday) config |= (1 << static_cast<uint8_t>(ScheduledDay::FRIDAY));
	if (saturday) config |= (1 << static_cast<uint8_t>(ScheduledDay::SATURDAY));
	if (sunday) config |= (1 << static_cast<uint8_t>(ScheduledDay::SUNDAY));

	return config;
}

inline std::vector<ScheduledDay> extractFixedDays(uint8_t config) {
	std::vector<ScheduledDay> fixed_days;
	for (int i = 0; i < 8; i++) {
		if (config & (1 << i)) {
			fixed_days.push_back(static_cast<ScheduledDay>(i));
		}
	}
	return fixed_days;
}
