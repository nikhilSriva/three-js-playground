import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {Catalogue} from "../Views/Catalogue";
import {Scene1} from "../Views/Scene1";
import {Scene2} from "../Views/Scene2";

export const AppRouter = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Catalogue}/>
                <Route path="/scene1" exact component={Scene1}/>
                <Route path="/scene2" exact component={Scene2}/>
            </Switch>
        </Router>
    );
};
