#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "abc2.h"

using namespace std;

int32_t* allocate(int size) {
	int32_t* static_array = new (std::nothrow) int32_t[size];

	if (!static_array) {
		std::cerr << "Failed to allocate memory for static array" << std::endl;
		return nullptr;
	}

	return static_array;
}

void unpackInt32ToInt16(int32_t packed, int16_t& first, int16_t& second) {
	first = static_cast<int16_t>(packed >> 16);
	second = static_cast<int16_t>(packed & 0xFFFF);
}

void test_generate_timetable() {
	int max_iterations = 3000;
	int beesPopulation = 11;
	int beesEmployed = 5;
	int beesOnlooker = 5;
	int beesScout = 1;
	int limit = 70;
	int num_teachers = 3;
	int total_section = 3;
	int num_subjects = 3;
	int max_teacher_work_load = 2;
	int teacher_subjects_length = num_teachers;
	int default_units = 0;  // 0 means everyday
	int default_duration = 1;
	int workweek = 1;

	// 500 x 20 x 5

	int total_section_subjects = total_section * num_subjects;

	int32_t* section_subjects = allocate(total_section_subjects);
	int32_t* section_start = allocate(total_section);
	int32_t* teacher_subjects = allocate(teacher_subjects_length);
	int32_t* section_subject_units = allocate(total_section_subjects);
	int32_t* section_subject_duration = allocate(total_section_subjects);

	for (int i = 0; i < teacher_subjects_length; ++i) {
		teacher_subjects[i] = -1;
	}

	for (int i = 0; i < num_teachers; ++i) {
		teacher_subjects[i] = packInt16ToInt32(i, i % num_subjects);
	}

	// teacher_subjects[0] = packInt16ToInt32(0, 0);
	// teacher_subjects[1] = packInt16ToInt32(1, 1);
	// teacher_subjects[2] = packInt16ToInt32(2, 0);
	// teacher_subjects[3] = packInt16ToInt32(3, 1);
	// teacher_subjects[2] = packInt16ToInt32(2, 2);

	for (int i = 0; i < total_section; ++i) {
		section_start[i] = 0;
	}

	for (int16_t section = 0; section < total_section; ++section) {
		for (int16_t subject = 0; subject < num_subjects; ++subject) {
			int index = section * num_subjects + subject;

			if (index >= total_section_subjects) {
				std::cerr << "Index out of bounds: " << index << std::endl;
				delete[] section_subjects;
				delete[] teacher_subjects;
				return;
			}

			section_subjects[index] = packInt16ToInt32(section, subject);

			std::cout << "index:  " << index << std::endl;
			// std::cout << "i : " << section << "j " << subject << " default_units " << default_units << std::endl;
			section_subject_units[index] = packInt16ToInt32(subject, default_units);
			section_subject_duration[index] = packInt16ToInt32(subject, default_duration);
		}
	}

	// section_subject_units[0] = packInt16ToInt32(0, 4);
	// section_subject_units[1] = packInt16ToInt32(1, 1);

	// section_subject_duration[0] = packInt16ToInt32(0, 5);
	// section_subject_duration[1] = packInt16ToInt32(1, 1);

	// section_subject_units[2] = packInt16ToInt32(2, 1);
	// section_subject_units[3] = packInt16ToInt32(3, 4);

	int total_class_block = 0;
	for (int i = 0; i < total_section_subjects; ++i) {
		int16_t unpackedFirst, unpackedSecond;
		unpackInt32ToInt16(section_subject_units[i], unpackedFirst, unpackedSecond);
		total_class_block += unpackedSecond == 0 ? 1 : unpackedSecond;
	}

	// for (int i = 0; i < total_section; ++i) {
	// 	total_class_block += 2;
	// }

	std::cout << "total_class_block: " << total_class_block << std::endl;

	int64_t* result = new (std::nothrow) int64_t[total_class_block];

	std::cout << "Running experiment with configuration: ";

	std::cout << max_iterations << ", "
	          << beesPopulation << ", "
	          << beesEmployed << ", "
	          << beesOnlooker << ", "
	          << beesScout << ", "
	          << limit << std::endl;

	int result_buff_length = total_class_block;  // arbitrary

	runExperiment(
	    max_iterations,
	    num_teachers,
	    total_section_subjects,
	    total_class_block,
	    total_section,
	    section_subjects,
	    section_subject_duration,
	    section_start,
	    teacher_subjects,
	    section_subject_units,
	    teacher_subjects_length,
	    beesPopulation,
	    beesEmployed,
	    beesOnlooker,
	    beesScout,
	    limit,
	    workweek,
	    max_teacher_work_load,
	    result_buff_length,
	    result);
}

int main() {
	test_generate_timetable();
	// test_calculatePositions();
	std::cout << "done testing" << std::endl;
	return 0;
}


// emcc abc.cpp -s -sMODULARIZE=1 -sWASM_BIGINT - sEXPORTED_FUNCTIONS = '_runExperiment', '_malloc', '_free', getValue abc.js

// 571 570 569 568 567 566 565 564 563 562 561 560 559 558 557 556 555 554 553 552 551 550 549 548 547 546 545 544 543 542 541 540 539 538 537 536 535 534 533 532 531 530 529 528 527 526 525 524 523 522 521 520 519 518 517 516 515 514 513 512 511 510 509 508 507 506 505 504 503 502 501 500 471 470 469 468 467 466 465 464 463 462 461 460 459 458 457 456 455 454 453 452 451 450 449 448 447 446 445 444 443 442 441 226 225 224 223 222 221 220 219 218 217 216 215 214 213 212 211 210 209 208 207 206 205 204 203 202 201 200 171 428 170 427 169 426 168 425 167 424 166 423 165 422 164 421 163 420 162 419 161 418 160 417 159 416 128 254 127 253 126 252 125 251 124 250 123 249 122 248 121 247 120 246 119 245 118 244 117 243 116 242 115 241 114 371 240 113 370 227 100 357 228 101 358 229 102 359 230 103 360 231 104 361 232 105 362 233 106 363 234 107 364 235 108 365 236 109 366 237 110 367 238 111 368 239 112 369 129 130 131 132 133 134 135 136 137 138 139 140 141 142 143 400 144 401 145 402 146 403 147 404 148 405 149 406 150 407 151 408 152 409 153 410 154 411 155 412 156 413 157 414 158 415 255 256 257 258 259 260 261 262 263 264 265 266 267 268 269 270 271 300 301 302 303 304 305 306 307 308 309 310 311 312 313 314 315 316 317 318 319 320 321 322 323 324 325 326 327 328 329 330 331 332 333 334 335 336 337 338 339 340 341 342 343 344 345 346 347 348 349 350 351 352 353 354 355 356 429 430 431 432 433 434 435 436 437 438 439 440