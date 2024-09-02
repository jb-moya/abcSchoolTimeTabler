import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
const breadcrumbs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Timetable', path: '/schedule/timetable' },
  { name: 'Sections', path: '/schedule/sections' },
];
const Sections = () => {
  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb breadcrumbs={breadcrumbs} />
      </div>
    </>
  );
};

export default Sections;
