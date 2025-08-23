import axios from "axios";

export const api = axios.create({
    baseURL:"http://localhost:1122"
})

// body = body in post / get ""
export const register = async (
    {body}:any
) => {
    return await api.post("do/d1",body,{
        headers:{Authorization:"Bearer"}
    })
}