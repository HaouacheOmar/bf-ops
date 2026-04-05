import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PieChartIcon from '@mui/icons-material/PieChart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { api } from '../api';
import '../styles/layout.css';

const tabOrder = ['companies', 'unites', 'grades', 'years', 'quotas'] as const;
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
    if (window.confirm('Delete this company?')) {
      await api.delete(`/companies/${id}/`);
      setCompanies(current => current.filter(company => company.id !== id));
    }
  };

  const getCompanyJobs = (companyId: number) => jobs.filter(job => Number(job.company) === companyId);

  return (
    <>
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
            <button className="text-btn" onClick={() => setFilter('')}>RESET ALL</button>
          </div>
          <div className="filters-row">
            <div className="filter-group" style={{ position: 'relative' }}>
              <label className="filter-label">Search Companies</label>
              <SearchIcon style={{ position: 'absolute', left: '12px', top: '36px', color: '#9ca3af', fontSize: '18px' }} />
              <input
                type="text"
                className="filter-select"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by name or code..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Unite</label>
              <select className="filter-select">
                <option>All Unites</option>
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
            <h2 className="card-title" style={{ marginBottom: '4px' }}>Registered Companies</h2>
            <p className="card-subtitle" style={{ margin: 0 }}>{companies.length} total companies</p>
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
                        <div style={{ marginTop: 4, fontSize: '12px', color: '#9ca3af' }}>No jobs assigned</div>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? 'Edit Company' : 'Add Company'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Company Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Unite</label>
                <select value={form.unite} onChange={e => setForm(current => ({ ...current, unite: e.target.value }))} required>
                  <option value="" disabled>Select unite...</option>
                  {unites.map(unite => <option key={unite.id} value={unite.id}>{unite.name}</option>)}
                </select>
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
    </>
  );
};

const UnitesPanel = () => {
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
    if (window.confirm('Delete this unite?')) {
      await api.delete(`/unites/${id}/`);
      setUnites(current => current.filter(unite => unite.id !== id));
    }
  };

  return (
    <>
      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
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
          <h2 className="card-title" style={{ marginBottom: '4px' }}>Registered Unites</h2>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? 'Edit Unite' : 'Create Unite'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Unite Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Unite Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
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
    </>
  );
};

const GradesPanel = () => {
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
    if (window.confirm('Delete this grade?')) {
      await api.delete(`/grades/${id}/`);
      setGrades(current => current.filter(grade => grade.id !== id));
    }
  };

  return (
    <>
      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
        <div className="card">
          <h2 className="card-title">New Grade</h2>
          <p className="card-subtitle">Define a new employee seniority grade.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <StarIcon fontSize="small" /> Add Grade
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>Grades Dictionary</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Grade Name</th>
              <th>Reference Code</th>
              <th style={{ width: '100px' }}>Actions</th>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? 'Edit Grade' : 'Create Grade'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Grade Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Grade Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} required />
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
    </>
  );
};

const YearsPanel = () => {
  const [years, setYears] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ year: '', total_quota: '', is_closed: false });

  const fetchYears = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await api.get('/years/', { params });
    setYears(normalizeList(res.data));
  };

  useEffect(() => {
    void fetchYears();
  }, [filter]);

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
      await api.put(`/years/${editing.id}/`, form);
    } else {
      await api.post('/years/', form);
    }

    closeForm();
    void fetchYears();
  };

  const handleEdit = (year: any) => {
    setEditing(year);
    setForm({
      year: String(year.year),
      total_quota: String(year.total_quota),
      is_closed: year.is_closed,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this fiscal year?')) {
      await api.delete(`/years/${id}/`);
      void fetchYears();
    }
  };

  return (
    <>
      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">New Fiscal Year</h2>
          <p className="card-subtitle">Initialize a new financial year and total quotas.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <CalendarTodayIcon fontSize="small" /> Add Year
          </button>
        </div>
        <div className="card">
          <div className="card-title">
            <span>FISCAL YEAR FILTERS</span>
            <button className="text-btn" onClick={() => setFilter('')}>RESET ALL</button>
          </div>
          <div className="filters-row">
            <div className="filter-group" style={{ position: 'relative' }}>
              <label className="filter-label">Search Years</label>
              <SearchIcon style={{ position: 'absolute', left: '12px', top: '36px', color: '#9ca3af', fontSize: '18px' }} />
              <input
                type="text"
                className="filter-select"
                style={{ paddingLeft: '36px' }}
                placeholder="Search years..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{ marginBottom: '4px' }}>Year Registries</h2>
            <p className="card-subtitle" style={{ margin: 0 }}>{years.length} total years</p>
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
                <td>{year.created_at ? new Date(year.created_at).toLocaleDateString() : '-'}</td>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? 'Edit Year' : 'Add Year'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fiscal Year</label>
                <input type="number" className="filter-select" value={form.year} onChange={e => setForm(current => ({ ...current, year: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Total Quota</label>
                <input type="number" className="filter-select" value={form.total_quota} onChange={e => setForm(current => ({ ...current, total_quota: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.is_closed} onChange={e => setForm(current => ({ ...current, is_closed: e.target.checked }))} id="closedCheck" />
                <label htmlFor="closedCheck" style={{ margin: 0 }}>Is Closed?</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const QuotasPanel = () => {
  const [quotas, setQuotas] = useState<any[]>([]);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
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
    if (window.confirm('Delete this quota?')) {
      await api.delete(`/unite-quotas/${id}/`);
      void fetchQuotas();
    }
  };

  return (
    <>
      <Dialog open={showPopup} onClose={() => setShowPopup(false)}>
        <DialogTitle>Quota Exceeded</DialogTitle>
        <DialogContent>{popupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPopup(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      <div className="top-grid" style={{ gridTemplateColumns: '300px' }}>
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
          <h2 className="card-title" style={{ marginBottom: '4px' }}>Allocated Quotas</h2>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editing ? 'Edit Quota' : 'Assign Quota'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fiscal Year</label>
                <select value={form.year} onChange={e => setForm(current => ({ ...current, year: e.target.value }))} required>
                  <option value="" disabled>Select Year...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unite</label>
                <select value={form.unite} onChange={e => setForm(current => ({ ...current, unite: e.target.value }))} required>
                  <option value="" disabled>Select Unite...</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quota Count</label>
                <input type="number" className="filter-select" value={form.quota} onChange={e => setForm(current => ({ ...current, quota: e.target.value }))} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const OrganizationPage: React.FC = () => {
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
          <h1>Organization Setup</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Companies, Unites, Grades, Years &amp; Quotas</span></span>
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
          <Tab value="companies" label="Companies" />
          <Tab value="unites" label="Unites" />
          <Tab value="grades" label="Grades" />
          <Tab value="years" label="Years" />
          <Tab value="quotas" label="Quotas" />
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

      <TabPanel value="years" activeTab={activeTab}>
        <YearsPanel />
      </TabPanel>

      <TabPanel value="quotas" activeTab={activeTab}>
        <QuotasPanel />
      </TabPanel>
    </div>
  );
};

export default OrganizationPage;
