import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import '../styles/layout.css'; // Shared CSS

interface Company {
  id: number;
  name: string;
  code: string;
  services_count?: number; // matched from your table mapping
  created_at: string;
  unite?: number;
}

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', code: '', unite: '' });

  const safeCompanies = Array.isArray(companies) ? companies : [];

  const fetchCompanies = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/companies/', { params });
    setCompanies(res.data.results || res.data);
  };

  useEffect(() => {
    fetchCompanies();
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
    // eslint-disable-next-line
  }, [filter]);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '', unite: '' });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        // OPTIMISTIC UPDATE: Update array immediately
        const res = await axios.put(`/api/companies/${editing.id}/`, form);
        setCompanies(companies.map(c => c.id === editing.id ? res.data : c));
      } else {
        // OPTIMISTIC UPDATE: Append immediately
        const res = await axios.post('/api/companies/', form);
        setCompanies([...companies, res.data]);
      }
      closeForm();
    } catch (err) {
      console.error("Error saving company", err);
    }
  };

  const handleEdit = (company: Company) => {
    setEditing(company);
    setForm({ name: company.name, code: company.code, unite: company.unite ? String(company.unite) : '' });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this company?")) {
      await axios.delete(`/api/companies/${id}/`);
      // OPTIMISTIC UPDATE: Filter array immediately
      setCompanies(companies.filter(c => c.id !== id));
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Companies</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Companies Directory</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input type="text" placeholder="Search by name or code..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </header>

      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">New Company</h2>
          <p className="card-subtitle">Add a new corporate entity to the system.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <BusinessIcon fontSize="small" /> Add Company
          </button>
        </div>
        <div className="card">
          <div className="card-title">
            <span>INTELLIGENT FILTERS</span>
            <button className="text-btn">RESET ALL</button>
          </div>
          <div className="filters-row">
             <div className="filter-group">
              <label className="filter-label">Unite</label>
              <select className="filter-select"><option>All Unites</option></select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>Registered Companies</h2>
            <p className="card-subtitle" style={{margin: 0}}>{safeCompanies.length} total companies</p>
          </div>
          <button className="btn btn-outline"><DownloadIcon fontSize="small" /> Export</button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Services Count</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeCompanies.map(company => (
              <tr key={company.id}>
                <td><strong>{company.name}</strong></td>
                <td><span className="status-pill permanent">{company.code}</span></td>
                <td>{company.services_count || 0}</td>
                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(company)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(company.id)}><DeleteIcon fontSize="small" /></button>
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
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Company' : 'Add Company'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Company Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Unite</label>
                <select value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} required>
                  <option value="" disabled>Select unite...</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
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
export default CompaniesPage;