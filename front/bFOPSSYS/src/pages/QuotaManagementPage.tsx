import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getUniteQuotas, createUniteQuota, updateUniteQuota, deleteUniteQuota } from '../api';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PieChartIcon from '@mui/icons-material/PieChart';
import '../styles/layout.css';

interface UniteQuota {
  id: number;
  year: number;
  unite: number;
  unite_name: string;
  quota: number;
}

const QuotaManagementPage: React.FC = () => {
  const [quotas, setQuotas] = useState<UniteQuota[]>([]);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<UniteQuota | null>(null);
  const [form, setForm] = useState<{ year: string; unite: string; quota: string }>({ year: '', unite: '', quota: '' });
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');

  useEffect(() => {
    getUniteQuotas().then(res => setQuotas(res.data.results || res.data));
    axios.get('/api/years/').then(res => setYears(res.data.results || res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ year: '', unite: '', quota: '' });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      year: parseInt(form.year),
      unite: parseInt(form.unite),
      quota: parseInt(form.quota),
    };

    if (payload.year && payload.unite) {
      const companiesRes = await axios.get('/api/companies/', { params: { unite: payload.unite } });
      const companyIds = (companiesRes.data.results || companiesRes.data).map((c: any) => c.id);
      const jobsRes = await axios.get('/api/jobs/');
      const jobs = (jobsRes.data.results || jobsRes.data).filter((j: any) => companyIds.includes(j.company));
      const sum = jobs.reduce((acc: number, j: any) => acc + Number(j.max_workers), 0);
      
      if (payload.quota < sum) {
        setPopupMsg(`The sum of max workers (${sum}) for jobs in this unite exceeds the yearly quota (${payload.quota}). Please adjust job quotas or increase the unite quota.`);
        setShowPopup(true);
        return;
      }
    }

    if (editing) {
      await updateUniteQuota(editing.id, payload);
    } else {
      await createUniteQuota(payload);
    }
    closeForm();
    getUniteQuotas().then(res => setQuotas(res.data.results || res.data));
  };

  const handleEdit = (quota: UniteQuota) => {
    setEditing(quota);
    setForm({ year: String(quota.year), unite: String(quota.unite), quota: String(quota.quota) });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this quota?")) {
      await deleteUniteQuota(id);
      getUniteQuotas().then(res => setQuotas(res.data.results || res.data));
    }
  };

  return (
    <div className="assignments-page-container">
      {/* Retained MUI Dialog for the warning popup */}
      <Dialog open={showPopup} onClose={() => setShowPopup(false)}>
        <DialogTitle>Quota Exceeded</DialogTitle>
        <DialogContent>{popupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPopup(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      <header className="page-header">
        <div className="page-title">
          <h1>Quota Management</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Quotas</span></span>
        </div>
      </header>

      <div className="top-grid" style={{gridTemplateColumns: '300px'}}>
        <div className="card">
          <h2 className="card-title">Assign Quota</h2>
          <p className="card-subtitle">Allocate hiring quotas to specific Unites.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <PieChartIcon fontSize="small" /> Add Quota
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{marginBottom: '4px'}}>Allocated Quotas</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Fiscal Year</th>
              <th>Business Unite</th>
              <th>Quota Limit</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotas.map(q => (
              <tr key={q.id}>
                <td><strong>{years.find(y => y.id === q.year)?.year || q.year}</strong></td>
                <td>{q.unite_name}</td>
                <td><span className="status-pill permanent">{q.quota}</span></td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(q)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(q.id)}><DeleteIcon fontSize="small" /></button>
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
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Quota' : 'Assign Quota'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fiscal Year</label>
                <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required>
                  <option value="" disabled>Select Year...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unite</label>
                <select value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} required>
                  <option value="" disabled>Select Unite...</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quota Count</label>
                <input type="number" className="filter-select" value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} required />
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
export default QuotaManagementPage;