import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCharacter } from "../store/slices/characterSlice";

export function useCharacter(slug) {
  const dispatch = useAppDispatch();
  const character = useAppSelector((state) => state.characters.bySlug[slug] || null);
  const status = useAppSelector((state) => state.characters.status[slug] || "idle");
  const error = useAppSelector((state) => state.characters.error[slug] || null);

  useEffect(() => {
    if (slug) {
      dispatch(fetchCharacter(slug));
    }
  }, [dispatch, slug]);

  return {
    character,
    loading: status === "loading" || status === "idle",
    error,
  };
}

