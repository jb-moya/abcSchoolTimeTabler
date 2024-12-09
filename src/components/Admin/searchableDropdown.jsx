// import { useState, useRef, useEffect } from "react";
// import { IoChevronDown } from "react-icons/io5";
// import { useSelector } from "react-redux";
// import { filterObject } from "@utils/filterObject";
// import escapeRegExp from "@utils/escapeRegExp";
// import { IoRemove, IoAdd } from "react-icons/io5";
// import clsx from "clsx";

// const SearchableDropdownToggler = ({
//   selectedList,
//   setSelectedList,
//   isEditMode = false,
// }) => {
//   const subjects = useSelector((state) => state.subject.subjects);
//   const [searchSubjectValue, setSearchSubjectValue] = useState("");
//   const searchInputRef = useRef(null);

//   const searchResults = filterObject(subjects, ([, subject]) => {
//     const escapedSearchValue = escapeRegExp(searchSubjectValue)
//       .split("\\*")
//       .join(".*");

//     const pattern = new RegExp(escapedSearchValue, "i");

//     return pattern.test(subject.subject);
//   });

//   useEffect(() => {
//     console.log(searchResults);
//   }, [searchResults]);

//   useEffect(() => {
//     let observerRefValue = null;

//     const handleBlur = () => {
//       setTimeout(() => {
//         searchInputRef.current.focus();
//       }, 0);
//     };

//     if (searchInputRef.current) {
//       searchInputRef.current.addEventListener("blur", handleBlur);
//       observerRefValue = searchInputRef.current;
//     }

//     return () => {
//       if (observerRefValue) {
//         observerRefValue.removeEventListener("blur", handleBlur);
//       }
//     };
//   }, [searchSubjectValue]);

//   useEffect(() => {
//     if (searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [searchSubjectValue]);

//   const handleInputChange = (e) => {
//     setSearchSubjectValue(e.target.value);
//   };

//   const toggleSubject = (subjectID) => {
//     const updatedList = selectedList.includes(subjectID)
//       ? selectedList.filter((id) => id !== subjectID)
//       : [...selectedList, subjectID];

//     setSelectedList(updatedList);
//     console.log(`Updated selected list:`, updatedList); // Log updated selected list
//   };

//   return (
//     <div className="dropdown">
//       <div tabIndex={0} role="button" className="btn m-1">
//         {isEditMode ? (
//           <div>
//             Edit Subject<span>(s)</span>
//           </div>
//         ) : (
//           <div>Add subject</div>
//         )}
//         <IoChevronDown size={16} />
//       </div>
//       <ul
//         tabIndex={0}
//         className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
//       >
//         <li>
//           <input
//             type="text"
//             placeholder="Search subject"
//             ref={searchInputRef}
//             className="input input-bordered input-sm w-full max-w-xs"
//             value={searchSubjectValue}
//             onChange={(e) => {
//               handleInputChange(e);
//             }}
//           />
//         </li>
//         {Object.keys(searchResults).length === 0 ? (
//           <div className="px-4 py-2 opacity-50">Not found</div>
//         ) : (
//           Object.entries(searchResults).map(([, subject]) => (
//             <li
//               role="button"
//               key={subject.id}
//               onClick={() => toggleSubject(subject.id)}
//             >
//               <div className="flex justify-between">
//                 <a className={clsx("w-full")}>{subject.subject}</a>
//                 {selectedList.includes(subject.id) ? (
//                   <IoRemove size={20} className="text-red-500" />
//                 ) : (
//                   <IoAdd size={20} className="text-green-400" />
//                 )}
//               </div>
//             </li>
//           ))
//         )}
//       </ul>
//     </div>
//   );
// };

// export default SearchableDropdownToggler;


// import { useRef } from "react";
// import { IoChevronDown, IoRemove, IoAdd } from "react-icons/io5";
// import { useSelector } from "react-redux";
// import { filterObject } from "@utils/filterObject";
// import escapeRegExp from "@utils/escapeRegExp";
// import clsx from "clsx"; // Import clsx

// const SearchableDropdownToggler = ({ selectedList, setSelectedList, isEditMode = false }) => {
//   const subjects = useSelector((state) => state.subject.subjects);
//   const searchSubjectValue = useRef(""); // Replaced with DOM handling
//   const searchInputRef = useRef(null);

//   // Filtering the subjects based on search input
//   const searchResults = filterObject(subjects, ([, subject]) => {
//     const escapedSearchValue = escapeRegExp(searchSubjectValue.current)
//       .split("\\*")
//       .join(".*");

//     const pattern = new RegExp(escapedSearchValue, "i");
//     return pattern.test(subject.subject);
//   });

//   const handleInputChange = (e) => {
//     searchSubjectValue.current = e.target.value;
//   };

//   // Handling adding/removing subjects
//   const toggleSubject = (subjectID) => {
//     const updatedList = selectedList.includes(subjectID)
//       ? selectedList.filter((id) => id !== subjectID)
//       : [...selectedList, subjectID];

//     setSelectedList(updatedList);
//     console.log(`Updated selected list:`, updatedList);
//   };

//   // Open the modal using DOM
//   const openModal = () => {
//     document.getElementById("subject-modal").showModal();
//   };

//   // Close the modal using DOM
//   const closeModal = () => {
//     document.getElementById("subject-modal").close();
//   };

//   return (
//     <div>
//     {/* Button to open the modal */}
//     <button className="btn m-1" onClick={openModal}>
//       {isEditMode 
//         ? `Edit Subject(s) (${selectedList.length})` 
//         : `Selected Subjects: ${selectedList.length}`} 
//     </button>

//     {/* Nested Modal */}
//     <dialog id="subject-modal" className="modal" style={{ zIndex: 1050 }}>
//       <div className="modal-box w-6/12 max-w-sm h-96">
//         <h3 className="text-lg font-bold mb-4">Search Subjects</h3>

//         {/* Input for searching subjects */}
//         <input
//           type="text"
//           placeholder="Search subject"
//           ref={searchInputRef}
//           className="input input-bordered input-sm w-full mb-4"
//           onChange={handleInputChange}
//         />

//         {/* Display search results */}
//         {Object.keys(searchResults).length === 0 ? (
//           <div className="px-4 py-2 opacity-50">Not found</div>
//         ) : (
//           <ul className="menu bg-base-100 rounded-box shadow">
//             {Object.entries(searchResults).map(([, subject]) => (
//               <li
//                 role="button"
//                 key={subject.id}
//                 onClick={() => toggleSubject(subject.id)}
//               >
//                 <div className={clsx("flex justify-between p-2", { "bg-gray-100": selectedList.includes(subject.id) })}>
//                   <span className="w-full">{subject.subject}</span>
//                   {selectedList.includes(subject.id) ? (
//                     <IoRemove size={20} className="text-red-500" />
//                   ) : (
//                     <IoAdd size={20} className="text-green-400" />
//                   )}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* Modal close button */}
//         <div className="modal-action">
//           <button
//             className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
//             onClick={closeModal}
//           >
//             ✕
//           </button>
//         </div>
//       </div>
//     </dialog>
//   </div>
// );
// };

// export default SearchableDropdownToggler;


import { useState, useRef, useEffect } from "react";
import { IoChevronDown, IoRemove, IoAdd } from "react-icons/io5";
import { useSelector } from "react-redux";
import { filterObject } from "@utils/filterObject";
import escapeRegExp from "@utils/escapeRegExp";
import clsx from "clsx";

const SearchableDropdownToggler = ({
  selectedList,
  setSelectedList,
  isEditMode = false,
}) => {
  const subjects = useSelector((state) => state.subject.subjects);
  const [searchSubjectValue, setSearchSubjectValue] = useState("");
  const searchInputRef = useRef(null);

  const searchResults = filterObject(subjects, ([, subject]) => {
    const escapedSearchValue = escapeRegExp(searchSubjectValue)
      .split("\\*")
      .join(".*");

    const pattern = new RegExp(escapedSearchValue, "i");
    return pattern.test(subject.subject);
  });

  // useEffect(() => {
  //   console.log(searchResults);
  // }, [searchResults]);

  const handleInputChange = (e) => {
    setSearchSubjectValue(e.target.value);
  };

  const toggleSubject = (subjectID) => {
    const updatedList = selectedList.includes(subjectID)
      ? selectedList.filter((id) => id !== subjectID)
      : [...selectedList, subjectID];

    setSelectedList(updatedList);
    // console.log(`Updated selected list:`, updatedList); // Log updated selected list
  };

  return (
    <div className="dropdown w-full max-w-md md:max-w-lg lg:max-w-xl">
      <div
        tabIndex={0}
        role="button"
        className="btn m-1 w-full flex justify-between items-center"
      >
        {isEditMode ? (
          <div className="text-left">
            Edit Subject<span>(s)</span>
          </div>
        ) : (
          <div className="text-left">Add subject</div>
        )}
        <IoChevronDown size={16} />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-42 h-auto shadow max-h-48 overflow-y-auto" // Updated here
      >
        <li>
          <input
            type="text"
            placeholder="Search subject"
            ref={searchInputRef}
            className="input input-bordered input-sm w-full"
            value={searchSubjectValue}
            onChange={handleInputChange}
          />
        </li>
        <div
          className="overflow-y-scroll h-full max-h-40 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {Object.keys(searchResults).length === 0 ? (
            <div className="px-4 py-2 opacity-50">Not found</div>
          ) : (
            Object.entries(searchResults).map(([, subject]) => (
              <li
                role="button"
                key={subject.id}
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="flex justify-between whitespace-nowrap items-center">
                  <a className={clsx("w-full")}>{subject.subject}</a>
                  {selectedList.includes(subject.id) ? (
                    <IoRemove size={20} className="text-red-500" />
                  ) : (
                    <IoAdd size={20} className="text-green-400" />
                  )}
                </div>
              </li>
            ))
          )}
        </div>
      </ul>
    </div>
  );
};

export default SearchableDropdownToggler;