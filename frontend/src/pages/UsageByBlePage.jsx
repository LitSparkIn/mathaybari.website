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
import { Bluetooth } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UsageByBlePage = () => {
  const [bleDevices, setBleDevices] = useState([]);
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
      setBleDevices(response.data.data.ble_devices);
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
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="usage-by-ble-page">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Analytics
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Usage by BLE
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Track when each BLE device was last used.
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : bleDevices.length === 0 ? (
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
            No BLE devices tracked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            BLE usage data will appear here once users with BLE IDs start logging in.
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
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>BLE ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Logged In</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bleDevices.map((ble, index) => (
                <TableRow
                  key={ble.ble_id || index}
                  data-testid={`ble-row-${ble.ble_id}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell>
                    <Chip
                      label={ble.ble_id}
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        bgcolor: 'rgba(0, 188, 212, 0.1)',
                        color: '#00acc1',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {ble.user_id || '—'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {ble.user_name || '—'}
                  </TableCell>
                  <TableCell>
                    {ble.phone || '—'}
                  </TableCell>
                  <TableCell>
                    {ble.last_logged_in ? (
                      <Chip
                        label={formatDate(ble.last_logged_in)}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          color: '#2e7d32',
                          fontWeight: 500,
                        }}
                      />
                    ) : (
                      <Typography color="text.disabled">Never</Typography>
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
      {!loading && bleDevices.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
          data-testid="ble-total-count"
        >
          Total: {bleDevices.length} BLE device{bleDevices.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
