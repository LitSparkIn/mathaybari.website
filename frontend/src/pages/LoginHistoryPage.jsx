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
import { History, CheckCircle, Cancel } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
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
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
          View all login attempts with location data.
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
            Login attempts will appear here once users start logging in.
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
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Device ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Coordinates</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(record.logged_in_at)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {record.user_id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {record.user_name}
                  </TableCell>
                  <TableCell>
                    {record.phone}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.device_id}
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        bgcolor: 'rgba(156, 39, 176, 0.1)',
                        color: '#9c27b0',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {record.location ? (
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {record.location}
                      </Typography>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.lat_long ? (
                      <Chip
                        label={record.lat_long}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          color: '#1976d2',
                        }}
                      />
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.success ? 'Success' : 'Failed'}
                      size="small"
                      icon={record.success ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                      sx={{
                        borderRadius: 2,
                        bgcolor: record.success
                          ? 'rgba(76, 175, 80, 0.15)'
                          : 'rgba(244, 67, 54, 0.15)',
                        color: record.success ? '#2e7d32' : '#d32f2f',
                        fontWeight: 500,
                        '& .MuiChip-icon': {
                          color: record.success ? '#2e7d32' : '#d32f2f',
                        },
                      }}
                    />
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
          Total: {history.length} record{history.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
