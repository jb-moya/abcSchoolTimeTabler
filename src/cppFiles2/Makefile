# Variables
CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++17 -g
# CXXFLAGS = -Wall -Wextra -std=c++17 -O3
TARGET = zapp_test_abc2
SUFFIX = ""  # Default suffix is empty
FOLDER = exeFolder/
OUTPUT = $(FOLDER)$(TARGET)$(SUFFIX)  # Output filename with folder and suffix
SRC = teacher.cpp subjectConfiguration.cpp section.cpp random_util.cpp timetable.cpp abc.cpp test_abc2.cpp timeManager.cpp rotaryTimeslot.cpp subjectTeacherQueue.cpp
HEADERS = teacher.h subjectEligibilityManager.h scheduledDay.h subjectConfiguration.h section.h classStartEnd.h schoolClass.h random_util.h timetable.h bee.h objectiveFunction.h abc.h log.h timeManager.h rotaryTimeslot.h subjectTeacherQueue.h  print.h 
OBJ = $(SRC:.cpp=.o)

# Rule to build the final executable
$(OUTPUT): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Rule to build object files
%.o: %.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Rule to clean the build files
clean:
	rm -f $(OBJ) $(OUTPUT)

# Rule to compile and run the program
run: $(OUTPUT)
	./$(OUTPUT)

# By default, just build the target
all: $(OUTPUT)
