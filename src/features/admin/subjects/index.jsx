import SubjectListContainer from '@components/Admin/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramListContainer';
import Configuration from '@components/Admin/Configuration';

function Subject() {
  // Scope and Limitations
  // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
  // Due to this strict pairing, room allocation is not a factor in timetable generation.

  // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
  // They do not have the option to select subjects independently.

  // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
  // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

  return (
    <div className="App container mx-auto px-4 mb-10">
      <Configuration />
      {/* Table */}

      <div className="w-[100%]">
        <SubjectListContainer editable={true} />
      </div>

      <div className="w-[100%=">
        <ProgramListContainer editable={true} />
      </div>
    </div>
  );
}

export default Subject;
