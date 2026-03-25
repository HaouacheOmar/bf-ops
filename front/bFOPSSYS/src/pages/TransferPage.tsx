import React, { useState, useEffect } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Paper, Alert, Box } from '@mui/material';

export default function TransferPage() {
  const [assignments, setAssignments] = useState([]);
  const [unites, setUnites] = useState([]);

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedUnite, setSelectedUnite] = useState('');
  const [reason, setReason] = useState('');

  const [currentWorkerInfo, setCurrentWorkerInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/assignments/').then(res => res.json()).then(data => setAssignments(data.results || data));
    fetch('/api/unites/').then(res => res.json()).then(data => setUnites(data.results || data));
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      setCurrentWorkerInfo(assignments.find((a: any) => a.id === selectedAssignment));
    } else {
      setCurrentWorkerInfo(null);
    }
  }, [selectedAssignment, assignments]);

  const handleTransfer = async () => {
    if (!selectedAssignment || !selectedUnite) {
      alert("Veuillez sélectionner un travailleur et une unité de destination.");
      return;
    }

    const response = await fetch('/api/transfers/execute/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: selectedAssignment,
        new_unite_id: selectedUnite,
        reason: reason
      })
    });
    
    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      setSelectedAssignment('');
      setSelectedUnite('');
      setReason('');
    } else {
      alert(`Erreur: ${data.error}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        Transfer Worker
      </Typography>

      <Paper elevation={2} sx={{ p: 4, maxWidth: 600, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="medium" mb={3}>
          Transfert d'Unité
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>1. Sélectionner l'employé</InputLabel>
          <Select 
            value={selectedAssignment} 
            onChange={(e) => setSelectedAssignment(e.target.value)}
            label="1. Sélectionner l'employé"
          >
            {assignments.map((a: any) => (
              <MenuItem key={a.id} value={a.id}>
                {a.person_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentWorkerInfo && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <strong>Unité Actuelle :</strong> {currentWorkerInfo.unite_name || "Unité Inconnue"} <br/>
            <span style={{ fontSize: '0.85em', color: '#555' }}>
              (Poste actuel : {currentWorkerInfo.job_name})
            </span>
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>2. Unité de Destination</InputLabel>
          <Select 
            value={selectedUnite} 
            onChange={(e) => setSelectedUnite(e.target.value)}
            label="2. Unité de Destination"
          >
            {unites.map((u: any) => (
              <MenuItem key={u.id} value={u.id}>{u.name} ({u.code})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField 
          fullWidth 
          label="Motif du transfert (Optionnel)" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          sx={{ mb: 4 }}
        />

        <Button variant="contained" color="primary" size="large" fullWidth onClick={handleTransfer} sx={{ py: 1.5, borderRadius: 2 }}>
          Valider le transfert
        </Button>
      </Paper>
    </Box>
  );
}