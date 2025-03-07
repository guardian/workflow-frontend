import React, { useEffect, useState } from "react";
import { Config } from "./config";

// const _window = window as unknown as Record<string, unknown>

// require('react-dom');
// _window.React2 = require('react');
// console.log('SAME??',_window.React1 === _window.React2);

interface Props {
    config: Config
}


type StatusCategory = 'Writers' | 'Desk' | 'Production Editor' | 'Subs' | 'Revise' | 'Final' | 'Hold'

type ApiResponse = {
    count: Partial<Record<StatusCategory, number>> & { total: number }
    content: Partial<Record<StatusCategory, unknown>>
}

const searchUrl = "/api/content"

export const SearchApp: React.FunctionComponent<Props> = ({ config }) => {

    const [data, setData] = useState<ApiResponse | undefined>(undefined)

    useEffect(() => {
        fetch(searchUrl).then(response => response.json).then(data => {
            console.log(data)
        })
    }, [setData])

    return <div>
        This is the search app.
        {config.user && (
            <p>hello, {config.user.firstName ?? config.user.email} </p>
        )}

        count = {data?.count.total ?? 'NO DATA'}
    </div>

}