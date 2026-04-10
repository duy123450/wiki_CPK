import axios from "axios";

const api = axios.create({
    baseURL: "/api/v1/wiki",
});

export const getMovieInfo = () => api.get("/movie-info").then((res) => res.data.movie);
export const getSidebar = () => api.get("/sidebar").then((res) => res.data.categories);
export const getPageBySlug = (slug) => api.get(`/page/${slug}`).then((res) => res.data);