import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Box, Select, MenuItem, Container, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getUniteQuotas, createUniteQuota, updateUniteQuota, deleteUniteQuota } from '../api';
import axios from 'axios';

interface UniteQuota {
  id: number;
  year: number;
  unite: number;
  unite_name: string;
  quota: number;
}

const QuotaManagementPage: React.FC = () => {
  const [quotas, setQuotas] = useState<UniteQuota[]>([]);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [unites, setUnites] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<{ year: number | ''; unite: number | ''; quota: number | '' }>({ year: '', unite: '', quota: '' });
  const [editing, setEditing] = useState<UniteQuota | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [jobsSum, setJobsSum] = useState<number | null>(null);

  useEffect(() => {
    getUniteQuotas().then(res => setQuotas(res.data));
    axios.get('/api/years/').then(res => setYears(res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      year: typeof form.year === 'string' ? parseInt(form.year) : form.year,
      unite: typeof form.unite === 'string' ? parseInt(form.unite) : form.unite,
      quota: typeof form.quota === 'string' ? parseInt(form.quota) : form.quota,
    };
    // Fetch jobs for this unite and year
    if (payload.year && payload.unite) {
      const companiesRes = await axios.get('/api/companies/', { params: { unite: payload.unite } });
      const companyIds = companiesRes.data.map((c: any) => c.id);
      const jobsRes = await axios.get('/api/jobs/');
      const jobs = jobsRes.data.filter((j: any) => companyIds.includes(j.company));
      const sum = jobs.reduce((acc: number, j: any) => acc + Number(j.max_workers), 0);
      setJobsSum(sum);
      if (payload.quota < sum) {
        setPopupMsg(`The sum of max workers (${sum}) for jobs in this unite exceeds the yearly quota (${payload.quota}). Please adjust job quotas or increase the unite quota.`);
        setShowPopup(true);
        return;
      }
    }
    if (editing) {
      await updateUniteQuota(editing.id, payload);
      setEditing(null);
    } else {
      await createUniteQuota(payload);
    }
    setForm({ year: '', unite: '', quota: '' });
    getUniteQuotas().then(res => setQuotas(res.data));
  };

  const handleEdit = (quota: UniteQuota) => {
    setEditing(quota);
    setForm({ year: quota.year, unite: quota.unite, quota: quota.quota });
  };

  const handleDelete = async (id: number) => {
    await deleteUniteQuota(id);
    getUniteQuotas().then(res => setQuotas(res.data));
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quota Management
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Select
            value={form.year}
            onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
            displayEmpty
            required
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Select Year</MenuItem>
            {years.map(y => (
              <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Select
            value={form.unite}
            onChange={e => setForm(f => ({ ...f, unite: Number(e.target.value) }))}
            displayEmpty
            required
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Select Unite</MenuItem>
            {unites.map(u => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </Select>
          <TextField
            label="Quota"
            type="number"
            value={form.quota}
            onChange={e => setForm(f => ({ ...f, quota: Number(e.target.value) }))}
            required
            sx={{ minWidth: 120 }}
          />
          <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
          {editing && <Button onClick={() => { setEditing(null); setForm({ year: '', unite: '', quota: '' }); }} color="secondary">Cancel</Button>}
        </Box>
        <Dialog open={showPopup} onClose={() => setShowPopup(false)}>
          <DialogTitle>Quota Exceeded</DialogTitle>
          <DialogContent>{popupMsg}</DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPopup(false)}>OK</Button>
          </DialogActions>
        </Dialog>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Unite</TableCell>
                <TableCell>Quota</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotas.map(q => (
                <TableRow key={q.id}>
                  <TableCell>{years.find(y => y.id === q.year)?.year || q.year}</TableCell>
                  <TableCell>{q.unite_name}</TableCell>
                  <TableCell>{q.quota}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleEdit(q)} size="small">Edit</Button>
                    <Button onClick={() => handleDelete(q.id)} size="small" color="error">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default QuotaManagementPage;
