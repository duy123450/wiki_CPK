import { useState, useEffect } from 'react';
import { validateData } from '../utils/api-validator';
import { legalDocumentResponseSchema } from '../schemas/legalSchemas';
import { envConfig } from '../config/env.config';

export const useLegalDocument = (type, lang) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = envConfig.VITE_API_BASE_URL
          ? envConfig.VITE_API_BASE_URL.replace('/api/v1/wiki', '')
          : 'http://localhost:3000';
        const res = await fetch(`${base}/api/v1/legal/${type}?lang=${lang}`);
        if (!res.ok) throw new Error('Failed to fetch legal document');
        const json = await res.json();
        const validatedData = validateData(legalDocumentResponseSchema, json, 'Legal Document');
        setData(validatedData);
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
