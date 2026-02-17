import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from '@mui/material';
import { PhoneAndroid, Person, AccessTime } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data.data.devices);
    } catch (error) {
      toast.error('Failed to fetch devices');
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return null;
  };

  return (
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="devices-page">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Analytics
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Usage by Device
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Track device usage and last login times for all registered devices.
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : devices.length === 0 ? (
        <Paper
          elevation={0}
          data-testid="empty-state"
          sx={{
            p: 8,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              bgcolor: 'rgba(249, 185, 112, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <PhoneAndroid sx={{ fontSize: 40, color: '#EF5C1E' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No devices yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            Devices will appear here once users are activated with device IDs.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          data-testid="devices-table-container"
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Device ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Added On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device, index) => (
                <TableRow
                  key={device.device_id || index}
                  data-testid={`device-row-${device.device_id}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneAndroid sx={{ fontSize: 18, color: '#9c27b0' }} />
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {device.device_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {device.user_id || <Typography color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {device.user_name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {device.user_name}
                      </Box>
                    ) : (
                      <Typography color="text.disabled">No user assigned</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {device.phone || <Typography color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {device.last_login_at ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {formatDate(device.last_login_at)}
                          </Typography>
                          {getTimeSince(device.last_login_at) && (
                            <Chip
                              label={getTimeSince(device.last_login_at)}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(76, 175, 80, 0.15)',
                                color: '#2e7d32',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Chip
                        label="Never logged in"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(158, 158, 158, 0.15)',
                          color: '#757575',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {formatDate(device.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Total count */}
      {!loading && devices.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
          data-testid="devices-total-count"
        >
          Total: {devices.length} device{devices.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
