import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import TeacherRankListContainer from '@components/Admin/Teacher/TeacherRankListContainer';
import Breadcrumbs from '@components/Admin/Breadcrumbs';


function Teachers() {

  const links = [
    { name: 'Home', href: '/' },
    // { name: 'Modify Subjects', href: '/modify-subjects' },
  ];

  return (
    <div className="App container mx-auto px-4 mb-10">

    <Breadcrumbs title="Modify Teachers" links={links} />
  
    {/* Main Content */}
    <div className="flex flex-col gap-4">
      <div className="card w-full bg-base-100 shadow-md">
        <div className="card-body">
          <TeacherListContainer editable={true} />
        </div>
      </div>
      <div className="card w-full bg-base-100 shadow-md">
        <div className="card-body">
          <TeacherRankListContainer editable={true} />
        </div>
        
      </div>
    </div>
  </div>
  );

 
}

export default Teachers;
