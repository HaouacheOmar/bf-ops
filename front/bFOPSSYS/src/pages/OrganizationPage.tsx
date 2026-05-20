import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StarIcon from '@mui/icons-material/Star';
import PieChartIcon from '@mui/icons-material/PieChart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { useI18n } from '../i18n/translator';
import '../styles/layout.css';

const tabOrder = ['companies', 'unites', 'grades', 'quotas'] as const;
type TabKey = (typeof tabOrder)[number];

const normalizeList = (data: any) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);

const isTabKey = (value: string | null): value is TabKey => Boolean(value && tabOrder.includes(value as TabKey));

function TabPanel({ value, activeTab, children }: { value: TabKey; activeTab: TabKey; children: React.ReactNode }) {
  return (
    <Box role="tabpanel" hidden={activeTab !== value} sx={{ display: activeTab === value ? 'block' : 'none', mt: 3 }}>
      {children}
    </Box>
  );
}

const CompaniesPanel = () => {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '', unite: '' });

  const fetchCompanies = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await api.get('/companies/', { params });
    setCompanies(normalizeList(res.data));
  };

  const fetchUnites = async () => {
    const res = await api.get('/unites/');
    setUnites(normalizeList(res.data));
  };

  const fetchJobs = async () => {
    const res = await api.get('/jobs/');
    setJobs(normalizeList(res.data));
  };

  useEffect(() => {
    void fetchCompanies();
  }, [filter]);

  useEffect(() => {
    void fetchUnites();
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '', unite: '' });
    setError('');
    setIsFormOpen(true);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [, setPreviewOpen] = React.useState(false);

  const sanitizeCode = (name: any, fallback = 'COMP') => {
    const seed = String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (seed) return seed.slice(0, 10);
    return `${fallback}-${Math.floor(1000 + Math.random() * 9000)}`;
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

      const requiredColumns = ['name', 'code', 'unite'];
      if (json.length > 0) {
        const firstRowKeys = Object.keys(json[0]).map((k) => String(k).trim().toLowerCase());
        const missing = requiredColumns.filter((col) => !firstRowKeys.includes(col));
        if (missing.length > 0) {
          alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + `Missing required columns: ${missing.join(', ')}`);
          return;
        }
      }

      const payload = json.map((r: any) => ({
        name: r.name,
        code: (r.code || '').toString().trim() || sanitizeCode(r.name, 'COMP'),
        unite: r.unite,
      }));

      const res = await api.post('/companies/bulk_create/', payload);
      alert(res.data.message || t('Bulk upload successful!'));
      void fetchCompanies();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.response?.data?.error || err?.message || t('Unknown error')));
    } finally {
      setBulkUploading(false);
      if (e.target) e.target.value = '';
    }
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
        const res = await api.put(`/companies/${editing.id}/`, form);
        setCompanies(current => current.map(company => (company.id === editing.id ? res.data : company)));
      } else {
        const res = await api.post('/companies/', form);
        setCompanies(current => [...current, res.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail || JSON.stringify(err?.response?.data || 'Error saving company'));
    }
  };

  const handleEdit = (company: any) => {
    setEditing(company);
    setForm({
      name: company.name,
      code: company.code,
      unite: company.unite ? String(company.unite) : '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('Delete this company?'))) {
      await api.delete(`/companies/${id}/`);
      setCompanies(current => current.filter(company => company.id !== id));
    }
  };

  const getCompanyJobs = (companyId: number) => jobs.filter(job => Number(job.company) === companyId);

  return (
    <>
      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">{t('New Company')}</h2>
          <p className="card-subtitle">{t('Add a new corporate entity to the system.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <BusinessIcon fontSize="small" /> {t('Add Company')}
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-outline" onClick={() => setPreviewOpen(true)} style={{ padding: '8px 12px' }}>
              <InfoIcon fontSize="small" />
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={bulkUploading}>
              <UploadFileIcon fontSize="small" /> {bulkUploading ? t('Uploading...') : t('Bulk Upload')}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            <span>{t('INTELLIGENT FILTERS')}</span>
            <button className="text-btn" onClick={() => setFilter('')}>{t('RESET ALL')}</button>
          </div>
          <div className="filters-row">
            <div className="filter-group" style={{ position: 'relative' }}>
              <label className="filter-label">{t('Search Companies')}</label>
              <SearchIcon style={{ position: 'absolute', left: '12px', top: '36px', color: '#9ca3af', fontSize: '18px' }} />
              <input
                type="text"
                className="filter-select"
                style={{ paddingLeft: '36px' }}
                placeholder={t('Search by name or code...')}
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">{t('Unite')}</label>
              <select className="filter-select">
                <option>{t('All Unites')}</option>
                {unites.map(unite => (
                  <option key={unite.id} value={unite.id}>{unite.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{ marginBottom: '4px' }}>{t('Registered Companies')}</h2>
            <p className="card-subtitle" style={{ margin: 0 }}>{companies.length} {t('total companies')}</p>
          </div>
          <button className="btn btn-outline"><DownloadIcon fontSize="small" /> {t('Export')}</button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Code')}</th>
              <th>{t('Services Count')}</th>
              <th>{t('Created At')}</th>
              <th>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td><strong>{company.name}</strong></td>
                <td><span className="status-pill permanent">{company.code}</span></td>
                <td>
                  {(() => {
                    const companyJobs = getCompanyJobs(company.id);
                    return companyJobs.length > 0 ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{companyJobs.length}</div>
                        <div style={{ marginTop: 4, fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                          {companyJobs.map(job => job.name).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700 }}>0</div>
                        <div style={{ marginTop: 4, fontSize: '12px', color: '#9ca3af' }}>{t('No jobs assigned')}</div>
                      </div>
                    );
                  })()}
                </td>
                <td>{company.created_at ? new Date(company.created_at).toLocaleDateString() : '-'}</td>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? t('Edit Company') : t('Add Company')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Company Name')}</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('Company Code')}</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('Unite')}</label>
                <select value={form.unite} onChange={e => setForm(current => ({ ...current, unite: e.target.value }))} required>
                  <option value="" disabled>{t('Select unite...')}</option>
                  {unites.map(unite => <option key={unite.id} value={unite.id}>{unite.name}</option>)}
                </select>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const UnitesPanel = () => {
  const { t } = useI18n();
  const [unites, setUnites] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchUnites = async () => {
    const res = await api.get('/unites/');
    setUnites(normalizeList(res.data));
  };

  useEffect(() => {
    void fetchUnites();
  }, []);

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
        const res = await api.put(`/unites/${editing.id}/`, form);
        setUnites(current => current.map(unite => (unite.id === editing.id ? res.data : unite)));
      } else {
        const res = await api.post('/unites/', form);
        setUnites(current => [...current, res.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error saving unite');
    }
  };

  const handleEdit = (unite: any) => {
    setEditing(unite);
    setForm({ name: unite.name, code: unite.code });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('Delete this unite?'))) {
      await api.delete(`/unites/${id}/`);
      setUnites(current => current.filter(unite => unite.id !== id));
    }
  };

  return (
    <>
      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
        <div className="card">
          <h2 className="card-title">{t('New Unite')}</h2>
          <p className="card-subtitle">{t('Create a new organizational structure unit.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <AccountTreeIcon fontSize="small" /> {t('Add Unite')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>{t('Registered Unites')}</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Code')}</th>
              <th style={{ width: '100px' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {unites.map(unite => (
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? t('Edit Unite') : t('Create Unite')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Unite Name')}</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('Unite Code')}</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const GradesPanel = () => {
  const { t } = useI18n();
  const [grades, setGrades] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchGrades = async () => {
    const res = await api.get('/grades/');
    setGrades(normalizeList(res.data));
  };

  useEffect(() => {
    void fetchGrades();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setError('');
    setIsFormOpen(true);
  };

  const gradeFileInputRef = React.useRef<HTMLInputElement>(null);
  const [gradeBulkUploading, setGradeBulkUploading] = React.useState(false);
  const [, setGradePreviewOpen] = React.useState(false);

  const handleGradesExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGradeBulkUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      const requiredColumns = ['name', 'code', 'rating'];
      if (json.length > 0) {
        const firstRowKeys = Object.keys(json[0]).map((k) => String(k).trim().toLowerCase());
        const missing = requiredColumns.filter((col) => !firstRowKeys.includes(col));
        if (missing.length > 0) {
          alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + `Missing required columns: ${missing.join(', ')}`);
          return;
        }
      }

      const sanitizeGradeCode = (name: any, fallback = 'GRD') => {
        const seed = String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (seed) return seed.slice(0, 10);
        return `${fallback}-${Math.floor(1000 + Math.random() * 9000)}`;
      };

      const payload = json.map((r: any) => ({
        name: r.name,
        code: (r.code || '').toString().trim() || sanitizeGradeCode(r.name, 'GRD'),
        rating: r.rating,
      }));

      const res = await api.post('/grades/bulk_create/', payload);
      alert(res.data.message || t('Bulk upload successful!'));
      void fetchGrades();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.response?.data?.error || err?.message || t('Unknown error')));
    } finally {
      setGradeBulkUploading(false);
      if (e.target) e.target.value = '';
    }
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
        const res = await api.put(`/grades/${editing.id}/`, form);
        setGrades(current => current.map(grade => (grade.id === editing.id ? res.data : grade)));
      } else {
        const res = await api.post('/grades/', form);
        setGrades(current => [...current, res.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error saving grade');
    }
  };

  const handleEdit = (grade: any) => {
    setEditing(grade);
    setForm({ name: grade.name, code: grade.code });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('Delete this grade?'))) {
      await api.delete(`/grades/${id}/`);
      setGrades(current => current.filter(grade => grade.id !== id));
    }
  };

  return (
    <>
      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
        <div className="card">
          <h2 className="card-title">{t('New Grade')}</h2>
          <p className="card-subtitle">{t('Define a new employee seniority grade.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <StarIcon fontSize="small" /> {t('Add Grade')}
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={gradeFileInputRef}
            onChange={handleGradesExcelUpload}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-outline" onClick={() => setGradePreviewOpen(true)} style={{ padding: '8px 12px' }}>
              <InfoIcon fontSize="small" />
            </button>
            <button className="btn btn-outline" onClick={() => gradeFileInputRef.current?.click()} disabled={gradeBulkUploading}>
              <UploadFileIcon fontSize="small" /> {gradeBulkUploading ? t('Uploading...') : t('Bulk Upload')}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>{t('Grades Dictionary')}</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Grade Name')}</th>
              <th>{t('Reference Code')}</th>
              <th style={{ width: '100px' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(grade => (
              <tr key={grade.id}>
                <td><strong>{grade.name}</strong></td>
                <td><span className="status-pill blue">{grade.code}</span></td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(grade)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(grade.id)}><DeleteIcon fontSize="small" /></button>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? t('Edit Grade') : t('Create Grade')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Grade Name')}</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('Grade Code')}</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const QuotasPanel = () => {
  const { t } = useI18n();
  const [quotas, setQuotas] = useState<any[]>([]);
  const [, setYears] = useState<{ id: number; year: number }[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<{ year: string; unite: string; quota: string }>({ year: '', unite: '', quota: '' });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');

  const fetchQuotas = async () => {
    const res = await api.get('/unite-quotas/');
    setQuotas(normalizeList(res.data));
  };

  useEffect(() => {
    void fetchQuotas();
    void api.get('/years/').then(res => setYears(normalizeList(res.data)));
    void api.get('/unites/').then(res => setUnites(normalizeList(res.data)));
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
      const companiesRes = await api.get('/companies/', { params: { unite: payload.unite } });
      const companyIds = normalizeList(companiesRes.data).map((c: any) => c.id);
      const jobsRes = await api.get('/jobs/');
      const jobs = normalizeList(jobsRes.data).filter((j: any) => companyIds.includes(j.company));
      const sum = jobs.reduce((acc: number, j: any) => acc + Number(j.max_workers), 0);

      if (payload.quota < sum) {
        setPopupMsg(`The sum of max workers (${sum}) for jobs in this unite exceeds the yearly quota (${payload.quota}). Please adjust job quotas or increase the unite quota.`);
        setShowPopup(true);
        return;
      }
    }

    if (editing) {
      await api.put(`/unite-quotas/${editing.id}/`, payload);
    } else {
      await api.post('/unite-quotas/', payload);
    }

    closeForm();
    void fetchQuotas();
  };

  const handleEdit = (quota: any) => {
    setEditing(quota);
    setForm({ year: String(quota.year), unite: String(quota.unite), quota: String(quota.quota) });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('Delete this quota?'))) {
      await api.delete(`/unite-quotas/${id}/`);
      void fetchQuotas();
    }
  };

  return (
    <>
      <Dialog open={showPopup} onClose={() => setShowPopup(false)}>
        <DialogTitle>{t('Quota Exceeded')}</DialogTitle>
        <DialogContent>{popupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPopup(false)}>{t('OK')}</Button>
        </DialogActions>
      </Dialog>

      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
        <div className="card">
          <h2 className="card-title">{t('Assign Quota')}</h2>
          <p className="card-subtitle">{t('Allocate hiring quotas to specific Unites.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <PieChartIcon fontSize="small" /> {t('Add Quota')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>{t('Allocated Quotas')}</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Fiscal Year')}</th>
              <th>{t('Business Unite')}</th>
              <th>{t('Quota Limit')}</th>
              <th style={{ width: '100px' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {quotas.map(q => (
              <tr key={q.id}>
                <td><strong>{q.year}</strong></td>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? t('Edit Quota') : t('Assign Quota')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Fiscal Year')}</label>
                <input 
                  type="number" 
                  className="filter-select" 
                  value={form.year} 
                  onChange={e => setForm(current => ({ ...current, year: e.target.value }))} 
                  placeholder={t('e.g. 2028')} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>{t('Unite')}</label>
                <select value={form.unite} onChange={e => setForm(current => ({ ...current, unite: e.target.value }))} required>
                  <option value="" disabled>{t('Select Unite...')}</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('Quota Count')}</label>
                <input type="number" className="filter-select" value={form.quota} onChange={e => setForm(current => ({ ...current, quota: e.target.value }))} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const OrganizationPage: React.FC = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: TabKey = isTabKey(requestedTab) ? requestedTab : 'companies';

  const handleTabChange = (_event: React.SyntheticEvent, nextValue: TabKey) => {
    setSearchParams({ tab: nextValue });
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Organization Setup')}</h1>
          <span className="breadcrumb">{t('Settings')} &gt; <span className="breadcrumb-active">{t('Companies, Unites, Grades & Quotas')}</span></span>
        </div>
      </header>

      <div className="card" style={{ paddingBottom: '8px' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 48 }}
        >
          <Tab value="companies" label={t('Companies')} />
          <Tab value="unites" label={t('Unites')} />
          <Tab value="grades" label={t('Grades')} />
          <Tab value="quotas" label={t('Quotas')} />
        </Tabs>
      </div>

      <TabPanel value="companies" activeTab={activeTab}>
        <CompaniesPanel />
      </TabPanel>

      <TabPanel value="unites" activeTab={activeTab}>
        <UnitesPanel />
      </TabPanel>

      <TabPanel value="grades" activeTab={activeTab}>
        <GradesPanel />
      </TabPanel>

      <TabPanel value="quotas" activeTab={activeTab}>
        <QuotasPanel />
      </TabPanel>
    </div>
  );
};

export default OrganizationPage;
