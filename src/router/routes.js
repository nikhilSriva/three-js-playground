import { Scene1 } from "../Views/Scene1";
import { Scene2 } from "../Views/Scene2";
import { Scene3 } from "../Views/Scene3";
import { Scene4 } from "../Views/Scene4";

export const Routes = [
  { label: "Basic Cube Render", route: "/scene1", component: Scene1 },
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
];
