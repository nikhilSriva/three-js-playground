import "./index.scss";
import {Link} from "react-router-dom";
import {Routes} from "../../router/routes";
import {Scene5} from "../Scene5";

export const Catalogue = () => {
    return (
        <div className={"catalogue"}>
            <div className={"links-container"}>
                {Routes.map(({label, route}) => (
                    <Link className={'link'} to={route}>{label}</Link>
                ))}
            </div>
            <div style={{position: 'absolute'}}>

                <Scene5 moveCamera={true}/>
            </div>
        </div>
    );
};
