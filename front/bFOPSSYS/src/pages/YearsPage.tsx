import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Year {
  id: number;
  year: number;
  total_quota: number;
  is_closed: boolean;
  created_at: string;
}

const YearsPage = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Year | null>(null);
  const [form, setForm] = useState({ year: '', total_quota: '', is_closed: false });

  const fetchYears = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/years/', { params });
    setYears(res.data);
  };
  useEffect(() => { fetchYears(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/years/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/years/', form);
    }
    setForm({ year: '', total_quota: '', is_closed: false });
    fetchYears();
  };
  const handleEdit = (year: Year) => {
    setEditing(year);
    setForm({ year: String(year.year), total_quota: String(year.total_quota), is_closed: year.is_closed });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/years/${id}/`);
    fetchYears();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Years
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required />
        <TextField label="Total Quota" type="number" value={form.total_quota} onChange={e => setForm(f => ({ ...f, total_quota: e.target.value }))} required />
        <FormControlLabel
          control={<Checkbox checked={form.is_closed} onChange={e => setForm(f => ({ ...f, is_closed: e.target.checked }))} />}
          label="Is Closed"
        />
        <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
        {editing && <Button onClick={() => { setEditing(null); setForm({ year: '', total_quota: '', is_closed: false }); }} color="secondary">Cancel</Button>}
      </Box>
      <TextField label="Filter by year" value={filter} onChange={e => setFilter(e.target.value)} sx={{ mb: 2 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Total Quota</TableCell>
              <TableCell>Is Closed</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {years.map(year => (
              <TableRow key={year.id}>
                <TableCell>{year.year}</TableCell>
                <TableCell>{year.total_quota}</TableCell>
                <TableCell>{year.is_closed ? 'Yes' : 'No'}</TableCell>
                <TableCell>{new Date(year.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(year)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(year.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default YearsPage;
