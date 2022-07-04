import './index.scss';
import {Link} from "react-router-dom";

//add your links here
const LINKS = [{
    label: 'Basic Cube Render',
    route: '/scene1'
}]

export const Catalogue = () => {
    return <div className={'catalogue'}>
        <div className={'links-container'}>
            {
                LINKS.map(({label, route}) => <div className={'link'}>
                        <Link to={route}>{label}</Link>
                    </div>
                )
            }
        </div>
    </div>
}
