import React from "react";
import { Report } from "./components/Report";
import { Config } from "./config";


interface Props {
    config: Config
}


export const SearchApp: React.FunctionComponent<Props> = ({ config }) => {
    console.log(config)
    return <div style={{
        maxWidth: 1200,
        margin: '0 auto',
    }}>
        <h1>Search</h1>
        {config.user && (
            <p>hello, {config.user.firstName ?? config.user.email} </p>
        )}
        <Report statusCategories={config.statuses} />
    </div>
}
