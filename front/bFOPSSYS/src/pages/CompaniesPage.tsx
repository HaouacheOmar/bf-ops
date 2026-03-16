import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, IconButton } from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Company {
  id: number;
  name: string;
  code: string;
  jobs_count: number;
  created_at: string;
}

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  // Helper to ensure companies is always an array
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchCompanies = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/companies/', { params });
    setCompanies(res.data);
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/companies/${editing.id}/`, form);
      setEditing(null);
    } else {
      await axios.post('/api/companies/', form);
    }
    setForm({ name: '', code: '' });
    fetchCompanies();
  };

  const handleEdit = (company: Company) => {
    setEditing(company);
    setForm({ name: company.name, code: company.code });
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`/api/companies/${id}/`);
    fetchCompanies();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Companies
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        <TextField
          label="Code"
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          required
        />
        <Button type="submit" variant="contained" color="primary">
          {editing ? 'Update' : 'Add'}
        </Button>
        {editing && (
          <Button onClick={() => { setEditing(null); setForm({ name: '', code: '' }); }} color="secondary">
            Cancel
          </Button>
        )}
      </Box>
      <TextField
        label="Filter by name or code"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Services Count</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No companies found.</TableCell>
              </TableRow>
            ) : (
              safeCompanies.map(company => (
                <TableRow key={company.id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.code}</TableCell>
                  <TableCell>{company.services_count}</TableCell>
                  <TableCell>{new Date(company.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(company)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(company.id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CompaniesPage;
