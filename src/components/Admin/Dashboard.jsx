import React from "react";
import { BiSolidBookBookmark } from "react-icons/bi";
import { MdGroups3, MdPerson } from "react-icons/md";
import { useSelector } from "react-redux";

const Dashboard = () => {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);

    return (
        <div className="stats shadow">
            <div className="stat">
                <div className="stat-figure text-primary">
                    <BiSolidBookBookmark size={50} />
                </div>
                <div className="stat-title">Total Subjects</div>
                <div className="stat-value text-accent">
                    {Object.keys(subjects).length}
                </div>
                {/* <div className="stat-desc">21% more than last month</div> */}
            </div>

            <div className="stat">
                <div className="stat-figure text-secondary">
                    <MdPerson size={50} />
                </div>
                <div className="stat-title">Total Teachers</div>
                <div className="stat-value text-accent">
                    {Object.keys(teachers).length}
                </div>
                {/* <div className="stat-desc">21% more than last month</div> */}
            </div>

            <div className="stat">
                <div className="stat-figure text-secondary">
                    <MdGroups3 size={50} />
                </div>
                <div className="stat-title">Total Sections</div>
                <div className="stat-value text-accent">
                    {Object.keys(sections).length}
                </div>
                {/* <div className="stat-desc">21% more than last month</div> */}
            </div>
        </div>
    );
};

export default Dashboard;
