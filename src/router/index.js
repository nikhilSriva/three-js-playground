import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Catalogue } from "../Views/Catalogue";
import { Routes } from "./routes";

export const AppRouter = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Catalogue} />
        {Routes.map(({ route, component }) => (
          <Route key={route} path={route} component={component} />
        ))}
        {/* <Route path="/scene1" exact component={Scene1}/>
                <Route path="/scene2" exact component={Scene2}/>
                <Route path="/scene3" exact component={Scene2}/> */}
      </Switch>
    </Router>
  );
};
