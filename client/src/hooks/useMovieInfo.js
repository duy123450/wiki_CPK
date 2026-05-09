import { useEffect, useState } from "react";
import { getMovieInfo } from "../services/api";

export default function useMovieInfo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMovieInfo()
      .then((movie) => setData(movie))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
