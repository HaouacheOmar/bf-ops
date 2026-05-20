import React, { useState, useEffect, useRef } from 'react';
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
import { api } from '../api'; // Swapped out createGrade to use api directly
import * as XLSX from 'xlsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import { useI18n } from '../i18n/translator';
import '../styles/layout.css';

const GradeCreatePage: React.FC = () => {
  const { t } = useI18n();
  const [grades, setGrades] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '', rating: '0' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const sortedGrades = [...grades].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  const fetchGrades = async () => {
    const res = await api.get('/grades/');
    setGrades(res.data.results || res.data);
  };
  
  useEffect(() => { fetchGrades(); }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '', rating: '0' });
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
      const payload = {
        ...form,
        rating: parseInt(form.rating || '0', 10),
      };

      if (editing) {
        const res = await api.put(`/grades/${editing.id}/`, payload);
        setGrades(grades.map(g => g.id === editing.id ? res.data : g));
      } else {
        const res = await api.post('/grades/', payload);
        setGrades([...grades, res.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('Error saving grade'));
    }
  };

  const handleEdit = (grade: any) => {
    setEditing(grade);
    setForm({ name: grade.name, code: grade.code, rating: String(grade.rating ?? 0) });
    setError('');
    setIsFormOpen(true);
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

      const requiredColumns = ['name', 'code', 'rating'];
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
        const ratingRaw = getVal(['rating']);
        const rating = Number(ratingRaw);

        if (!name) errors.push(`Row ${rowNum}: Grade name is required.`);
        if (!Number.isInteger(rating)) errors.push(`Row ${rowNum}: Rating must be an integer.`);

        const sanitizedCode = String(code || '').trim() || (name ? String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,10) : `GRD-${Math.floor(1000+Math.random()*9000)}`);
        records.push({
          name,
          code: sanitizedCode,
          rating,
        });
      });

      if (errors.length > 0) {
        alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + errors.join('\n'));
        return;
      }

      const res = await api.post('/grades/bulk_create/', records);
      const payload = res.data || {};
      const details = payload.errors ? `\n\n${(payload.errors as string[]).join('\n')}` : '';
      alert((payload.message || t('Bulk upload successful!')) + details);
      fetchGrades();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.response?.data?.error || err?.message || t('Unknown error')));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if(window.confirm(t('Delete this grade?'))) {
      await api.delete(`/grades/${id}/`);
      // OPTIMISTIC UPDATE
      setGrades(grades.filter(g => g.id !== id));
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Employee Grades')}</h1>
          <span className="breadcrumb">{t('Settings')} &gt; <span className="breadcrumb-active">{t('Grades Dictionary')}</span></span>
        </div>
      </header>

      <div className="top-grid" style={{gridTemplateColumns: '300px'}}>
        <div className="card">
          <h2 className="card-title">{t('New Grade')}</h2>
          <p className="card-subtitle">{t('Define a new employee seniority grade.')}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <StarIcon fontSize="small" /> {t('Add Grade')}
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
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{marginBottom: '4px'}}>{t('Grades Dictionary')}</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Grade Name')}</th>
              <th>{t('Reference Code')}</th>
              <th>{t('Rating')}</th>
              <th style={{ width: '100px' }}>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedGrades.map((grade) => (
              <tr key={grade.id}>
                <td><strong>{grade.name}</strong></td>
                <td><span className="status-pill blue">{grade.code}</span></td>
                <td>{grade.rating}</td>
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
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? t('Edit Grade') : t('Create Grade')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Grade Name')}</label>
                <input type="text" className="filter-select" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>{t('Grade Code')}</label>
                <input type="text" className="filter-select" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder={t('Leave blank for auto generation')} />
              </div>
              <div className="form-group">
                <label>{t('Rating')}</label>
                <input type="number" className="filter-select" value={form.rating} onChange={(e) => setForm({...form, rating: e.target.value})} required />
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

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Expected Excel Format for Grades')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            {t('Ensure your Excel file has a heading row matching these exact column names. If code cell is empty, it will be auto-generated.')}
          </Typography>
          <Table size="small" sx={{ mt: 2, border: '1px solid #ddd' }}>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>name</strong></TableCell>
                <TableCell><strong>code</strong></TableCell>
                <TableCell><strong>rating</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Capitaine</TableCell>
                <TableCell>CAPT</TableCell>
                <TableCell>90</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Commandant</TableCell>
                <TableCell></TableCell>
                <TableCell>80</TableCell>
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
export default GradeCreatePage;