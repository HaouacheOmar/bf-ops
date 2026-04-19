import React, { useState, useEffect } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Paper, Alert, Box } from '@mui/material';
import '../styles/layout.css';

export default function TransferPage() {
  const [assignments, setAssignments] = useState([]);
  const [unites, setUnites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [reason, setReason] = useState('');

  const [currentWorkerInfo, setCurrentWorkerInfo] = useState<any>(null);

  const fetchTransfers = () => {
    fetch('/api/transfers/').then(res => res.json()).then(data => setTransfers(data.results || data));
  };

  useEffect(() => {
    fetch('/api/assignments/').then(res => res.json()).then(data => setAssignments(data.results || data));
    fetch('/api/unites/').then(res => res.json()).then(data => setUnites(data.results || data));
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      setCurrentWorkerInfo(assignments.find((a: any) => a.id === selectedAssignment));
    } else {
      setCurrentWorkerInfo(null);
    }
  }, [selectedAssignment, assignments]);

  useEffect(() => {
    if (selectedUnite) {
      fetch(`/api/companies/?unite=${selectedUnite}`)
        .then(res => res.json())
        .then(data => setCompanies(data.results || data))
        .catch(err => console.error(err));
      setSelectedCompany('');
    } else {
      setCompanies([]);
      setSelectedCompany('');
    }
  }, [selectedUnite]);

  const handleTransfer = async () => {
    if (!selectedAssignment || !selectedUnite || !selectedCompany) {
      alert("Veuillez sélectionner un travailleur, une unité ET une compagnie de destination.");
      return;
    }

    const response = await fetch('/api/transfers/execute/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: selectedAssignment,
        new_unite_id: selectedUnite,
        new_company_id: selectedCompany,
        reason: reason
      })
    });
    
    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      setSelectedAssignment('');
      setSelectedUnite('');
      setSelectedCompany('');
      setReason('');
      
      // Refresh to update labels dynamically
      fetch('/api/assignments/').then(res => res.json()).then(data => setAssignments(data.results || data));
      fetchTransfers(); 
    } else {
      alert(`Erreur: ${data.error}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        Transfert de Personnel
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* FORM SECTION */}
        <Paper elevation={2} sx={{ p: 4, flex: 1, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="medium" mb={3}>Nouveau Transfert</Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>1. Sélectionner l'employé</InputLabel>
            <Select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} label="1. Sélectionner l'employé">
              {assignments.map((a: any) => (
                <MenuItem key={a.id} value={a.id}>{a.person_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {currentWorkerInfo && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <strong>Unité Actuelle :</strong> {currentWorkerInfo.unite_name || "N/A"} <br/>
              <strong>Compagnie Actuelle :</strong> {currentWorkerInfo.company_name || "N/A"}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>2. Unité de Destination</InputLabel>
            <Select 
              value={selectedUnite} 
              onChange={(e) => setSelectedUnite(e.target.value)}
              label="2. Unité de Destination"
              disabled={!selectedAssignment}
            >
              {unites.map((u: any) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.code})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>3. Compagnie de Destination</InputLabel>
            <Select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              label="3. Compagnie de Destination"
              disabled={!selectedUnite || companies.length === 0}
            >
              {companies.map((c: any) => (
                <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            fullWidth label="4. Motif du transfert (Optionnel)" 
            value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mb: 4 }}
          />

          <Button variant="contained" color="primary" size="large" fullWidth onClick={handleTransfer} sx={{ py: 1.5, borderRadius: 2 }}>
            Valider le transfert
          </Button>
        </Paper>

        {/* TABLE SECTION */}
        <Paper elevation={2} sx={{ p: 4, flex: 2, borderRadius: 2, overflowX: 'auto' }}>
           <Typography variant="h6" fontWeight="medium" mb={3}>Historique des Transferts</Typography>
           <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employé</th>
                  <th>Départ (Unité / Compagnie)</th>
                  <th>Arrivée (Unité / Compagnie)</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t: any) => (
                  <tr key={t.id}>
                    <td>{new Date(t.transfer_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 'bold' }}>{t.person_name}</td>
                    <td>
                      <span style={{ color: '#d32f2f', fontWeight: '500' }}>
                        {t.from_unite_name} <br/>
                        <small>{t.from_company_name}</small>
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#2e7d32', fontWeight: '500' }}>
                        {t.to_unite_name} <br/>
                        <small>{t.to_company_name}</small>
                      </span>
                    </td>
                    <td>{t.reason || '-'}</td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign: 'center'}}>Aucun transfert trouvé.</td></tr>
                )}
              </tbody>
           </table>
        </Paper>
      </Box>
    </Box>
  );
}