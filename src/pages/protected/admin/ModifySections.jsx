import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/common/headerSlice";
import ModifySections from "../../features/admin/sections";

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: "ModifySections" }));
  }, []);

  return <ModifySections />;
}

export default InternalPage;
