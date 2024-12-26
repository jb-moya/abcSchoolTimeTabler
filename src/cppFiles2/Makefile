# Variables
CXX = g++
# CXXFLAGS = -Wall -Wextra -std=c++17 -g -MMD
CXXFLAGS = -Wall -Wextra -std=c++17 -O3 -MMD
TARGET = zapp_test_abc2
SUFFIX =  # Default suffix is empty
FOLDER = exeFolder/
OUTPUT = $(FOLDER)$(TARGET)$(SUFFIX)  # Output filename with folder and suffix
# Source Files
SRC = \
teacher.cpp \
system_runner.cpp \
timeslotManager.cpp \
subjectConfiguration.cpp \
section.cpp \
random_util.cpp \
timetable.cpp \
abc.cpp \
main.cpp \
timeManager.cpp \
rotaryVector.cpp \
subjectTeacherQueue.cpp \
nodeAdajency.cpp \

# Header Files
HEADERS = \
print.h \
teacher.h \
system_runner.h \
timeslotManager.h \
subjectConfiguration.h \
section.h \
random_util.h \
timetable.h \
abc.h \
timeManager.h \
rotaryVector.h \
subjectTeacherQueue.h \
nodeAdajency.h \
building.h \
location.h \
bit_utils.h \
subjectEligibilityManager.h \
scheduledDay.h \
classStartEnd.h \
schoolClass.h \
bee.h \
objectiveFunction.h \
log.h
# rm -Force *.o, *.d    
# Test Source File
TEST_SRC = test_file.cpp  # Your test file

# Catch2 Framework Source
CATCH_SRC = catch_amalgamated.cpp  # Catch2 amalgamated source
		  
OBJ = $(SRC:.cpp=.o)
TEST_OBJ = $(TEST_SRC:.cpp=.o) $(CATCH_SRC:.cpp=.o)  # Catch2 object file

-include $(OBJ:.o=.d)
-include $(TEST_OBJ:.o=.d)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@



# Rule to build the final executable
$(OUTPUT): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Rule to build object files
%.o: %.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Rule to build the test executable
test: $(TEST_OBJ) 
	$(CXX) $(CXXFLAGS) -o $(FOLDER)test_executable$(SUFFIX) $^

# Rule to build object files for the test program
%.o: %.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Rule to clean the build files
clean:
	rm -f $(OBJ) $(TEST_OBJ) $(OUTPUT) $(FOLDER)test_executable$(SUFFIX)

# Rule to compile and run the program
run: $(OUTPUT)
	./$(OUTPUT)

# Rule to run the tests
run_tests: test
	./$(FOLDER)test_executable$(SUFFIX) $(TEST_FILTER)

# By default, just build the target
all: $(OUTPUT)
