import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ person: '', job: '', year: '', contract_type: 'permanent' });
  const [gradePopup, setGradePopup] = useState(false);
  const [gradePopupMsg, setGradePopupMsg] = useState('');

  const fetchAssignments = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/assignments/', { params });
    setAssignments(res.data);
  };
  const fetchOptions = async () => {
    const [p, j, y] = await Promise.all([
      axios.get('/api/persons/'),
      axios.get('/api/jobs/'),
      axios.get('/api/years/'),
    ]);
    setPersons(p.data); setJobs(j.data); setYears(y.data);
  };
  useEffect(() => { fetchAssignments(); }, [filter]);
  useEffect(() => { fetchOptions(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Find selected person and job
    const person = persons.find(p => String(p.id) === String(form.person));
    const job = jobs.find(j => String(j.id) === String(form.job));
    if (person && job) {
      if (job.grade && person.grade !== job.grade) {
        setGradePopupMsg("Person's grade does not match the required grade for this job.");
        setGradePopup(true);
        return;
      }
      if (job.grade && !person.grade) {
        setGradePopupMsg("Person does not have a grade but the job requires one.");
        setGradePopup(true);
        return;
      }
      if (!job.grade && person.grade) {
        setGradePopupMsg("Job does not require a grade but person has one. Assignment allowed.");
        // Not blocking, just info
      }
    }
    if (editing) {
      await axios.put(`/api/assignments/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/assignments/', form);
    }
    setForm({ person: '', job: '', year: '', contract_type: 'permanent' });
    fetchAssignments();
  };
  const handleEdit = (a: Assignment) => {
    setEditing(a);
    setForm({ person: String(a.person), job: String(a.job), year: String(a.year), contract_type: a.contract_type });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/assignments/${id}/`);
    fetchAssignments();
  };

  return (
    <Box>
      <Dialog open={gradePopup} onClose={() => setGradePopup(false)}>
        <DialogTitle>Grade Mismatch</DialogTitle>
        <DialogContent>{gradePopupMsg}</DialogContent>
        <DialogActions>
          <Button onClick={() => setGradePopup(false)}>OK</Button>
        </DialogActions>
      </Dialog>
      <Typography variant="h4" gutterBottom>Assignments</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Person</InputLabel>
          <Select value={form.person} label="Person" onChange={e => setForm(f => ({ ...f, person: e.target.value }))} required>
            {persons.map(p => <MenuItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Job</InputLabel>
          <Select value={form.job} label="Job" onChange={e => setForm(f => ({ ...f, job: e.target.value }))} required>
            {jobs.map(j => <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={form.year} label="Year" onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required>
            {years.map(y => <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Contract Type</InputLabel>
          <Select value={form.contract_type} label="Contract Type" onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))} required>
            <MenuItem value="permanent">Permanent</MenuItem>
            <MenuItem value="temporary">Temporary</MenuItem>
            <MenuItem value="intern">Intern</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
        {editing && <Button onClick={() => { setEditing(null); setForm({ person: '', job: '', year: '', contract_type: 'permanent' }); }} color="secondary">Cancel</Button>}
      </Box>
      <TextField label="Filter by person/job" value={filter} onChange={e => setFilter(e.target.value)} sx={{ mb: 2 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Person</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Job</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Contract Type</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.person_name}</TableCell>
                <TableCell>{a.company_name}</TableCell>
                <TableCell>{a.job_name}</TableCell>
                <TableCell>{a.year_value}</TableCell>
                <TableCell>{a.contract_type}</TableCell>
                <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(a)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(a.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AssignmentsPage;
