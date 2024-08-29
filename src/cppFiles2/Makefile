# Variables
CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++11
TARGET = test_abc2
SRC = abc2.cpp test_abc2.cpp
OBJ = $(SRC:.cpp=.o)

# Rule to build the final executable
$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Rule to build object files
%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $<

# Rule to clean the build files
clean:
	rm -f $(OBJ) $(TARGET)

# Rule to compile and run the program
run: $(TARGET)
	./$(TARGET)

# By default, just build the target
all: $(TARGET)
