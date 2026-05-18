import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMovie } from "../store/slices/characterSlice";

export default function useMovieInfo() {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.characters.movie);
  const status = useAppSelector((state) => state.characters.movieStatus);
  const error = useAppSelector((state) => state.characters.movieError);

  useEffect(() => {
    dispatch(fetchMovie());
  }, [dispatch]);

  return {
    data,
    loading: status === "loading" || status === "idle",
    error,
  };
}

