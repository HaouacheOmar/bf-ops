import React, { useState, useEffect } from 'react';
import { api } from '../api'; // Swapped out createUnite to use api.post directly for consistency
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import '../styles/layout.css';

const UniteCreatePage: React.FC = () => {
  const [unites, setUnites] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchUnites = async () => {
    const res = await api.get('/unites/');
    setUnites(res.data.results || res.data);
  };
  
  useEffect(() => { fetchUnites(); }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        // UPDATE: Send to backend, then update the exact item in local state
        const res = await api.put(`/unites/${editing.id}/`, form);
        setUnites(unites.map(u => u.id === editing.id ? res.data : u));
      } else {
        // CREATE: Send to backend, then append the new item to local state
        const res = await api.post('/unites/', form);
        setUnites([...unites, res.data]);
      }
      closeForm();
      // Notice: No fetchUnites() called here anymore! 
    } catch (err: any) {
      if (err?.response?.data) {
        setError(err.response.data.detail || JSON.stringify(err.response.data));
      } else {
        setError('Error saving unite');
      }
    }
  };

  const handleEdit = (unite: any) => {
    setEditing(unite);
    setForm({ name: unite.name, code: unite.code });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this unite?")) {
      await api.delete(`/unites/${id}/`);
      // DELETE: Filter the item out of the local state immediately
      setUnites(unites.filter(u => u.id !== id));
      // Notice: No fetchUnites() called here anymore!
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Business Unites</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Unites Directory</span></span>
        </div>
      </header>

      <div className="top-grid" style={{gridTemplateColumns: '300px'}}>
        <div className="card">
          <h2 className="card-title">New Unite</h2>
          <p className="card-subtitle">Create a new organizational structure unit.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <AccountTreeIcon fontSize="small" /> Add Unite
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{marginBottom: '4px'}}>Registered Unites</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {unites.map((unite) => (
              <tr key={unite.id}>
                <td><strong>{unite.name}</strong></td>
                <td><span className="status-pill permanent">{unite.code}</span></td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(unite)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(unite.id)}><DeleteIcon fontSize="small" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Unite' : 'Create Unite'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Unite Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Unite Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UniteCreatePage;