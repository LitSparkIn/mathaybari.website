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
import { Bluetooth, Person, AccessTime } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BleUsagePage = () => {
  const [bleList, setBleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchBleUsage();
  }, []);

  const fetchBleUsage = async () => {
    try {
      const response = await axios.get(`${API}/ble-usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBleList(response.data.data.ble_list);
    } catch (error) {
      toast.error('Failed to fetch BLE usage data');
      console.error('Failed to fetch BLE usage:', error);
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
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="ble-usage-page">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Analytics
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Usage by BLE
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Track BLE usage and last login times for all registered BLE IDs.
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : bleList.length === 0 ? (
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
            <Bluetooth sx={{ fontSize: 40, color: '#EF5C1E' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No BLE IDs yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            BLE IDs will appear here once they are added to users.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          data-testid="ble-table-container"
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>BLE ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Added On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bleList.map((ble, index) => (
                <TableRow
                  key={ble.ble_id || index}
                  data-testid={`ble-row-${ble.ble_id}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Bluetooth sx={{ fontSize: 18, color: '#00bcd4' }} />
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {ble.ble_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {ble.user_id || <Typography color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {ble.user_name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {ble.user_name}
                      </Box>
                    ) : (
                      <Typography color="text.disabled">No user assigned</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {ble.phone || <Typography color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {ble.last_login_at ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {formatDate(ble.last_login_at)}
                          </Typography>
                          {getTimeSince(ble.last_login_at) && (
                            <Chip
                              label={getTimeSince(ble.last_login_at)}
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
                    {formatDate(ble.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Total count */}
      {!loading && bleList.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
          data-testid="ble-total-count"
        >
          Total: {bleList.length} BLE ID{bleList.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
