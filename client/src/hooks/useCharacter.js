import { useState, useEffect } from "react";
import { getCharacterBySlug } from "../services/api";

export function useCharacter(slug) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getCharacterBySlug(slug)
      .then((data) => {
        if (isMounted) setCharacter(data);
      })
      .catch((e) => {
        if (isMounted) setError(e.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { character, loading, error };
}
