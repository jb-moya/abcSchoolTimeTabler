#pragma once

#include <cstdint>

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

	if (anyDay) config |= (1 << 7);  // Set the most significant bit (bit 7)
	if (monday) config |= (1 << 6);
	if (tuesday) config |= (1 << 5);
	if (wednesday) config |= (1 << 4);
	if (thursday) config |= (1 << 3);
	if (friday) config |= (1 << 2);
	if (saturday) config |= (1 << 1);
	if (sunday) config |= (1 << 0);

	return config;
}