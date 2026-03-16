import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuItem from '@mui/material/MenuItem';
interface Job {
  id: number;
  name: string;
  code: string;
  company: number;
  company_name: string;
  max_workers: number;
  created_at: string;
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState({ name: '', code: '', company: '', max_workers: '' });

  const fetchJobs = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/jobs/', { params });
    setJobs(res.data);
  };
  const fetchCompanies = async () => {
    const res = await axios.get('/api/companies/');
    setCompanies(res.data);
  };
  useEffect(() => { fetchJobs(); fetchCompanies(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/jobs/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/jobs/', form);
    }
    setForm({ name: '', code: '', company: '', max_workers: '' });
    fetchJobs();
  };
  const handleEdit = (job: Job) => {
    setEditing(job);
    setForm({ name: job.name, code: job.code, company: String(job.company), max_workers: String(job.max_workers) });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/jobs/${id}/`);
    fetchJobs();
  };

  return (
    <Box>
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
