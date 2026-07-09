import { useEffect, useState } from 'react';
import { fetchAPI } from './api';

export function useFetch<T>(endpoint: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {

        let ignore = false;

        fetchAPI<T>(endpoint)
            .then((res) => {
                if (!ignore) setData(res);
            })
            .catch((err) => {
                if (!ignore) setError(err.message);
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };

    }, [endpoint]);

    return { data, loading, error };


}