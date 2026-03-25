import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import '../styles/layout.css';

interface Year {
  id: number;
  year: number;
  total_quota: number;
  is_closed: boolean;
  created_at: string;
}

const YearsPage = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [filter, setFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Year | null>(null);
  const [form, setForm] = useState({ year: '', total_quota: '', is_closed: false });

  const fetchYears = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/years/', { params });
    setYears(res.data.results || res.data);
  };
  
  useEffect(() => { fetchYears(); }, [filter]);

  const openNewForm = () => {
    setEditing(null);
    setForm({ year: '', total_quota: '', is_closed: false });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/years/${editing.id}/`, form);
    } else {
      await axios.post('/api/years/', form);
    }
    closeForm();
    fetchYears();
  };

  const handleEdit = (year: Year) => {
    setEditing(year);
    setForm({ year: String(year.year), total_quota: String(year.total_quota), is_closed: year.is_closed });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this fiscal year?")) {
      await axios.delete(`/api/years/${id}/`);
      fetchYears();
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Fiscal Years</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Years Configuration</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input type="text" placeholder="Search years..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </header>

      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">New Fiscal Year</h2>
          <p className="card-subtitle">Initialize a new financial year and total quotas.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <CalendarTodayIcon fontSize="small" /> Add Year
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>Year Registries</h2>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Total Quota</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year.id}>
                <td><strong>{year.year}</strong></td>
                <td>{year.total_quota}</td>
                <td>
                  <span className={`status-pill ${year.is_closed ? 'intern' : 'permanent'}`}>
                    {year.is_closed ? 'Closed' : 'Active'}
                  </span>
                </td>
                <td>{new Date(year.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(year)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(year.id)}><DeleteIcon fontSize="small" /></button>
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
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Year' : 'Add Year'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fiscal Year</label>
                <input type="number" className="filter-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Total Quota</label>
                <input type="number" className="filter-select" value={form.total_quota} onChange={e => setForm(f => ({ ...f, total_quota: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.is_closed} onChange={e => setForm(f => ({ ...f, is_closed: e.target.checked }))} id="closedCheck" />
                <label htmlFor="closedCheck" style={{margin: 0}}>Is Closed?</label>
              </div>
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
export default YearsPage;