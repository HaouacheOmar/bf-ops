import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import { getJobs } from '../api-jobs';
import '../styles/layout.css'; // <--- Check CSS path!

interface Assignment {
  id: number;
  person: number;
  person_name: string;
  job: number;
  job_name: string;
  company_name: string;
  year: number;
  year_value: number;
  contract_type: string;
  created_at: string;
}

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ person: '', job: '', year: '', contract_type: 'permanent' });
  
  const [gradePopup, setGradePopup] = useState(false);
  const [gradePopupMsg, setGradePopupMsg] = useState('');
  const selectedPerson = persons.find(p => String(p.id) === String(form.person));

  const fetchAssignments = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/assignments/', { params });
    setAssignments(res.data.results || res.data);
  };

  const fetchOptions = async () => {
    const [p, y] = await Promise.all([
      axios.get('/api/persons/'),
      axios.get('/api/years/'),
    ]);
    setPersons(p.data.results || p.data); 
    setYears(y.data.results || y.data);
  };

  const fetchJobsForPersonCompany = async (companyId?: number) => {
    if (!companyId) {
      setJobs([]);
      return;
    }

    const res = await getJobs({ company: companyId });
    setJobs(res.data.results || res.data);
  };

  useEffect(() => { fetchAssignments(); }, [filter]);
  useEffect(() => { fetchOptions(); }, []);
  useEffect(() => {
    fetchJobsForPersonCompany(selectedPerson?.company);
  }, [selectedPerson?.company]);

  const openNewForm = () => {
    setEditing(null);
    setForm({ person: '', job: '', year: '', contract_type: 'permanent' });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = selectedPerson;
    const job = jobs.find(j => String(j.id) === String(form.job));
    
    if (person && job) {
      if (person.company && String(job.company) !== String(person.company)) {
        setGradePopupMsg('Please choose a job from the selected person\'s company.');
        setGradePopup(true);
        return;
      }
    }
    
    try {
      const payload = {
        person: form.person,
        job: form.job,
        year: form.year,
      };

      if (editing) {
        // OPTIMISTIC UPDATE: Update local state immediately
        const res = await axios.put(`/api/assignments/${editing.id}/`, payload);
        setAssignments(assignments.map(a => a.id === editing.id ? res.data : a));
      } else {
        // OPTIMISTIC UPDATE: Append to local state immediately
        const res = await axios.post('/api/assignments/', payload);
        setAssignments([...assignments, res.data]);
      }
      closeForm();
    } catch (err) {
      console.error("Error saving assignment", err);
    }
  };

  const handleEdit = (a: Assignment) => {
    setEditing(a);
    setForm({ 
      person: String(a.person), 
      job: String(a.job), 
      year: String(a.year), 
      contract_type: a.contract_type 
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Remove this assignment?")) {
      await axios.delete(`/api/assignments/${id}/`);
      // OPTIMISTIC UPDATE: Remove from local state immediately
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  // UI Helpers
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2).toUpperCase();
  };
  const getAvatarClass = (index: number) => {
    const classes = ['purple', 'blue', 'orange'];
    return `avatar ${classes[index % classes.length]}`;
  };

  return (
    <div className="assignments-page-container">
      
      {/* Grade Mismatch MUI Dialog (Kept intact) */}
      <Dialog open={gradePopup} onClose={() => setGradePopup(false)}>
        <DialogTitle>Grade Mismatch</DialogTitle>
        <DialogContent>{gradePopupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setGradePopup(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <header className="page-header">
        <div className="page-title">
          <h1>Assignments</h1>
          <span className="breadcrumb">Resources &gt; <span className="breadcrumb-active">Current Deployment</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input 
            type="text" 
            placeholder="Search entries..." 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
          />
        </div>
      </header>

      {/* Top Grid Area */}
      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">New Assignment</h2>
          <p className="card-subtitle">Deploy a qualified professional to an active project.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <PersonAddAlt1Icon fontSize="small" /> Create Deployment
          </button>
        </div>

        <div className="card">
          <div className="card-title">
            <span>INTELLIGENT FILTERS</span>
            <button className="text-btn">RESET ALL</button>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Person</label>
              <select className="filter-select"><option>All Employees</option></select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Job Role</label>
              <select className="filter-select"><option>All Roles</option></select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Year</label>
              <select className="filter-select"><option>2024</option></select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Contract Type</label>
              <select className="filter-select"><option>All Types</option></select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>Current Assignments</h2>
            <p className="card-subtitle" style={{margin: 0}}>{assignments.length} active professional mappings recorded</p>
          </div>
          <button className="btn btn-outline">
            <DownloadIcon fontSize="small" /> Export
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Company / Client</th>
              <th>Job Title</th>
              <th>Contract Period</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, i) => (
              <tr key={a.id}>
                <td>
                  <div className="resource-cell">
                    <div className={getAvatarClass(i)}>{getInitials(a.person_name)}</div>
                    <div className="info-block">
                      <h4>{a.person_name}</h4>
                      <p>ID: EMP-{a.person}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="info-block">
                    <h4>{a.company_name}</h4>
                    <p>Assigned Unit</p>
                  </div>
                </td>
                <td>{a.job_name}</td>
                <td>
                  <div className="info-block">
                    <h4>FY {a.year_value}</h4>
                    <p>{a.contract_type} terms</p>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${a.contract_type}`}>
                    {a.contract_type === 'permanent' ? 'Active' : a.contract_type === 'temporary' ? 'Pending Review' : 'On Hold'}
                  </span>
                </td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(a)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(a.id)}><DeleteIcon fontSize="small" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>No assignments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Utilisation Rate</div>
          <div className="stat-value">94.2%</div>
          <div className="progress-bar"><div className="progress-fill"></div></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming Renewals</div>
          <div className="stat-value">08</div>
          <div className="stat-subtext">Next 30 days window</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Open Requisitions</div>
          <div className="stat-value">12</div>
          <div className="stat-subtext">↗ +2 from last week</div>
        </div>
      </div>

      {/* Custom Creation/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Assignment' : 'Create Deployment'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Person</label>
                <select value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value, job: '' }))} required>
                  <option value="" disabled>Select Employee...</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Job Role</label>
                <select value={form.job} onChange={e => setForm(f => ({ ...f, job: e.target.value }))} required disabled={!selectedPerson || jobs.length === 0}>
                  <option value="" disabled>
                    {selectedPerson ? (jobs.length === 0 ? 'No jobs for this company' : 'Select Job...') : 'Select a person first'}
                  </option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fiscal Year</label>
                <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required>
                  <option value="" disabled>Select Year...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Contract Type</label>
                <select value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))} required>
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Deploy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignmentsPage;