import axios from "axios";
import { api1, api2 } from "../baseUrl"
const API_BASE_URL = `${api1}/content-management`;

export const getAllContent = async () => {
  return axios.get(`${API_BASE_URL}/`);
};
