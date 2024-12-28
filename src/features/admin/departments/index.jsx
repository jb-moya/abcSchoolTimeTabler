import Breadcrumbs from '@components/Admin/Breadcrumbs';
import DepartmentListContainer from '../../../components/Admin/DepartmentComponents/DepartmentListContainer';


function Departments() {

  const links = [
    { name: 'Home', href: '/' },
    // { name: 'Modify Subjects', href: '/modify-subjects' },
  ];

  return (
    <div className="App container mx-auto px-4 mb-10">

    <Breadcrumbs title="Modify Departments" links={links} />
  
    {/* Main Content */}
    <div className="flex flex-col gap-4">
      <div className="card w-full bg-base-100 hadow-md">
        <div className="card-body">
            <DepartmentListContainer editable={true} /> 
        </div>
      </div>
  
    </div>
  </div>
  );

 
}

export default Departments;
