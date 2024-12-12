@echo off
cd C:\Users\jbvhe\Documents\schedulerv2\src\cppFiles2
emsdk activate latest
emcc subjectTeacherQueue.cpp timeslotManager.cpp rotaryVector.cpp timeManager.cpp abc.cpp  random_util.cpp  teacher.cpp subjectConfiguration.cpp  section.cpp timetable.cpp -sMODULARIZE=1 -sSINGLE_FILE=1 -sWASM=1 -sWASM_BIGINT -sIMPORTED_MEMORY=1 -sALLOW_MEMORY_GROWTH=1 -sEXPORT_ES6   -sEXPORTED_FUNCTIONS="['_runExperiment','_malloc','_free','getValue']" -o abc2.js -O3
:: emcc subjectTeacherQueue.cpp timeslotManager.cpp rotaryVector.cpp timeManager.cpp abc.cpp  random_util.cpp  teacher.cpp subjectConfiguration.cpp  section.cpp timetable.cpp -sMODULARIZE=1 -sSINGLE_FILE=1 -sWASM=1 -sWASM_BIGINT -sIMPORTED_MEMORY=1 -sALLOW_MEMORY_GROWTH=1 -sEXPORT_ES6   -sEXPORTED_FUNCTIONS="['_runExperiment','_malloc','_free','getValue']" -o abc2.js -O3
:: emcc timeslot.cpp -sMODULARIZE=1 -sSINGLE_FILE=1 -sWASM=1 -sWASM_BIGINT -sIMPORTED_MEMORY=1 -sEXPORT_ES6 -sEXPORTED_FUNCTIONS="['_runExperiment','_malloc','_free','getValue']" -o abc.js -O3
:: emcc abc2.cpp -sMODULARIZE=1 -sSINGLE_FILE=1 -sWASM=1 -sWASM_BIGINT -sIMPORTED_MEMORY=1 -sEXPORT_ES6 -sEXPORTED_FUNCTIONS="['_runExperiment','_malloc','_free','getValue']" -o abc2.js -O3
