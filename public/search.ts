import { render } from "react-dom"
import { SearchApp } from "./search-app/SearchApp"
import { WindowWithConfig } from "./search-app/config"

const config = (global as WindowWithConfig)._wfConfig;
const mountPoint = document.querySelector('#main')!;

render(SearchApp({config})!, mountPoint)