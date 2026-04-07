import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordCheck, forgotPasswordReset } from '../api';
import { useI18n } from '../i18n/translator';

type ForgotStatus = 'idle' | 'admin' | 'guest';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useI18n();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [forgotStatus, setForgotStatus] = useState<ForgotStatus>('idle');
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotPassword, setForgotPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotResetLoading, setForgotResetLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(credentials);
            navigate('/');
        } catch (err: any) {
            setError(err?.response?.data?.detail || t('Unable to sign in with the provided credentials'));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotCheck = async () => {
        if (!forgotUsername.trim()) {
            setForgotMessage(t('Please enter a username'));
            setForgotStatus('idle');
            return;
        }

        setForgotLoading(true);
        setForgotMessage('');
        setForgotStatus('idle');

        try {
            const res = await forgotPasswordCheck(forgotUsername.trim());
            if (res.data?.can_reset) {
                setForgotStatus('admin');
                setForgotMessage(res.data?.message || t('This account is admin. You can set a new password'));
            } else {
                setForgotStatus('guest');
                setForgotMessage(res.data?.message || t('This account is guest. Please check with your manager'));
            }
        } catch (err: any) {
            const fallback = t('Username not found');
            setForgotMessage(err?.response?.data?.username?.[0] || err?.response?.data?.detail || fallback);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleForgotReset = async () => {
        if (!forgotPassword.trim()) {
            setForgotMessage(t('Please provide a new password first'));
            return;
        }

        setForgotResetLoading(true);

        try {
            const res = await forgotPasswordReset(forgotUsername.trim(), forgotPassword.trim());
            setForgotMessage(res.data?.message || t('Password changed successfully. You can login now'));
            setForgotPassword('');
        } catch (err: any) {
            setForgotMessage(err?.response?.data?.detail || t('Failed to reset password'));
        } finally {
            setForgotResetLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
                bgcolor: '#f4f6f8',
            }}
        >
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    position: 'relative',
                    p: 6,
                    color: '#fff',
                    overflow: 'hidden',
                    background: 'linear-gradient(155deg, #0f172a 0%, #1e293b 45%, #314EE7 100%)',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        width: 380,
                        height: 380,
                        borderRadius: '50%',
                        top: -150,
                        right: -80,
                        bgcolor: 'rgba(148, 163, 184, 0.15)',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        bottom: -80,
                        left: -60,
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                    }}
                />

                <Stack spacing={4} sx={{ position: 'relative', zIndex: 1, maxWidth: 540 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                            BFops HR
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.82, fontWeight: 600, letterSpacing: '1px' }}>
                            {t('EDITORIAL WORKSPACE')}
                        </Typography>
                    </Box>

                    <Box>
                        <Chip
                            icon={<ShieldOutlinedIcon />}
                            label={t('Secure Access')}
                            sx={{
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.35)',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                '& .MuiChip-icon': { color: '#fff' },
                            }}
                            variant="outlined"
                        />
                    </Box>

                    <Stack spacing={1.5}>
                        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                            {t('Workforce operations')},
                            <br />
                            {t('controlled with clarity')}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 470 }}>
                            {t('Sign in with your username and password to access dashboards, staffing workflows, and account management')}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'center',
                    p: { xs: 2, sm: 4, md: 6 },
                }}
            >
                <Stack sx={{ width: '100%', maxWidth: 440 }} spacing={2}>
                    <Paper
                        elevation={0}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            p: 2,
                            borderRadius: 3,
                            color: '#fff',
                            background: 'linear-gradient(145deg, #1e293b 0%, #314EE7 100%)',
                            boxShadow: '0 14px 28px rgba(15, 23, 42, 0.14)',
                        }}
                    >
                        <Stack spacing={1.2}>
                            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.3px' }}>
                                BFops HR
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, letterSpacing: '1px' }}>
                                {t('EDITORIAL WORKSPACE')}
                            </Typography>
                            <Chip
                                size="small"
                                icon={<ShieldOutlinedIcon />}
                                label={t('Secure Access')}
                                sx={{
                                    alignSelf: 'flex-start',
                                    color: '#fff',
                                    borderColor: 'rgba(255,255,255,0.35)',
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    '& .MuiChip-icon': { color: '#fff' },
                                }}
                                variant="outlined"
                            />
                        </Stack>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            width: '100%',
                            p: { xs: 2.2, sm: 4 },
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                            bgcolor: '#fff',
                        }}
                    >
                        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LockPersonOutlinedIcon color="primary" />
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                    {t('Sign In')}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {t('Welcome back. Enter your account credentials to continue')}
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error">{t(error)}</Alert>}

                        <TextField
                            label={t('Username')}
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            fullWidth
                            required
                            autoComplete="username"
                        />

                        <TextField
                            label={t('Password')}
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            fullWidth
                            required
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ py: 1.2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
                        >
                            {loading ? <CircularProgress color="inherit" size={22} /> : t('Login')}
                        </Button>

                        <Button
                            type="button"
                            variant="text"
                            startIcon={<KeyOutlinedIcon />}
                            onClick={() => {
                                setForgotOpen((prev) => !prev);
                                setForgotMessage('');
                                setForgotStatus('idle');
                                setForgotPassword('');
                            }}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
                        >
                            {t('Forgot password')}
                        </Button>

                        <Collapse in={forgotOpen}>
                            <Stack spacing={1.5} sx={{ pt: 1 }}>
                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {t('Forgot Password')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('Enter your username to continue')}
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <TextField
                                        size="small"
                                        label={t('Username')}
                                        value={forgotUsername}
                                        onChange={(e) => setForgotUsername(e.target.value)}
                                        fullWidth
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleForgotCheck}
                                        disabled={forgotLoading}
                                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        {forgotLoading ? <CircularProgress color="inherit" size={18} /> : t('Check Account')}
                                    </Button>
                                </Stack>

                                {forgotMessage && (
                                    <Alert severity={forgotStatus === 'guest' ? 'warning' : forgotStatus === 'admin' ? 'success' : 'info'}>
                                        {t(forgotMessage)}
                                    </Alert>
                                )}

                                {forgotStatus === 'admin' && (
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                        <TextField
                                            size="small"
                                            label={t('New Password')}
                                            type="password"
                                            value={forgotPassword}
                                            onChange={(e) => setForgotPassword(e.target.value)}
                                            fullWidth
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleForgotReset}
                                            disabled={forgotResetLoading}
                                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                                        >
                                            {forgotResetLoading ? <CircularProgress color="inherit" size={18} /> : t('Reset Password')}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        </Collapse>

                        <Typography variant="caption" color="text.secondary">
                            {t('Access is role-based. Admin and guest accounts have different permissions')}
                        </Typography>
                    </Stack>
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
};

export default LoginPage;
