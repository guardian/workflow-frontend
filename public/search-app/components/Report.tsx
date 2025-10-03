/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { Config } from "search-app/config";


interface Props {
    statusCategories: Config['statuses']
}


type ApiResponse = {
    count: Record<string, number> & { total: number };
    content: Record<string, unknown>
}

const searchUrl = "/api/content"



export const Report = ({ statusCategories }: Props) => {

    const [data, setData] = useState<ApiResponse | undefined>(undefined)

    const loadData = () => {
        fetch(searchUrl).then(response => response.json()).then(data => {
            console.log(data)
            setData(data)
        })
    };

    useEffect(loadData, [setData])

    return (
        <div>
            <button onClick={loadData}>reload data</button>
            {data && (
                <table>
                    <caption>You are assigned {data?.count.total ?? '??'} pieces</caption>
                    <tbody>
                        {statusCategories.map(status => (
                            <tr key={status}>
                                <th>{status}</th>
                                <td>{data.count[status] ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )

}


