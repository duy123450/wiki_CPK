import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const getMovieInfo = () => api.get("/movie-info").then((res) => res.data.movie);
export const getSidebar = () => api.get("/sidebar").then((res) => res.data.categories);
export const getPageBySlug = (slug) => api.get(`/page/${slug}`).then((res) => res.data);