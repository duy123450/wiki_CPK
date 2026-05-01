import axios from "axios";

export const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || "sukaBlyatToken";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
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
    const params = { currentTrackId, mode, movieId };
    if (mode === "shuffle") {
        params._t = Date.now(); // cache buster to ensure true randomness
    }
    const res = await api.get("/soundtrack/next", { params });
    return res.data;
};

export const fetchMovieInfo = async () => {
    const res = await api.get("/movie-info");
    return res.data; // { movie: { _id, title, ... } }
};

// ─── Characters ───────────────────────────────────────────────────────────────

export const getCharacters = (params = {}) =>
    api.get("/characters", { params }).then((res) => res.data);

export const getCharacterBySlug = (slug) =>
    api.get(`/characters/${slug}`).then((res) => res.data.character);

// ─── Authentication ─────────────────────────────────────────────────────────

export const registerUser = (payload) =>
    api.post("/auth/register", payload).then((res) => res.data);

export const loginUser = (payload) =>
    api.post("/auth/login", payload).then((res) => res.data);

export const getCurrentUser = () =>
    api.get("/auth/me").then((res) => res.data.user);

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.put("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { avatar: { url, public_id } }
};

export const updateProfile = async (payload) => {
    const res = await api.put("/auth/profile", payload);
    return res.data; // { user, token }
};
