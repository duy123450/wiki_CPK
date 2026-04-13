import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const getMovieInfo = () => api.get("/movie-info").then((res) => res.data.movie);
export const getSidebar = () => api.get("/sidebar").then((res) => res.data.categories);
export const getPageBySlug = (slug) => api.get(`/page/${slug}`).then((res) => res.data);

// ─── Soundtrack ───────────────────────────────────────────────────────────────

export const fetchSoundtracks = async (movieId) => {
    const res = await api.get("/soundtrack", { params: { movieId } });
    return res.data;
};

export const fetchNextTrack = async ({ currentTrackId, mode, movieId }) => {
    const res = await api.get("/soundtrack/next", {
        params: { currentTrackId, mode, movieId }
    });
    return res.data;
};

export const fetchMovieInfo = async () => {
    const res = await api.get("/movie-info");
    return res.data; // { movie: { _id, title, ... } }
};
