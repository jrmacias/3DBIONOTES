import React from "react";
import { HashRouter, Redirect, Route, Switch, useLocation } from "react-router-dom";
import { AppContext } from "../../../webapp/components/AppContext";
import { ProtvistaGrouped } from "../../components/protvista/ProvistaGrouped";
import { RootViewer } from "../../components/RootViewer";
import { sendAnalytics } from "../../utils/analytics";
import "./App.css";

function App() {
    return (
        <AppContext>
            <HashRouter>
                <Switch>
                    <RouterTracking>
                        <Route
                            path="/protvista-all/:selection"
                            render={() => <ProtvistaGrouped />}
                        />
                        <Route
                            path="/uploaded/:token"
                            render={() => <RootViewer from="uploaded" />}
                        />
                        <Route
                            path="/network/:token"
                            render={() => <RootViewer from="network" />}
                        />
                        <Route path="/:selection" render={() => <RootViewer from="selector" />} />
                        <Route exact path="/">
                            <Redirect to="/6zow+EMD-11328" />
                        </Route>
                    </RouterTracking>
                </Switch>
            </HashRouter>
        </AppContext>
    );
}

const RouterTracking: React.FC = props => {
    return <>{props.children}</>;
};

export default App;
