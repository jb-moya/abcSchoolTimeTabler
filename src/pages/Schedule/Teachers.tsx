import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
const breadcrumbs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Timetable', path: '/schedule/timetable' },
  { name: 'Teachers', path: '/schedule/teachers' },
];
const Teachers = () => {
  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb breadcrumbs={breadcrumbs} />
      </div>
    </>
  );
};

export default Teachers;
