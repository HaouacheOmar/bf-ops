import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export default function GainLossPage() {
  const [gains, setGains] = useState([]);
  const [losses, setLosses] = useState([]);
  const [unites, setUnites] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    fetch('/api/unites/').then(res => res.json()).then(data => setUnites(data.results || data));
    fetch('/api/companies/').then(res => res.json()).then(data => setCompanies(data.results || data));
  }, []);

  useEffect(() => {
    let query = '?';
    if (selectedUnite) query += `unite=${selectedUnite}&`;
    if (selectedCompany) query += `company=${selectedCompany}`;

    fetch(`/api/gains/${query}`).then(res => res.json()).then(data => setGains(data.results || data));
    fetch(`/api/losses/${query}`).then(res => res.json()).then(data => setLosses(data.results || data));
  }, [selectedUnite, selectedCompany]);

  const filteredCompanies = selectedUnite 
    ? companies.filter((c: any) => c.unite === selectedUnite) 
    : companies;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        Gains & Losses Dashboard
      </Typography>
      
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Unite</InputLabel>
            <Select 
              value={selectedUnite} 
              onChange={(e) => {
                setSelectedUnite(e.target.value);
                setSelectedCompany('');
              }}
            >
              <MenuItem value=""><em>All Unites</em></MenuItem>
              {unites.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Company</InputLabel>
            <Select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={!selectedUnite && companies.length === 0}
            >
              <MenuItem value=""><em>All Companies</em></MenuItem>
              {filteredCompanies.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Styled to match the others, but with a green accent bar at the top */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="h6" fontWeight="medium" color="success.main" mb={2}>
              Gains (New Hires & Transfers In)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Person</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gains.map((g: any) => (
                  <TableRow key={g.id} hover>
                    <TableCell>{g.person_name}</TableCell>
                    <TableCell>{g.unite_name}</TableCell>
                    <TableCell>{g.company_name}</TableCell>
                    <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Styled to match the others, but with a red accent bar at the top */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid', borderColor: 'error.main' }}>
            <Typography variant="h6" fontWeight="medium" color="error.main" mb={2}>
              Losses (Deletions & Transfers Out)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Person</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {losses.map((l: any) => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.person_name}</TableCell>
                    <TableCell>{l.unite_name}</TableCell>
                    <TableCell>{l.company_name}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}