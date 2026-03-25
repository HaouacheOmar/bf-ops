import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreatePersons } from '../api-persons';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import '../styles/persons.css';

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  contract_type: 'actif' | 'contractuel';
  grade: number | null;
  grade_name?: string;
  unite: number | null;
  unite_name?: string;
  company: number | null;
  company_name?: string;
  job: number | null;
  job_name?: string;
}

const PersonsPage = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  
  const initialFormState = { 
    first_name: '', last_name: '', national_id: '', 
    contract_type: 'actif', grade: '', unite: '', company: '', job: ''
  };
  const [form, setForm] = useState(initialFormState);
  
  const [grades, setGrades] = useState<any[]>([]);
  const [unites, setUnites] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => {
    axios.get('/api/grades/').then(res => setGrades(res.data.results || res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
    axios.get('/api/companies/').then(res => setCompanies(res.data.results || res.data));
    axios.get('/api/jobs/').then(res => setJobs(res.data.results || res.data));
  }, []);

  const fetchPersons = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/persons/', { params });
    setPersons(res.data.results || res.data);
  };
  
  useEffect(() => { fetchPersons(); }, [filter]);

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
        first_name: row.first_name || row.FirstName || '',
        last_name: row.last_name || row.LastName || '',
        national_id: row.national_id || row.NationalID || '',
        contract_type: row.contract_type || 'actif',
        grade: row.grade || null,
        unite: row.unite || null,
        company: row.company || null,
        job: row.job || null,
      }));
      
      await bulkCreatePersons(records);
      alert('Bulk upload successful!');
      fetchPersons();
    } catch (err: any) {
      alert('Bulk upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      grade: form.grade === '' ? null : form.grade,
      unite: form.unite === '' ? null : form.unite,
      company: form.company === '' ? null : form.company,
      job: form.job === '' ? null : form.job,
    };

    if (editing) {
      await axios.put(`/api/persons/${editing.id}/`, payload);
      setEditing(null);
    } else {
      await axios.post('/api/persons/', payload);
    }
    
    setForm(initialFormState);
    fetchPersons();
  };

  const handleEdit = (person: Person) => {
    setEditing(person);
    setForm({
      first_name: person.first_name,
      last_name: person.last_name,
      national_id: person.national_id,
      contract_type: person.contract_type || 'actif',
      grade: person.grade ? String(person.grade) : '',
      unite: person.unite ? String(person.unite) : '',
      company: person.company ? String(person.company) : '',
      job: person.job ? String(person.job) : '',
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      await axios.delete(`/api/persons/${id}/`);
      fetchPersons();
    }
  };

  const filteredCompanies = form.unite ? companies.filter(c => String(c.unite) === String(form.unite)) : companies;
  const filteredJobs = form.company ? jobs.filter(j => String(j.company) === String(form.company)) : jobs;

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="persons-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Talent Management</h1>
          <p>Review and manage individual records for the company.</p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            ref={fileInputRef} 
            onChange={handleExcelUpload} 
            style={{ display: 'none' }} 
          />
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={bulkUploading}>
            <UploadFileIcon fontSize="small" />
            {bulkUploading ? 'Uploading...' : 'Bulk Upload'}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialFormState); }}>
            <PersonAddIcon fontSize="small" />
            Add New Person
          </button>
        </div>
      </header>

      <div className="content-grid">
        <div className="left-column">
          <div className="card">
            <div className="card-header-flex">
              <div className="card-icon"><DescriptionIcon fontSize="small" /></div>
              <h2 className="card-title">{editing ? 'Edit Record' : 'New Record'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" placeholder="Jane" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" placeholder="Doe" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">National ID</label>
                <input type="text" className="form-input" placeholder="ID-000-00-0000" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Type of Contract</label>
                <select className="form-select" value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value as 'actif' | 'contractuel' }))} required>
                  <option value="actif">Actif (Permanent)</option>
                  <option value="contractuel">Contractuel (Temporary)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Grade</label>
                <div className="grades-toggle-container">
                  {grades.map(g => (
                    <div 
                      key={g.id} 
                      className={`grade-btn ${form.grade === String(g.id) ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, grade: String(g.id) }))}
                    >
                      {g.name}
                    </div>
                  ))}
                  <div className={`grade-btn ${form.grade === '' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, grade: '' }))}>
                    None
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Unite</label>
                <select className="form-select" value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value, company: '', job: '' }))}>
                  <option value="">Select Unite...</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <select className="form-select" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value, job: '' }))} disabled={!form.unite && filteredCompanies.length === 0}>
                    <option value="">Select...</option>
                    {filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job</label>
                  <select className="form-select" value={form.job} onChange={e => setForm(f => ({ ...f, job: e.target.value }))} disabled={!form.company && filteredJobs.length === 0}>
                    <option value="">Select...</option>
                    {filteredJobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full-width">
                {editing ? 'Update Identity' : 'Create Identity'}
              </button>
              {editing && (
                 <button type="button" className="btn btn-outline btn-full-width" style={{ marginTop: '8px'}} onClick={() => { setEditing(null); setForm(initialFormState); }}>
                   Cancel Edit
                 </button>
              )}
            </form>
          </div>

          <div className="mini-stats-card">
            <h4 className="mini-stats-title">Total Employees Active</h4>
            <p className="mini-stats-value">{persons.length}</p>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <div className="table-header">
              <h2 className="card-title">Personnel Registry</h2>
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon" fontSize="small" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search employee record..." 
                  value={filter} 
                  onChange={e => setFilter(e.target.value)} 
                />
              </div>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contract</th>
                  <th>Unit / Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {persons.map(person => (
                  <tr key={person.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {getInitials(person.first_name, person.last_name)}
                        </div>
                        <div className="employee-info">
                          <h4>{person.first_name} {person.last_name}</h4>
                          <p>{person.job_name || 'No Job Assigned'}</p>
                        </div>
                      </div>
                    </td>
                    <td>{person.contract_type === 'actif' ? 'Full-Time' : 'Freelance'}</td>
                    <td>
                      <div className="employee-info">
                        <h4>{person.company_name || 'No Company'}</h4>
                        <p>{person.unite_name || '-'}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${person.contract_type}`}>
                        {person.contract_type}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button className="action-btn edit" onClick={() => handleEdit(person)}><EditIcon fontSize="small" /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(person.id)}><DeleteIcon fontSize="small" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {persons.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      No employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="audit-banner">
             <div className="audit-info">
                <div className="audit-icon"><InfoOutlinedIcon /></div>
                <div className="audit-text">
                   <h4>Quarterly Audit Reminder</h4>
                   <p>Please ensure all contract assignments are digitally reviewed by Friday.</p>
                </div>
             </div>
             <button className="btn btn-white">Review Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonsPage;