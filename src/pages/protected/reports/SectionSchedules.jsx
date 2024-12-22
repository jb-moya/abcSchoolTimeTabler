import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import Breadcrumbs from "@components/Admin/Breadcrumbs";
import { IoSearch } from "react-icons/io5";

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Section Schedules' }));
  }, [dispatch]);

  const links = [{ name: "Home", href: "/" }];

  // Initial schedules data
  const [sectionSchedules] = useState([
    { id: 1, gradeLevel: 7, sectionName: 'Magalang', program: 'Regular' },
    { id: 2, gradeLevel: 8, sectionName: 'Malibog', program: 'STE' },
    { id: 3, gradeLevel: 9, sectionName: 'Masinop', program: 'Regular' },
    { id: 4, gradeLevel: 10, sectionName: 'Maganda', program: 'ICT' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedules, setFilteredSchedules] = useState(sectionSchedules);
  const [sortCriteria, setSortCriteria] = useState(''); // Track the current sort criteria

  
  // Filter schedules based on the search term
  useEffect(() => {
    let updatedSchedules = sectionSchedules.filter((schedule) =>
      schedule.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    if (sortCriteria === 'Grade Level, Ascending') {
      updatedSchedules = updatedSchedules.sort((a, b) => a.gradeLevel - b.gradeLevel);
    } else if (sortCriteria === 'Grade Level, Descending') {
      updatedSchedules = updatedSchedules.sort((a, b) => b.gradeLevel - a.gradeLevel);
    } else if (sortCriteria === 'Section Name, A-Z') {
      updatedSchedules = updatedSchedules.sort((a, b) => a.sectionName.localeCompare(b.sectionName));
    } else if (sortCriteria === 'Section Name, Z-A') {
      updatedSchedules = updatedSchedules.sort((a, b) => b.sectionName.localeCompare(a.sectionName));
    } else if (sortCriteria === 'Program, A-Z') {
      updatedSchedules = updatedSchedules.sort((a, b) => a.program.localeCompare(b.program));
    } else if (sortCriteria === 'Program, Z-A') {
      updatedSchedules = updatedSchedules.sort((a, b) => b.program.localeCompare(a.program));
    }

    setFilteredSchedules(updatedSchedules);
  }, [searchTerm, sectionSchedules, sortCriteria]);

  // Handle sort change
  const handleSort = (criteria) => {
    setSortCriteria(criteria);
  };

  return (
    <div className="App container mx-auto px-4 mb-10">
      <Breadcrumbs title="Section Schedule" links={links} />
      {/* Card */}
      <div className="card w-full bg-base-100 shadow-md">
        <div className="card-body">

          {/* Pagination */}
          <div className="join flex justify-center mb-4">
            <button className="join-item btn">«</button>
            <button className="join-item btn">Page 1</button>
            <button className="join-item btn">»</button>
            {/* Search Bar */}
            <div className="w-full md:w-[400px] lg:w-[1250px] flex items-center ml-4">
              <label className="input input-bordered flex items-center gap-2 w-full">
                <input
                  type="text"
                  className="p-3 text-sm w-full"
                  placeholder="Search Section Schedule"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="text-xl" />
              </label>
            </div>
          </div>

          {/* Sort Button */}
          <div className="dropdown join flex justify-start mb-4 relative">
            <div tabIndex={0} role="button" className="btn">Sort by:</div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              <li><button onClick={() => handleSort('Grade Level, Ascending')}>Grade Level, Ascending</button></li>
              <li><button onClick={() => handleSort('Grade Level, Descending')}>Grade Level, Descending</button></li>
              <li><button onClick={() => handleSort('Section Name, A-Z')}>Section Name, A-Z</button></li>
              <li><button onClick={() => handleSort('Section Name, Z-A')}>Section Name, Z-A</button></li>
              <li><button onClick={() => handleSort('Program, A-Z')}>Program, A-Z</button></li>
              <li><button onClick={() => handleSort('Program, Z-A')}>Program, Z-A</button></li>
            </ul>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table">
              {/* Table Head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Grade Level</th>
                  <th>Section Name</th>
                  <th>Program</th>
                  <th>View Schedule</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((schedule, index) => (
                    <tr key={schedule.id} className="hover">
                      <th>{index + 1}</th>
                      <td>{schedule.gradeLevel}</td>
                      <td>{schedule.sectionName}</td>
                      <td>{schedule.program}</td>
                      <td>
                        <div className="dropdown dropdown-right">
                          <button
                            tabIndex={0}
                            className="btn btn-sm btn-primary">
                            View Schedule
                          </button>
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-box shadow w-64 p-2">
                            <li><a>Math: 8:00 AM - 9:00 AM</a></li>
                            <li><a>Science: 9:00 AM - 10:00 AM</a></li>
                            <li><a>English: 10:00 AM - 11:00 AM</a></li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No results found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default InternalPage;
