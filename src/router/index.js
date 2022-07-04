import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {Catalogue} from "../Views/Catalogue";
import {Scene1} from "../Views/Scene1";

export const AppRouter = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Catalogue}/>
                <Route path="/scene1" exact component={Scene1}/>
            </Switch>
        </Router>
    );
};
