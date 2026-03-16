import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreatePersons } from '../api-persons';
import { getGrades } from '../api';
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
  contract_type: 'actif' | 'contractuel';
  grade: number | null;
  grade_name?: string;
}

const PersonsPage = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', contract_type: 'actif', grade: '' });
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    getGrades().then(res => setGrades(res.data));
  }, []);

  // Bulk upload state
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
        first_name: row.first_name || row.FirstName || row['First Name'] || '',
        last_name: row.last_name || row.LastName || row['Last Name'] || '',
        national_id: row.national_id || row.NationalID || row['National ID'] || '',
        date_of_birth: row.date_of_birth || row.DateOfBirth || row['Date of Birth'] || '',
        hire_date: row.hire_date || row.HireDate || row['Hire Date'] || '',
        contract_type: row.contract_type || row.ContractType || row['Contract Type'] || 'actif',
        grade: row.grade || row.Grade || '',
      }));
      await bulkCreatePersons(records);
      setBulkSuccess('Bulk upload successful!');
      fetchPersons();
    } catch (err: any) {
      setBulkError('Bulk upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setBulkUploading(false);
    }
  };

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
    setForm({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', contract_type: 'actif', grade: '' });
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
      contract_type: person.contract_type || 'actif',
      grade: person.grade || '',
    });
  };
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/persons/${id}/`);
    fetchPersons();
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Bulk Upload Persons (Excel)</Typography>
        <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={bulkUploading} />
        {bulkUploading && <Typography color="info.main">Uploading...</Typography>}
        {bulkError && <Typography color="error.main">{bulkError}</Typography>}
        {bulkSuccess && <Typography color="success.main">{bulkSuccess}</Typography>}
      </Box>
      <Typography variant="h4" gutterBottom>Persons</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="First Name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
        <TextField label="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
        <TextField label="National ID" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} required />
        <TextField label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <TextField label="Hire Date" type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <TextField
          select
          label="Type of Contract"
          value={form.contract_type}
          onChange={e => setForm(f => ({ ...f, contract_type: e.target.value as 'actif' | 'contractuel' }))}
          SelectProps={{ native: true }}
          required
        >
          <option value="actif">actif</option>
          <option value="contractuel">contractuel</option>
        </TextField>
        <TextField
          select
          label="Grade"
          value={form.grade}
          onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
          SelectProps={{ native: true }}
          required
        >
          <option value="">Select grade</option>
          {grades.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </TextField>
        <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
        {editing && <Button onClick={() => { setEditing(null); setForm({ first_name: '', last_name: '', national_id: '', date_of_birth: '', hire_date: '', contract_type: 'actif', grade: '' }); }} color="secondary">Cancel</Button>}
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
              <TableCell>Grade</TableCell>
              <TableCell>Type of Contract</TableCell>
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
                <TableCell>{person.grade_name || '-'}</TableCell>
                <TableCell>{person.contract_type}</TableCell>
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
