# 📅 Timetabling System using ABC algorithm

An automated school timetabling system for Batasan Hills
National High School, streamlining and replacing their manual scheduling process

## ✨ Tech Used
React, Tailwind CSS, Emscripten C++, DaisyUI, IndexedDB, Firebase

# 📌 Scope & Limitations
1. Philippine High School Scheduling
   -   The system is tailored to the scheduling structure of Philippine high schools, ensuring compatibility with local practices.
2. Database Limitations.
   -   Integrates with Firebase under a limited plan.
   -   To reduce Firebase database costs, IndexedDB is utilized for handling complex data processing locally.
3. CPU-dependent
   -   Generation duration is heavily dependent on device's CPU performance.
   -   Non-Multithreading

# 🚀 Features

## Current Features
1. Excel Integration
   -   Import and export Excel files for seamless data transfer across devices.
2. Automated Timetable Generation
   -   Generate complete school timetables within minutes, saving time and reducing errors.
3. Manual Timettable editing:
   -   Provides an editing feature that detects overlapping classes after timetable generation, allowing school administrators to seamlessly apply last-minute changes.
4. Utilized emscripten C++
   -   Compile C++ code into WebAssembly (WASM), allowing it to run in web browsers, leveraging C++ fast performance.

## Planned Features
1. Enhanced Search Page
   -   Fetch timetables directly from Firebase for real-time updates.
2. Timetable Download Option
   -   Add a download button on the search page to allow users to easily download the desired timetable in a user-friendly format.
3. Version controlled timetable
   -   Enable admin to save and retrieve versions of generated timetable for better usability/convenience

# Installation

Go to project directory and run (make sure you have node installed first)

```bash
  npm install
  npm run dev
```
