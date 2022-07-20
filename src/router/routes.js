import {Scene2} from "../Views/Scene2";
import {Scene3} from "../Views/Scene3";
import {Scene4} from "../Views/Scene4";
import {Scene5} from "../Views/Scene5";
import {Scene6} from "../Views/Scene6";

export const Routes = [
    // {label: "Basic Cube Render", route: "/scene1", component: Scene1},
    {
        label: "Colored Faces Icosahedron",
        route: "/scene2",
        component: Scene2,
    },
    {
        label: "Duck",
        route: "/scene3",
        component: Scene3,
    },
    {
        label: "Abandonded Room",
        route: "/scene4",
        component: Scene4,
    },
    {
        label: "Solar Sys",
        route: "/scene5",
        component: Scene5,
    }, {
        label: "Hit 'em",
        route: "/scene6",
        component: Scene6,
    },
];
