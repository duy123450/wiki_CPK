import axios from "axios";

export const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || "sukaBlyatToken";
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://wiki-cpk-be.onrender.com/api/v1/wiki";
export const ACCESS_TOKEN_UPDATED_EVENT = "wiki-cpk:access-token-updated";

const redirectToLogin = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.assign("/login");
};

const saveAccessToken = (accessToken) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    window.dispatchEvent(
        new CustomEvent(ACCESS_TOKEN_UPDATED_EVENT, { detail: { accessToken } })
    );
};

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest._skipAuthRefresh
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const refreshResponse = await api.post("/auth/refresh", undefined, {
                _skipAuthRefresh: true,
            });
            const accessToken = refreshResponse.data?.accessToken || refreshResponse.data?.token;

            if (!accessToken) {
                throw new Error("Refresh response did not include an access token");
            }

            saveAccessToken(accessToken);
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return api.request(originalRequest);
        } catch (refreshError) {
            const refreshStatus = refreshError.response?.status;
            if (refreshStatus === 401 || refreshStatus === 403 || !refreshStatus) {
                redirectToLogin();
            }

            return Promise.reject(refreshError);
        }
    }
);

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

export const refreshAccessToken = () =>
    api.post("/auth/refresh", undefined, { _skipAuthRefresh: true }).then((res) => {
        const accessToken = res.data?.accessToken || res.data?.token;
        if (accessToken) saveAccessToken(accessToken);
        return res.data;
    });

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

// ─── Google OAuth ───────────────────────────────────────────────────────────

export const getGoogleLoginUrl = () => {
    return `${API_BASE_URL}/auth/google`;
};
// ─── Twitter OAuth ──────────────────────────────────────────────────────

export const getTwitterLoginUrl = () => {
    return `${API_BASE_URL}/auth/x`;
};

// ─── Discord OAuth ──────────────────────────────────────────────────────

export const getDiscordLoginUrl = () => {
    return `${API_BASE_URL}/auth/discord`;
};