import React from "react";
import { useSelector } from "react-redux";

const ViolationList = ({ violations }) => {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);
    const { programs } = useSelector((state) => state.program);

    const emptyDatabases = [];

    if (Object.keys(sections).length === 0) {
        emptyDatabases.push("sections");
    }

    if (Object.keys(teachers).length === 0) {
        emptyDatabases.push("teachers");
    }

    if (Object.keys(subjects).length === 0) {
        emptyDatabases.push("subjects");
    }

    if (Object.keys(programs).length === 0) {
        emptyDatabases.push("programs");
    }

    return (
        <div className="join join-vertical mt-4 w-full">
            {violations.length > 0 &&
                violations.map((violation) => (
                    <div
                        key={violation.type}
                        className="flex gap-2 join-item border-error border rounded-lg p-2"
                    >
                        <div className="badge bg-error text-primary-content">
                            error
                        </div>
                        {violation.type === "teachersNotCovered" && (
                            <div>
                                <div>
                                    {Object.keys(violation.variable).length ===
                                    1 ? (
                                        <div>Unallocated Teacher: </div>
                                    ) : (
                                        <div>Unallocated Teachers: </div>
                                    )}

                                    {Object.entries(violation.variable).map(
                                        ([teacher, teacherSubjects]) => (
                                            <div
                                                key={`violation-${teachers[teacher].id}`}
                                                className="flex gap-2 px-2 items-center"
                                            >
                                                <div className="w-20">
                                                    {teachers[teacher].teacher}
                                                </div>
                                                <div className="divider divider-horizontal mx-1"></div>
                                                <div className="flex gap-2 p-1">
                                                    {teacherSubjects.map(
                                                        (subject) => (
                                                            <p
                                                                key={`violation-${subjects[subject].id}`}
                                                                className="px-2 border border-gray-500 border-opacity-30"
                                                            >
                                                                {
                                                                    subjects[
                                                                        subject
                                                                    ].subject
                                                                }
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {violation.type === "emptyDatabase" && (
                            <div className="flex gap-2">
                                <div>Databases without entries:</div>
                                <div className="flex gap-2">
                                    {emptyDatabases.map((db) => (
                                        <p
                                            key={`violation-${db}`}
                                            className="px-2 border border-gray-500 border-opacity-30"
                                        >
                                            {db}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {violation.type === "subjectsNotCovered" && (
                            <div className="flex gap-2">
                                <div>
                                    Databases without entries:
                                </div>
                                <div className="flex gap-2">
                                    {violation.variable.map((subject) => (
                                        <p
                                            key={`violation-${subjects[subject].id}`}
                                            className="px-2 border border-gray-500 border-opacity-30"
                                        >
                                            {subjects[subject].subject}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ))}
        </div>
    );
};

export default ViolationList;
