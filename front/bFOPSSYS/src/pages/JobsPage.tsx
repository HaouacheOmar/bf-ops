import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreateJobs } from '../api-jobs';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
interface Job {
  id: number;
  name: string;
  code: string;
  company: number;
  company_name: string;
  grade: number | null;
  grade_name?: string;
  max_workers: number;
  created_at: string;
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState({ name: '', code: '', company: '', grade: '', max_workers: '' });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError(null);
    setBulkSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      // Map/validate fields as needed
      const records = json.map(row => ({
        name: row.name || row.Name || '',
        code: row.code || row.Code || '',
        company: row.company || row.Company || '',
        grade: row.grade || row.Grade || '',
        max_workers: row.max_workers || row.MaxWorkers || row['Max Workers'] || '',
      }));
      await bulkCreateJobs(records);
      setBulkSuccess('Bulk upload successful!');
      fetchJobs();
    } catch (err: any) {
      setBulkError('Bulk upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setBulkUploading(false);
    }
  };

  const fetchJobs = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/jobs/', { params });
    setJobs(res.data);
  };
  const fetchCompanies = async () => {
    const res = await axios.get('/api/companies/');
    setCompanies(res.data);
  };
  const fetchGrades = async () => {
    const res = await axios.get('/api/grades/');
    setGrades(res.data);
  };
  useEffect(() => { fetchJobs(); fetchCompanies(); fetchGrades(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/jobs/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/jobs/', form);
    }
    setForm({ name: '', code: '', company: '', grade: '', max_workers: '' });
    fetchJobs();
  };
  const handleEdit = (job: Job) => {
    setEditing(job);
    setForm({ name: job.name, code: job.code, company: String(job.company), grade: job.grade ? String(job.grade) : '', max_workers: String(job.max_workers) });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/jobs/${id}/`);
    fetchJobs();
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Bulk Upload Jobs (Excel)</Typography>
        <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={bulkUploading} />
        {bulkUploading && <Typography color="info.main">Uploading...</Typography>}
        {bulkError && <Typography color="error.main">{bulkError}</Typography>}
        {bulkSuccess && <Typography color="success.main">{bulkSuccess}</Typography>}
      </Box>
      <Typography variant="h4" gutterBottom>
        Jobs
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <TextField label="Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
        <TextField label="Max Workers" type="number" value={form.max_workers} onChange={e => setForm(f => ({ ...f, max_workers: e.target.value }))} required />
        <TextField select label="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required>
          {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select label="Required Grade" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} required>
          <MenuItem value="">Select grade</MenuItem>
          {grades.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
        {editing && <Button onClick={() => { setEditing(null); setForm({ name: '', code: '', company: '', max_workers: '' }); }} color="secondary">Cancel</Button>}
      </Box>
      <TextField label="Filter by name/code" value={filter} onChange={e => setFilter(e.target.value)} sx={{ mb: 2 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Required Grade</TableCell>
              <TableCell>Max Workers</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell>{job.name}</TableCell>
                <TableCell>{job.code}</TableCell>
                <TableCell>{job.company_name || companies.find(c => c.id === job.company)?.name || ''}</TableCell>
                <TableCell>{job.grade_name || grades.find(g => g.id === job.grade)?.name || ''}</TableCell>
                <TableCell>{job.max_workers}</TableCell>
                <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(job)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(job.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default JobsPage;
