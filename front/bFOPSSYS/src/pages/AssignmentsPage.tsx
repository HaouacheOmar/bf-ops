import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar } from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getJobs } from '../api-jobs';
import { useI18n } from '../i18n/translator';
import '../styles/layout.css';

interface Assignment {
  id: number;
  person: number;
  person_name: string;
  job: number;
  job_name: string;
  company_name: string;
  unite_name?: string;
  year: number;
  year_value: number;
  contract_type: string;
  created_at: string;
}

const AssignmentsPage = () => {
  const { t } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  
  const [personFilter, setPersonFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ person: '', job: '', year: '' });
  
  const [gradePopup, setGradePopup] = useState(false);
  const [gradePopupMsg, setGradePopupMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const selectedPerson = persons.find(p => String(p.id) === String(form.person));

  const normalizeText = (value: any) => String(value ?? '').trim().toLowerCase();

  const openWarning = (message: string) => {
    setWarningMsg(message);
    setWarningOpen(true);
  };

  const fetchAssignments = async () => {
    const params: any = {};
    
    if (filter) params.search = filter;
    if (personFilter) params.person = personFilter;
    if (jobFilter) params.job = jobFilter;
    if (yearFilter) params.year = yearFilter;
    if (contractTypeFilter) params.person__contract_type = contractTypeFilter;
    
    const res = await axios.get('/api/assignments/', { params });
    setAssignments(res.data.results || res.data);
  };

  const handleResetFilters = () => {
    setFilter('');
    setPersonFilter('');
    setJobFilter('');
    setYearFilter('');
    setContractTypeFilter('');
  };

  const fetchOptions = async () => {
    const [p, y, j, c] = await Promise.all([
      axios.get('/api/persons/'),
      axios.get('/api/years/'),
      axios.get('/api/jobs/'),
      axios.get('/api/companies/'),
    ]);
    setPersons(p.data.results || p.data); 
    setYears(y.data.results || y.data);
    setAllJobs(j.data.results || j.data);
    setCompanies(c.data.results || c.data);
  };

  const fetchJobsForPersonCompany = async (companyId?: number) => {
    if (!companyId) {
      setJobs([]);
      return;
    }

    const res = await getJobs({ company: companyId });
    setJobs(res.data.results || res.data);
  };

  useEffect(() => { fetchAssignments(); }, [filter, personFilter, jobFilter, yearFilter, contractTypeFilter]);
  useEffect(() => { fetchOptions(); }, []);
  useEffect(() => {
    fetchJobsForPersonCompany(selectedPerson?.company);
  }, [selectedPerson?.company]);

  const openNewForm = () => {
    setEditing(null);
    setForm({ person: '', job: '', year: '' });
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
        const res = await axios.put(`/api/assignments/${editing.id}/`, payload);
        setAssignments(assignments.map(a => a.id === editing.id ? res.data : a));
      } else {
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
      year: String(a.year)
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Remove this assignment?")) {
      await axios.delete(`/api/assignments/${id}/`);
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2).toUpperCase();
  };
  const getAvatarClass = (index: number) => {
    const classes = ['purple', 'blue', 'orange'];
    return `avatar ${classes[index % classes.length]}`;
  };

  const formatContractType = (value: string) => {
    if (value === 'actif') return t('Active');
    if (value === 'contractuel') return t('Contractual');
    if (value === 'permanent') return t('Permanent');
    if (value === 'temporary') return t('Temporary');
    if (value === 'intern') return t('Intern');
    return t(value || '-');
  };

  const handleExport = () => {
    const exportData = assignments.map(a => ({
      'Resource Name': a.person_name,
      'Employee ID': `EMP-${a.person}`,
      'Company / Client': a.company_name,
      'Job Title': a.job_name,
      'Fiscal Year': a.year_value,
      'Contract Type': formatContractType(a.contract_type),
      'Status': a.contract_type === 'permanent' ? t('Active') : a.contract_type === 'temporary' ? t('Pending Review') : t('On Hold'),
      'Created Date': new Date(a.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments');

    const colWidths = [
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 15 }, 
      { wch: 18 }, 
      { wch: 15 }, 
    ];
    worksheet['!cols'] = colWidths;

    const filename = `Assignments_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const requiredColumns = ['first_name', 'last_name', 'matricule', 'job title', 'company', 'unite', 'year'];
      if (rows.length > 0) {
        const presentColumns = Object.keys(rows[0]).map((key) => normalizeText(key));
        const missingColumns = requiredColumns.filter((col) => !presentColumns.includes(col));
        if (missingColumns.length > 0) {
          openWarning(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }
      }

      const personByMatricule = new Map<string, any>();
      persons.forEach((person) => {
        const key = normalizeText(person.matricule || person.national_id);
        if (key) personByMatricule.set(key, person);
      });

      const yearByValue = new Map<string, any>();
      years.forEach((year) => {
        yearByValue.set(String(year.year).trim(), year);
        yearByValue.set(String(year.id).trim(), year);
      });

      const jobsByName = new Map<string, any[]>();
      allJobs.forEach((job) => {
        const key = normalizeText(job.name);
        const current = jobsByName.get(key) || [];
        current.push(job);
        jobsByName.set(key, current);
      });

      const missingPersons: string[] = [];
      const missingJobs: string[] = [];
      const invalidYears: string[] = [];
      const payloads: Array<{ person: number; job: number; year: number }> = [];

      rows.forEach((row, index) => {
        const rowNum = index + 2;

        const matricule = row.matricule || row.Matricule;
        const jobTitle = row['job title'] || row['Job Title'] || row.job_title || row.JobTitle;
        const companyName = row.company || row.Company;
        const uniteName = row.unite || row.Unite;
        const yearValue = row.year || row.Year;

        const person = personByMatricule.get(normalizeText(matricule));
        if (!person) {
          missingPersons.push(`Row ${rowNum} (${matricule || '-'})`);
          return;
        }

        const jobNameKey = normalizeText(jobTitle);
        const candidates = jobsByName.get(jobNameKey) || [];
        const filteredByCompany = normalizeText(companyName)
          ? candidates.filter((job) => normalizeText(job.company_name) === normalizeText(companyName))
          : candidates;

        const filteredByUnite = normalizeText(uniteName)
          ? filteredByCompany.filter((job) => {
              const matchCompany = companies.find((company) => String(company.id) === String(job.company));
              return normalizeText(matchCompany?.unite_name || matchCompany?.unite || '') === normalizeText(uniteName)
                || normalizeText(person.unite_name) === normalizeText(uniteName);
            })
          : filteredByCompany;

        const selectedJob = filteredByUnite[0] || filteredByCompany[0] || candidates[0];
        if (!selectedJob) {
          missingJobs.push(`Row ${rowNum} (${jobTitle || '-'})`);
          return;
        }

        const year = yearByValue.get(String(yearValue).trim());
        if (!year) {
          invalidYears.push(`Row ${rowNum} (${yearValue || '-'})`);
          return;
        }

        payloads.push({
          person: Number(person.id),
          job: Number(selectedJob.id),
          year: Number(year.id),
        });
      });

      if (missingPersons.length || missingJobs.length || invalidYears.length) {
        const warningLines: string[] = [];
        if (missingPersons.length) warningLines.push(`${t('Missing person')}: ${missingPersons.join(', ')}`);
        if (missingJobs.length) warningLines.push(`${t('Missing job')}: ${missingJobs.join(', ')}`);
        if (invalidYears.length) warningLines.push(`${t('Check the year assignment')}: ${invalidYears.join(', ')}`);
        openWarning(warningLines.join('\n'));
        return;
      }

      const results = await Promise.allSettled(
        payloads.map((payload) => axios.post('/api/assignments/', payload))
      );

      const failed = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[];
      if (failed.length > 0) {
        openWarning(`${failed.length} row(s) failed to upload.`);
      }

      await fetchAssignments();
    } catch (error: any) {
      openWarning(error?.message || t('Unknown error'));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="assignments-page-container">
      
      {/* Grade Mismatch MUI Dialog (Kept intact) */}
      <Dialog open={gradePopup} onClose={() => setGradePopup(false)}>
        <DialogTitle>{t('Grade Mismatch')}</DialogTitle>
        <DialogContent>{gradePopupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setGradePopup(false)}>{t('OK')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={warningOpen}
        autoHideDuration={7000}
        onClose={() => setWarningOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setWarningOpen(false)}
          severity="warning"
          variant="filled"
          sx={{ whiteSpace: 'pre-line' }}
        >
          {warningMsg}
        </Alert>
      </Snackbar>

      {/* Header */}
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Assignments')}</h1>
          <span className="breadcrumb">{t('Resources')} &gt; <span className="breadcrumb-active">{t('Current Deployment')}</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input 
            type="text" 
            placeholder={t('Search entries...')} 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
          />
        </div>
      </header>

      {/* Top Grid Area */}
      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">{t('New Assignment')}</h2>
          <p className="card-subtitle">{t('Deploy a qualified professional to an active project.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <PersonAddAlt1Icon fontSize="small" /> {t('Create Deployment')}
          </button>
        </div>

        <div className="card">
          <div className="card-title">
            <span>{t('INTELLIGENT FILTERS')}</span>
            <button className="text-btn" onClick={handleResetFilters}>{t('RESET ALL')}</button>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">{t('Person')}</label>
              <select 
                className="filter-select"
                value={personFilter}
                onChange={e => setPersonFilter(e.target.value)}
              >
                <option value="">{t('All Employees')}</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('Job Role')}</label>
              <select 
                className="filter-select"
                value={jobFilter}
                onChange={e => setJobFilter(e.target.value)}
              >
                <option value="">{t('All Roles')}</option>
                {allJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('Year')}</label>
              <select 
                className="filter-select"
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
              >
                <option value="">{t('All Years')}</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('Contract Type')}</label>
              <select 
                className="filter-select"
                value={contractTypeFilter}
                onChange={e => setContractTypeFilter(e.target.value)}
              >
                <option value="">{t('All Types')}</option>
                <option value="actif">{t('Active')}</option>
                <option value="contractuel">{t('Contractual')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>{t('Current Assignments')}</h2>
            <p className="card-subtitle" style={{margin: 0}}>{assignments.length} {t('active professional mappings recorded')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
              <UploadFileIcon fontSize="small" /> {bulkUploading ? t('Uploading...') : t('Bulk Upload (Excel)')}
            </button>
            <button className="btn btn-outline" onClick={handleExport}>
              <DownloadIcon fontSize="small" /> {t('Export')}
            </button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Resource Name')}</th>
              <th>{t('Company / Client')}</th>
              <th>{t('Job Title')}</th>
              <th>{t('Contract Period')}</th>
              <th>{t('Status')}</th>
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
                    <p>{a.unite_name || '-'}</p>
                  </div>
                </td>
                <td>{a.job_name}</td>
                <td>
                  <div className="info-block">
                    <h4>FY {a.year_value}</h4>
                    <p>{formatContractType(a.contract_type)} {t('terms')}</p>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${a.contract_type}`}>
                    {a.contract_type === 'permanent' ? t('Active') : a.contract_type === 'temporary' ? t('Pending Review') : t('On Hold')}
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
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>{t('No assignments found.')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Creation/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? t('Edit Assignment') : t('Create Deployment')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Person')}</label>
                <select value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value, job: '' }))} required>
                  <option value="" disabled>{t('Select Employee...')}</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('Job Role')}</label>
                <select value={form.job} onChange={e => setForm(f => ({ ...f, job: e.target.value }))} required disabled={!selectedPerson || jobs.length === 0}>
                  <option value="" disabled>
                    {selectedPerson ? (jobs.length === 0 ? t('No jobs for this company') : t('Select Job...')) : t('Select a person first')}
                  </option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('Fiscal Year')}</label>
                <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required>
                  <option value="" disabled>{t('Select Year...')}</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Deploy')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignmentsPage;