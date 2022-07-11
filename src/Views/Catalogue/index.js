import "./index.scss";
import { Link } from "react-router-dom";
import { Routes } from "../../router/routes";

export const Catalogue = () => {
  return (
    <div className={"catalogue"}>
      <div className={"links-container"}>
        {Routes.map(({ label, route }) => (
          <div className={"link"}>
            <Link to={route}>{label}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};
