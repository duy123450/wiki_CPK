import { useState, useEffect } from 'react';


export const useLegalDocument = (type, lang) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/legal/${type}?lang=${lang}`);
        if (!res.ok) throw new Error('Failed to fetch legal document');
        setData(await res.json());
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [type, lang]);

  return { data, loading, error };
};
