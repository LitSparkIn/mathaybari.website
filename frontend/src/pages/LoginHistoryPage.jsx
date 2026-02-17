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
import { History, Person, Bluetooth, LocationOn, AccessTime, OpenInNew } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const response = await axios.get(`${API}/login-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.data.history);
    } catch (error) {
      toast.error('Failed to fetch login history');
      console.error('Failed to fetch login history:', error);
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
      second: '2-digit',
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
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="login-history-page">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Analytics
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Login History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          View all login attempts with location data from the app.
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
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
            <History sx={{ fontSize: 40, color: '#EF5C1E' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No login history yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            Login history will appear here once users start logging into the app.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          data-testid="history-table-container"
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Login Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>BLE IDs</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lat/Long</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record, index) => (
                <TableRow
                  key={index}
                  data-testid={`history-row-${index}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">
                          {formatDate(record.login_at)}
                        </Typography>
                        {getTimeSince(record.login_at) && (
                          <Chip
                            label={getTimeSince(record.login_at)}
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
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{record.user_id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      {record.user_name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{record.phone}</TableCell>
                  <TableCell>
                    {record.ble_ids && record.ble_ids.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {record.ble_ids.map((bleId, idx) => (
                          <Chip
                            key={idx}
                            icon={<Bluetooth sx={{ fontSize: 14 }} />}
                            label={bleId}
                            size="small"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              bgcolor: 'rgba(0, 188, 212, 0.15)',
                              color: '#00838f',
                              '& .MuiChip-icon': { color: '#00bcd4' },
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.last_known_location ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ fontSize: 18, color: '#f44336' }} />
                        <Typography variant="body2">{record.last_known_location}</Typography>
                      </Box>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.last_known_lat_long ? (
                      <Chip
                        label={record.last_known_lat_long}
                        size="small"
                        icon={<OpenInNew sx={{ fontSize: 14 }} />}
                        onClick={() => {
                          // Parse lat/long and open in Google Maps
                          const coords = record.last_known_lat_long;
                          window.open(`https://www.google.com/maps?q=${encodeURIComponent(coords)}`, '_blank');
                        }}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(33, 150, 243, 0.15)',
                          color: '#1976d2',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(33, 150, 243, 0.25)',
                          },
                          '& .MuiChip-icon': { 
                            color: '#1976d2',
                            fontSize: 14,
                          },
                        }}
                      />
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Total count */}
      {!loading && history.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
          data-testid="history-total-count"
        >
          Total: {history.length} login record{history.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
