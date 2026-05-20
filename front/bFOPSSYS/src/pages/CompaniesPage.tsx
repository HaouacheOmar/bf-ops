import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import { useI18n } from '../i18n/translator';
import '../styles/layout.css'; // Shared CSS

interface Company {
  id: number;
  name: string;
  code: string;
  services_count?: number; 
  created_at: string;
  unite?: number;
}

const CompaniesPage = () => {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', code: '', unite: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const safeCompanies = Array.isArray(companies) ? companies : [];

  const fetchCompanies = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/companies/', { params });
    setCompanies(res.data.results || res.data);
  };

  useEffect(() => {
    fetchCompanies();
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
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
        const res = await axios.put(`/api/companies/${editing.id}/`, form);
        setCompanies(companies.map(c => c.id === editing.id ? res.data : c));
      } else {
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
    if(window.confirm(t('Delete this company?'))) {
      await axios.delete(`/api/companies/${id}/`);
      setCompanies(companies.filter(c => c.id !== id));
    }
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

      const records: any[] = [];
      const errors: string[] = [];
      const normalize = (value: any) => String(value || '').replace(/\s+/g, '').toLowerCase();

      json.forEach((row, index) => {
        const rowNum = index + 2;
        const getVal = (possibleKeys: string[]) => {
          const keys = Object.keys(row);
          for (const k of keys) {
            if (possibleKeys.includes(k.trim().toLowerCase())) {
              return row[k];
            }
          }
          return '';
        };

        const name = String(getVal(['name'])).trim();
        const code = String(getVal(['code'])).trim();
        const uniteRaw = getVal(['unite']);
        const uniteMatch = unites.find((u) => normalize(u.name) === normalize(uniteRaw) || String(u.id) === String(uniteRaw).trim());

        if (!name) errors.push(`Row ${rowNum}: Company name is required.`);
        if (!uniteMatch) errors.push(`Row ${rowNum}: Unite "${uniteRaw}" does not exist.`);

        const sanitizedCode = String(code || '').trim() || (name ? String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,10) : `COMP-${Math.floor(1000+Math.random()*9000)}`);
        records.push({
          name,
          code: sanitizedCode,
          unite: uniteMatch?.id,
        });
      });

      if (errors.length > 0) {
        alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + errors.join('\n'));
        return;
      }

      const res = await axios.post('/api/companies/bulk_create/', records);
      const payload = res.data || {};
      const details = payload.errors ? `\n\n${(payload.errors as string[]).join('\n')}` : '';
      alert((payload.message || t('Bulk upload successful!')) + details);
      fetchCompanies();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.response?.data?.error || err?.message || t('Unknown error')));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Companies')}</h1>
          <span className="breadcrumb">{t('Settings')} &gt; <span className="breadcrumb-active">{t('Companies Directory')}</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input type="text" placeholder={t('Search by name or code...')} value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </header>

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
            <Tooltip title={t('View Expected Excel Format')}>
              <button className="btn btn-outline" onClick={() => setPreviewOpen(true)} style={{ padding: '8px 12px' }}>
                <InfoIcon fontSize="small" />
              </button>
            </Tooltip>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={bulkUploading}>
              <UploadFileIcon fontSize="small" />
              {bulkUploading ? t('Uploading...') : t('Bulk Upload')}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            <span>{t('INTELLIGENT FILTERS')}</span>
            <button className="text-btn">{t('RESET ALL')}</button>
          </div>
          <div className="filters-row">
             <div className="filter-group">
              <label className="filter-label">{t('Unite')}</label>
              <select className="filter-select"><option>{t('All Unites')}</option></select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>{t('Registered Companies')}</h2>
            <p className="card-subtitle" style={{margin: 0}}>{safeCompanies.length} {t('total companies')}</p>
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
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? t('Edit Company') : t('Add Company')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Company Name')}</label>
                <input type="text" className="filter-select" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('Company Code')}</label>
                <input type="text" className="filter-select" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder={t('Leave blank for auto generation')} />
              </div>
              <div className="form-group">
                <label>{t('Unite')}</label>
                <select value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} required>
                  <option value="" disabled>{t('Select unite...')}</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('Update') : t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Expected Excel Format for Companies')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            {t('Ensure your Excel file has a heading row matching these exact column names. If code cell is empty, it will be auto-generated.')}
          </Typography>
          <Table size="small" sx={{ mt: 2, border: '1px solid #ddd' }}>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>name</strong></TableCell>
                <TableCell><strong>code</strong></TableCell>
                <TableCell><strong>unite</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Compagnie 1</TableCell>
                <TableCell>C1</TableCell>
                <TableCell>Bataillon</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Compagnie 2</TableCell>
                <TableCell></TableCell>
                <TableCell>Regiment</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default CompaniesPage;