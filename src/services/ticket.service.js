
import axiosInstance from "./axiosInstance";
//const API_URL = "http://localhost:8080/api";

export async function getMyTickets() {
    const res = await  axiosInstance.get(`/my-tickets`)
    return res.data;
}

export default { getMyTickets };