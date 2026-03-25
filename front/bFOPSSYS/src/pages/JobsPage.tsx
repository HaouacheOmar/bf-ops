import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreateJobs } from '../api-jobs'; 
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import '../styles/jobs.css'; 

// 1. Updated Interface to handle array of grades
interface Job {
  id: number;
  name: string;
  code: string;
  company: number;
  company_name: string;
  grades: number[]; // Array of IDs expected by the backend
  accepted_grades_info?: { id: number; name: string }[]; // Read-only info from backend
  max_workers: number;
  created_at: string;
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Job | null>(null);
  
  // 2. Form state now holds an array for grades
  const initialFormState = { name: '', code: '', company: '', grades: [] as string[], max_workers: '' };
  const [form, setForm] = useState(initialFormState);
  
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/jobs/', { params });
    setJobs(res.data.results || res.data); 
  };
  
  const fetchCompanies = async () => {
    const res = await axios.get('/api/companies/');
    setCompanies(res.data.results || res.data);
  };
  
  const fetchGrades = async () => {
    const res = await axios.get('/api/grades/');
    setGrades(res.data.results || res.data);
  };

  useEffect(() => { 
    fetchJobs(); 
    fetchCompanies(); 
    fetchGrades(); 
  }, [filter]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      
      const records = json.map(row => ({
        name: row.name || row.Name || '',
        code: row.code || row.Code || '',
        company: row.company || row.Company || '',
        // Basic parsing: split by comma if someone uploads multiple grades like "1,2,3"
        grades: row.grades ? String(row.grades).split(',').map(s => Number(s.trim())) : [],
        max_workers: row.max_workers || row.MaxWorkers || row['Max Workers'] || '',
      }));
      
      await bulkCreateJobs(records);
      alert('Bulk upload successful!');
      fetchJobs();
    } catch (err: any) {
      alert('Bulk upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 3. Map string array to numbers before sending to Django
    const payload = {
      ...form,
      grades: form.grades.map(Number), 
      company: form.company === '' ? null : Number(form.company),
    };

    if (editing) {
      await axios.put(`/api/jobs/${editing.id}/`, payload);
      setEditing(null);
    } else {
      await axios.post('/api/jobs/', payload);
    }
    setForm(initialFormState);
    fetchJobs();
  };

  const handleEdit = (job: Job) => {
    setEditing(job);
    setForm({ 
      name: job.name, 
      code: job.code, 
      company: String(job.company), 
      // Ensure we map the backend integers to strings for the HTML select
      grades: job.grades ? job.grades.map(String) : [], 
      max_workers: String(job.max_workers) 
    });
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this job?")) {
      await axios.delete(`/api/jobs/${id}/`);
      fetchJobs();
    }
  };

  // Handler for multiple select
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm(f => ({ ...f, grades: selectedOptions }));
  };

  const totalCapacity = jobs.reduce((acc, job) => acc + (Number(job.max_workers) || 0), 0);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="jobs-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Job Inventory</h1>
          <p>Manage organizational roles, recruitment caps, and operational grading benchmarks.</p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            ref={fileInputRef} 
            onChange={handleExcelUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            className="btn btn-outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkUploading}
          >
            <UploadFileIcon fontSize="small" />
            {bulkUploading ? 'Uploading...' : 'Bulk Upload (Excel)'}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialFormState); }}>
            <AddCircleOutlineIcon fontSize="small" />
            Create New Job
          </button>
        </div>
      </header>

      <div className="content-grid">
        <div className="left-column">
          <div className="card">
            <h2 className="card-title">{editing ? 'Edit Role' : 'Quick Add Role'}</h2>
            <p className="card-subtitle">{editing ? 'Update position details.' : 'Register a new position immediately.'}</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Job Name</label>
                <input type="text" className="form-input" placeholder="e.g. Senior Data Analyst" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Code</label>
                  <input type="text" className="form-input" placeholder="DAT-001" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Workers</label>
                  <input type="number" className="form-input" placeholder="0" value={form.max_workers} onChange={e => setForm(f => ({ ...f, max_workers: e.target.value }))} required min="1" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company</label>
                <select className="form-select" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required>
                  <option value="">Select Company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Accepted Grades (Hold Ctrl/Cmd to select multiple)</label>
                {/* 4. Changed to a multiple select UI */}
                <select 
                  multiple 
                  className="form-select" 
                  value={form.grades} 
                  onChange={handleGradeChange} 
                  style={{ minHeight: '100px' }}
                >
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-full-width">
                {editing ? 'Update Registry' : 'Add to Registry'}
              </button>
              {editing && (
                 <button type="button" className="btn btn-outline btn-full-width" style={{marginTop: '8px'}} onClick={() => { setEditing(null); setForm(initialFormState); }}>
                   Cancel Edit
                 </button>
              )}
            </form>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <div className="table-top-bar">
              <div className="stats-pills">
                <div className="stat-pill"><span className="dot"></span> {jobs.length} TOTAL ROLES</div>
                <div className="stat-pill"><span className="dot"></span> {totalCapacity} CAPACITY</div>
              </div>
              <div className="filter-wrapper">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search positions..." 
                  value={filter} 
                  onChange={e => setFilter(e.target.value)} 
                />
              </div>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>Job Title & Code</th>
                  <th>Required Grades</th>
                  <th>Max Workers</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const companyName = job.company_name || companies.find(c => c.id === job.company)?.name || 'Unknown';
                  const visualFill = Math.min((job.max_workers / 20) * 100, 100);

                  return (
                    <tr key={job.id}>
                      <td>
                        <div className="job-info">
                          <h4>{job.name}</h4>
                          <p>{job.code} • {companyName}</p>
                        </div>
                      </td>
                      <td>
                        {/* 5. Render multiple pills for accepted grades */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {job.accepted_grades_info && job.accepted_grades_info.length > 0 ? (
                            job.accepted_grades_info.map(g => (
                              <span key={g.id} className="grade-pill">{g.name}</span>
                            ))
                          ) : (
                            <span className="grade-pill" style={{ opacity: 0.5 }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="capacity-cell">
                          {String(job.max_workers).padStart(2, '0')}
                          <div className="capacity-bar">
                              <div className="capacity-fill" style={{ width: `${visualFill}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(job.created_at)}</td>
                      <td>
                        <div className="action-icons">
                          <button className="action-btn edit" onClick={() => handleEdit(job)}><EditIcon fontSize="small" /></button>
                          <button className="action-btn delete" onClick={() => handleDelete(job.id)}><DeleteIcon fontSize="small" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      No roles found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bottom-cards-row">
            <div className="bottom-card">
              <div className="bottom-card-icon blue"><TrendingUpIcon /></div>
              <div className="bottom-card-content">
                <p>Growth Trend</p>
                <h4>+12% Positions</h4>
              </div>
            </div>
            <div className="bottom-card">
              <div className="bottom-card-icon purple"><PeopleAltIcon /></div>
              <div className="bottom-card-content">
                <p>Hiring Velocity</p>
                <h4>High Demand</h4>
              </div>
            </div>
            <div className="bottom-card">
              <div className="bottom-card-icon gray"><CheckCircleIcon /></div>
              <div className="bottom-card-content">
                <p>System Status</p>
                <h4>Registry Synced</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;