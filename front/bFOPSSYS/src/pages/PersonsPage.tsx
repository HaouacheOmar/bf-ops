import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  date_of_birth: string | null;
  hire_date: string | null;
  is_active: boolean;
}

const PersonsPage = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', is_active: true });

  const fetchPersons = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/persons/', { params });
    setPersons(res.data);
  };
  useEffect(() => { fetchPersons(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/persons/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/persons/', form);
    }
    setForm({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', is_active: true });
    fetchPersons();
  };
  const handleEdit = (person: Person) => {
    setEditing(person);
    setForm({
      first_name: person.first_name,
      last_name: person.last_name,
      national_id: person.national_id,
      date_of_birth: person.date_of_birth || '',
      hire_date: person.hire_date || '',
      is_active: person.is_active,
    });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/persons/${id}/`);
    fetchPersons();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Persons</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="First Name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
        <TextField label="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
        <TextField label="National ID" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} required />
        <TextField label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <TextField label="Hire Date" type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <FormControlLabel
          control={<Checkbox checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />}
          label="Active"
        />
        <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
        {editing && <Button onClick={() => { setEditing(null); setForm({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', is_active: true }); }} color="secondary">Cancel</Button>}
      </Box>
      <TextField label="Filter by name or ID" value={filter} onChange={e => setFilter(e.target.value)} sx={{ mb: 2 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>National ID</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {persons.map(person => (
              <TableRow key={person.id}>
                <TableCell>{person.first_name}</TableCell>
                <TableCell>{person.last_name}</TableCell>
                <TableCell>{person.national_id}</TableCell>
                <TableCell>{person.date_of_birth || '-'}</TableCell>
                <TableCell>{person.hire_date || '-'}</TableCell>
                <TableCell>{person.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(person)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(person.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PersonsPage;
