import axios from "axios";

// Set at build time: .env.development points at the local API, and the host
// building the production site must set VITE_API_URL to the deployed one.
// There is no fallback on purpose — a missing value used to mean a production
// site quietly calling https://localhost on every visitor's own machine.
const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL)
    console.error("VITE_API_URL is not set, so the API cannot be reached. Set it when building the site.");

const client = axios.create({
    baseURL,
    headers: {"Content-Type" : "application/json"}
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if(token)
        config.headers.Authorization = `Bearer ${token}`
    return config;

})

export default client;
