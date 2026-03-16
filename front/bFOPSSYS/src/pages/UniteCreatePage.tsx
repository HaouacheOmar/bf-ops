import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { createUnite, api } from '../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UniteCreatePage: React.FC = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unites, setUnites] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchUnites = async () => {
    const res = await api.get('/unites/');
    setUnites(res.data);
  };
  useEffect(() => { fetchUnites(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await api.put(`/unites/${editing.id}/`, { name, code });
        setEditing(null);
        setSuccess('Unite updated successfully!');
      } else {
        await createUnite({ name, code });
        setSuccess('Unite created successfully!');
      }
      setName('');
      setCode('');
      fetchUnites();
    } catch (err: any) {
      if (err?.response?.data) {
        const detail = err.response.data.detail || JSON.stringify(err.response.data);
        setError(detail);
      } else {
        setError('Error creating unite');
      }
    }
  };

  const handleEdit = (unite: any) => {
    setEditing(unite);
    setName(unite.name);
    setCode(unite.code);
  };
  const handleDelete = async (id: number) => {
    await api.delete(`/unites/${id}/`);
    fetchUnites();
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create Unite
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="primary">{success}</Typography>}
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            {editing ? 'Update' : 'Create'}
          </Button>
          {editing && <Button onClick={() => { setEditing(null); setName(''); setCode(''); }} color="secondary" sx={{ mt: 2, ml: 2 }}>Cancel</Button>}
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Unites List</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unites.map((unite) => (
                  <TableRow key={unite.id}>
                    <TableCell>{unite.name}</TableCell>
                    <TableCell>{unite.code}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(unite)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(unite.id)} color="error"><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Container>
  );
};

export default UniteCreatePage;
