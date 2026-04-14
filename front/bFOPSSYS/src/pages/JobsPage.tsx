import React, { useEffect, useState, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableHead, TableRow, TableCell, TableBody, Typography, Box, IconButton, Tooltip 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { bulkCreateJobs } from '../api-jobs'; 
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import { useI18n } from '../i18n/translator';
import '../styles/jobs.css'; 


interface Job {
  id: number;
  name: string;
  code: string;
  company: number;
  company_name: string;
  grades: number[]; 
  accepted_grades_info?: { id: number; name: string }[]; 
  max_workers: number;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
  code?: string;
}

const ADD_COMPANY_OPTION = '__add_company__';

const JobsPage = () => {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Job | null>(null);
  const [formError, setFormError] = useState('');
  const [newCompany, setNewCompany] = useState({ name: '', code: '' });
  const [maxWorkersByCompany, setMaxWorkersByCompany] = useState<Record<string, string>>({});
  
  const initialFormState = { name: '', code: '', companies: [] as string[], grades: [] as string[], max_workers: '' };
  const [form, setForm] = useState(initialFormState);
  
  const [bulkUploading, setBulkUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const getApiErrorMessage = (err: any) => {
    const details = err?.response?.data;
    return typeof details === 'string'
      ? details
      : JSON.stringify(details || t('Unknown error'));
  };

  const buildUniqueJobCode = (baseCode: string, companyId: number, reservedCodes: Set<string>) => {
    const company = companies.find(c => c.id === companyId);
    const companySuffix = (company?.code || `C${companyId}`).replace(/\s+/g, '').toUpperCase();
    const baseCandidate = `${baseCode}-${companySuffix}`;

    let candidate = baseCandidate;
    let counter = 2;
    while (reservedCodes.has(candidate)) {
      candidate = `${baseCandidate}-${counter}`;
      counter += 1;
    }

    reservedCodes.add(candidate);
    return candidate;
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      
      const records: any[] = [];
      const errors: string[] = [];

      json.forEach((row, index) => {
        const rowNum = index + 2;
        
        let companyId: number | null = null;
        let rawCompany = row.company || row.Company;
        if (rawCompany != null && rawCompany !== '') {
          const c = companies.find(c => 
            String(c.name).trim().toLowerCase() === String(rawCompany).trim().toLowerCase() || 
            String(c.id) === String(rawCompany)
          );
          if (c) {
            companyId = c.id;
          } else {
            errors.push(`Row ${rowNum}: Company "${rawCompany}" not found.`);
          }
        }

        let gradesIds: number[] = [];
        let rawGrades = row.grades || row.Grades;
        if (rawGrades != null && rawGrades !== '') {
          const names = String(rawGrades).split(',').map(s => s.trim()).filter(Boolean);
          for (const name of names) {
            const g = grades.find(g => 
              String(g.name).trim().toLowerCase() === name.toLowerCase() || 
              String(g.id) === name
            );
            if (g) {
              gradesIds.push(g.id);
            } else {
              errors.push(`Row ${rowNum}: Grade "${name}" not found.`);
            }
          }
        }

        records.push({
          name: row.name || row.Name || '',
          code: row.code || row.Code || '',
          company: companyId || '',
          grades: gradesIds,
          max_workers: row.max_workers || row.MaxWorkers || row['Max Workers'] || '',
        });
      });

      if (errors.length > 0) {
        alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + errors.join('\n'));
        return;
      }
      
      await bulkCreateJobs(records);
      alert(t('Bulk upload successful!'));
      fetchJobs();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.message || t('Unknown error')));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError('');

    const selectedValues = [...form.companies];
    let selectedCompanyIds: number[] = [];

    if (selectedValues.includes(ADD_COMPANY_OPTION)) {
      const companyName = newCompany.name.trim();
      const companyCode = newCompany.code.trim();

      if (!companyName || !companyCode) {
        setFormError(t('Please fill new company name and code.'));
        return;
      }

      try {
        const res = await axios.post('/api/companies/', {
          name: companyName,
          code: companyCode,
        });
        const createdCompany: Company = res.data;
        selectedCompanyIds = selectedValues
          .filter(v => v !== ADD_COMPANY_OPTION)
          .map(Number)
          .filter(v => !Number.isNaN(v));
        selectedCompanyIds.push(createdCompany.id);
        setCompanies(prev => [...prev, createdCompany].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        setFormError(getApiErrorMessage(err));
        return;
      }
    } else {
      selectedCompanyIds = selectedValues
        .map(Number)
        .filter(v => !Number.isNaN(v));
    }

    selectedCompanyIds = Array.from(new Set(selectedCompanyIds));

    if (selectedCompanyIds.length === 0) {
      setFormError(t('Please select at least one company.'));
      return;
    }

    const maxByCompany: Record<number, number> = {};
    const invalidMaxCompanyNames: string[] = [];

    selectedCompanyIds.forEach((companyId) => {
      const overrideValue = maxWorkersByCompany[String(companyId)];
      const rawValue = (overrideValue ?? form.max_workers ?? '').trim();
      const parsedValue = Number(rawValue);

      if (!rawValue || Number.isNaN(parsedValue) || parsedValue < 1) {
        invalidMaxCompanyNames.push(
          companies.find(c => c.id === companyId)?.name || String(companyId)
        );
        return;
      }

      maxByCompany[companyId] = parsedValue;
    });

    if (invalidMaxCompanyNames.length > 0) {
      setFormError(
        `${t('Please provide a valid max workers value for:')} ${invalidMaxCompanyNames.join(', ')}`
      );
      return;
    }

    const normalizedName = form.name.trim().toLowerCase();
    const duplicateCompanyNames = selectedCompanyIds.filter(companyId => jobs.some((job) => (
      job.id !== editing?.id
      && job.company === companyId
      && job.name.trim().toLowerCase() === normalizedName
    )));

    if (duplicateCompanyNames.length > 0) {
      const duplicateCompanyLabels = duplicateCompanyNames
        .map(companyId => companies.find(c => c.id === companyId)?.name || String(companyId))
        .join(', ');
      setFormError(
        `${t('This job name already exists in:')} ${duplicateCompanyLabels}. ${t('Use another name or remove these companies.')}`
      );
      return;
    }

    try {
      if (editing) {
        const baseCode = form.code.trim();
        const reservedCodes = new Set(jobs.filter(j => j.id !== editing.id).map(j => j.code));
        const primaryCompanyId = selectedCompanyIds.includes(editing.company)
          ? editing.company
          : selectedCompanyIds[0];
        const additionalCompanyIds = selectedCompanyIds.filter(id => id !== primaryCompanyId);

        const payload = {
          name: form.name,
          code: baseCode,
          grades: form.grades.map(Number),
          max_workers: maxByCompany[primaryCompanyId],
          company: primaryCompanyId,
        };
        await axios.put(`/api/jobs/${editing.id}/`, payload);

        reservedCodes.add(baseCode);

        for (let idx = 0; idx < additionalCompanyIds.length; idx += 1) {
          const companyId = additionalCompanyIds[idx];
          const jobCode = buildUniqueJobCode(baseCode, companyId, reservedCodes);
          const extraPayload = {
            name: form.name,
            code: jobCode,
            grades: form.grades.map(Number),
            max_workers: maxByCompany[companyId],
            company: companyId,
          };
          await axios.post('/api/jobs/', extraPayload);
        }

        setEditing(null);
      } else {
        const baseCode = form.code.trim();
        const reservedCodes = new Set(jobs.map(j => j.code));

        for (let idx = 0; idx < selectedCompanyIds.length; idx += 1) {
          const companyId = selectedCompanyIds[idx];
          const jobCode = selectedCompanyIds.length === 1
            ? baseCode
            : buildUniqueJobCode(baseCode, companyId, reservedCodes);

          const payload = {
            name: form.name,
            code: jobCode,
            grades: form.grades.map(Number),
            max_workers: maxByCompany[companyId],
            company: companyId,
          };
          await axios.post('/api/jobs/', payload);
        }
      }
      setForm(initialFormState);
      setNewCompany({ name: '', code: '' });
      setMaxWorkersByCompany({});
      fetchJobs();
    } catch (err: any) {
      setFormError(getApiErrorMessage(err));
    }
  };

  const handleEdit = (job: Job) => {
    setEditing(job);
    setFormError('');
    setNewCompany({ name: '', code: '' });
    setMaxWorkersByCompany({ [String(job.company)]: String(job.max_workers) });
    setForm({ 
      name: job.name, 
      code: job.code, 
      companies: [String(job.company)], 
      // Ensure we map the backend integers to strings for the HTML select
      grades: job.grades ? job.grades.map(String) : [], 
      max_workers: String(job.max_workers) 
    });
  };

  const handleDelete = async (job: Job) => {
    const sameNameJobs = jobs.filter(
      item => item.name.trim().toLowerCase() === job.name.trim().toLowerCase()
    );

    if (sameNameJobs.length > 1) {
      const deleteAll = window.confirm(
        t('This job exists in multiple companies. Click OK to delete it from all companies. Click Cancel to delete only this company entry.')
      );

      if (deleteAll) {
        const confirmed = window.confirm(
          t('Are you sure you want to delete this job from all companies?')
        );
        if (!confirmed) {
          return;
        }

        for (let idx = 0; idx < sameNameJobs.length; idx += 1) {
          await axios.delete(`/api/jobs/${sameNameJobs[idx].id}/`);
        }
        fetchJobs();
        return;
      }

      const deleteSingle = window.confirm(t('Delete this job only in the current company?'));
      if (!deleteSingle) {
        return;
      }

      await axios.delete(`/api/jobs/${job.id}/`);
      fetchJobs();
      return;
    }

    if (window.confirm(t('Delete this job?'))) {
      await axios.delete(`/api/jobs/${job.id}/`);
      fetchJobs();
    }
  };

  // Handler for multiple select
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm(f => ({ ...f, grades: selectedOptions }));
  };

  const handleCompaniesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm(f => ({ ...f, companies: selectedOptions }));
    setFormError('');

    const selectedCompanyIds = selectedOptions.filter(v => v !== ADD_COMPANY_OPTION);
    setMaxWorkersByCompany(prev => {
      const next: Record<string, string> = {};
      selectedCompanyIds.forEach((companyId) => {
        if (prev[companyId] !== undefined) {
          next[companyId] = prev[companyId];
        } else if (form.max_workers) {
          next[companyId] = form.max_workers;
        }
      });
      return next;
    });

    if (!selectedOptions.includes(ADD_COMPANY_OPTION)) {
      setNewCompany({ name: '', code: '' });
    }
  };

  const totalCapacity = jobs.reduce((acc, job) => acc + (Number(job.max_workers) || 0), 0);

  const sharedRolesByName = Object.values(
    jobs.reduce((acc, job) => {
      const key = job.name.trim().toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          name: job.name,
          companies: new Set<string>(),
          totalCapacity: 0,
        };
      }
      const companyName = job.company_name || companies.find(c => c.id === job.company)?.name || t('Unknown');
      acc[key].companies.add(companyName);
      acc[key].totalCapacity += Number(job.max_workers) || 0;
      return acc;
    }, {} as Record<string, { name: string; companies: Set<string>; totalCapacity: number }>)
  )
    .filter(entry => entry.companies.size > 1)
    .map(entry => ({
      name: entry.name,
      companiesCount: entry.companies.size,
      totalCapacity: entry.totalCapacity,
    }));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="jobs-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Job Inventory')}</h1>
          <p>{t('Manage organizational roles, recruitment caps, and operational grading benchmarks.')}</p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            ref={fileInputRef} 
            onChange={handleExcelUpload} 
            style={{ display: 'none' }} 
          />
          <Tooltip title={t('View Expected Excel Format')}>
            <button className="btn btn-outline" onClick={() => setPreviewOpen(true)} style={{ padding: '8px 12px' }}>
              <InfoIcon fontSize="small" />
            </button>
          </Tooltip>
          <button 
            className="btn btn-outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkUploading}
          >
            <UploadFileIcon fontSize="small" />
            {bulkUploading ? t('Uploading...') : t('Bulk Upload (Excel)')}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialFormState); setNewCompany({ name: '', code: '' }); setMaxWorkersByCompany({}); setFormError(''); }}>
            <AddCircleOutlineIcon fontSize="small" />
            {t('Create New Job')}
          </button>
        </div>
      </header>

      <div className="content-grid">
        <div className="left-column">
          <div className="card">
            <h2 className="card-title">{editing ? t('Edit Role') : t('Quick Add Role')}</h2>
            <p className="card-subtitle">{editing ? t('Update position details.') : t('Register a new position immediately.')}</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('Job Name')}</label>
                <input type="text" className="form-input" placeholder="e.g. Senior Data Analyst" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <small style={{ color: '#6b7280' }}>
                  {t('Same job name is allowed in different companies.')}
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('Job Code')}</label>
                  <input type="text" className="form-input" placeholder="DAT-001" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Max Workers')}</label>
                  <input type="number" className="form-input" placeholder="0" value={form.max_workers} onChange={e => setForm(f => ({ ...f, max_workers: e.target.value }))} required min="1" />
                  <small style={{ color: '#6b7280' }}>
                    {t('Default value used when company-specific max is not set.')}
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('Companies (Hold Ctrl/Cmd to select multiple)')}
                </label>
                <select
                  multiple
                  className="form-select"
                  value={form.companies}
                  onChange={handleCompaniesChange}
                  required
                  style={{ minHeight: '110px' }}
                >
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value={ADD_COMPANY_OPTION}>{t('+ Add New Company')}</option>
                </select>

                {form.companies.includes(ADD_COMPANY_OPTION) && (
                  <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('New company name')}
                      value={newCompany.name}
                      onChange={e => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('New company code')}
                      value={newCompany.code}
                      onChange={e => setNewCompany(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {form.companies.filter(v => v !== ADD_COMPANY_OPTION).length > 0 && (
                <div className="form-group">
                  <label className="form-label">{t('Max Workers Per Company')}</label>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {form.companies
                      .filter(v => v !== ADD_COMPANY_OPTION)
                      .map((companyId) => {
                        const companyName = companies.find(c => String(c.id) === companyId)?.name || companyId;
                        return (
                          <div
                            key={companyId}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 130px',
                              gap: '8px',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: '#374151' }}>{companyName}</span>
                            <input
                              type="number"
                              className="form-input"
                              min="1"
                              value={maxWorkersByCompany[companyId] ?? form.max_workers}
                              onChange={e => {
                                const value = e.target.value;
                                setMaxWorkersByCompany(prev => ({ ...prev, [companyId]: value }));
                              }}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('Accepted Grades (Hold Ctrl/Cmd to select multiple)')}</label>
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
                {editing ? t('Update Registry') : t('Add to Registry')}
              </button>
              {formError && (
                <p style={{ color: '#dc2626', marginTop: '8px', marginBottom: 0 }}>{formError}</p>
              )}
              {editing && (
                  <button type="button" className="btn btn-outline btn-full-width" style={{marginTop: '8px'}} onClick={() => { setEditing(null); setForm(initialFormState); setNewCompany({ name: '', code: '' }); setMaxWorkersByCompany({}); setFormError(''); }}>
                   {t('Cancel Edit')}
                 </button>
              )}
            </form>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <div className="table-top-bar">
              <div className="stats-pills">
                <div className="stat-pill"><span className="dot"></span> {jobs.length} {t('TOTAL ROLES')}</div>
                <div className="stat-pill"><span className="dot"></span> {totalCapacity} {t('CAPACITY')}</div>
                <div className="stat-pill"><span className="dot"></span> {sharedRolesByName.length} {t('SHARED NAMES')}</div>
              </div>
              <div className="filter-wrapper">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder={t('Search positions...')} 
                  value={filter} 
                  onChange={e => setFilter(e.target.value)} 
                />
              </div>
            </div>

            {sharedRolesByName.length > 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {sharedRolesByName.map(item => (
                  <div key={item.name} className="stat-pill">
                    {item.name}: {item.companiesCount} {t('companies')} | {item.totalCapacity} {t('capacity')}
                  </div>
                ))}
              </div>
            )}

            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('Job Title & Code')}</th>
                  <th>{t('Required Grades')}</th>
                  <th>{t('Max Workers')}</th>
                  <th>{t('Created At')}</th>
                  <th>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const companyName = job.company_name || companies.find(c => c.id === job.company)?.name || t('Unknown');
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
                            <span className="grade-pill" style={{ opacity: 0.5 }}>{t('None')}</span>
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
                          <button className="action-btn delete" onClick={() => handleDelete(job)}><DeleteIcon fontSize="small" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      {t('No roles found matching your search.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('Expected Excel Format for Jobs')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            {t('Ensure your Excel file has a heading row matching these exact column names. Additional columns will be ignored.')}
          </Typography>
          <div style={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600, border: '1px solid #ddd', mt: 2 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>name</strong></TableCell>
                  <TableCell><strong>code</strong></TableCell>
                  <TableCell><strong>company</strong></TableCell>
                  <TableCell><strong>grades</strong></TableCell>
                  <TableCell><strong>max_workers</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Software Engineer</TableCell>
                  <TableCell>SE-L1</TableCell>
                  <TableCell>Company A</TableCell>
                  <TableCell>capitaine, commandant</TableCell>
                  <TableCell>5</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Project Manager</TableCell>
                  <TableCell>PM-T1</TableCell>
                  <TableCell>HQ</TableCell>
                  <TableCell>lieutenant</TableCell>
                  <TableCell>2</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default JobsPage;