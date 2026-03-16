import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { createGrade, api } from '../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GradeCreatePage: React.FC = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grades, setGrades] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchGrades = async () => {
    const res = await api.get('/grades/');
    setGrades(res.data);
  };
  useEffect(() => { fetchGrades(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await api.put(`/grades/${editing.id}/`, { name, code });
        setEditing(null);
        setSuccess('Grade updated successfully!');
      } else {
        await createGrade({ name, code });
        setSuccess('Grade created successfully!');
      }
      setName('');
      setCode('');
      fetchGrades();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error creating grade');
    }
  };

  const handleEdit = (grade: any) => {
    setEditing(grade);
    setName(grade.name);
    setCode(grade.code);
  };
  const handleDelete = async (id: number) => {
    await api.delete(`/grades/${id}/`);
    fetchGrades();
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create Grade
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
          <Typography variant="h6">Grades List</Typography>
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
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>{grade.name}</TableCell>
                    <TableCell>{grade.code}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(grade)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(grade.id)} color="error"><DeleteIcon /></IconButton>
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

export default GradeCreatePage;
