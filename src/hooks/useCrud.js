import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export default function useCrud(endpoint, { search = '', autoLoad = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(endpoint, { params: { limit: 100, ...params } });
      setRows(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (autoLoad) load({ search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, search]);

  const create = async (payload) => {
    const { data } = await api.post(endpoint, payload);
    setRows((r) => [data.data, ...r]);
    return data.data;
  };

  const update = async (id, payload) => {
    const { data } = await api.put(`${endpoint}/${id}`, payload);
    setRows((r) => r.map((row) => (row._id === id ? data.data : row)));
    return data.data;
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    setRows((r) => r.filter((row) => row._id !== id));
  };

  const exportCsv = async () => {
    const res = await api.get(`${endpoint}/export/csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${endpoint.replace('/', '')}-export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return { rows, setRows, loading, error, load, create, update, remove, exportCsv };
}
