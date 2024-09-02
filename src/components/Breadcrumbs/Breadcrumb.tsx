import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbProps {
  breadcrumbs: BreadcrumbItem[];
}

const Breadcrumb = ({ breadcrumbs }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {breadcrumbs[breadcrumbs.length - 1].name}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={index}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link className="font-medium" to={breadcrumb.path}>
                    {breadcrumb.name} /
                  </Link>
                </>
              ) : (
                <span className="font-medium text-primary">
                  {breadcrumb.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
