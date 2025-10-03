import React, { useEffect, useState } from "react";
import { Config } from "./config";


interface Props {
    config: Config
}


type StatusCategory = 'Writers' | 'Desk' | 'Production Editor' | 'Subs' | 'Revise' | 'Final' | 'Hold'

type ApiResponse = {
    count: Partial<Record<StatusCategory, number>> & { total: number };
    content: Partial<Record<StatusCategory, unknown>>
}

const searchUrl = "/api/content"



const Report = () => {

    const [data, setData] = useState<ApiResponse | undefined>(undefined)

    useEffect(() => {
        fetch(searchUrl).then(response => response.json()).then(data => {
            console.log('DATA',data)
            setData(data)
        })
    }, [setData])

    return (
        <span>You are assigned {data?.count.total ?? '??'} pieces</span>
    )

}

export const SearchApp: React.FunctionComponent<Props> = ({ config }) => {
    return <div>
        This is the search app.
        {config.user && (
            <p>hello, {config.user.firstName ?? config.user.email} </p>
        )}
        <Report />
    </div>
}
