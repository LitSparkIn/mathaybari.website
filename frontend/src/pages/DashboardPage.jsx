import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { People, ArrowForward } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DashboardPage = () => {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axios.get(`${API}/users/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="dashboard-page">
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Overview
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Dashboard
        </Typography>
      </Box>

      {/* Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
        }}
      >
        {/* User Count Card */}
        <Paper
          elevation={0}
          data-testid="user-count-card"
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#F9B970',
              boxShadow: '0 4px 20px rgba(249, 185, 112, 0.15)',
            },
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'rgba(249, 185, 112, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <People sx={{ fontSize: 28, color: '#EF5C1E' }} />
          </Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
            Total Users
          </Typography>
          {loading ? (
            <CircularProgress size={32} sx={{ mt: 1 }} />
          ) : (
            <Typography
              variant="h2"
              data-testid="user-count-value"
              sx={{ fontWeight: 700, mt: 1 }}
            >
              {userCount}
            </Typography>
          )}
        </Paper>

        {/* View User Listing Card */}
        <Paper
          elevation={0}
          data-testid="view-users-card"
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#F9B970',
              boxShadow: '0 4px 20px rgba(249, 185, 112, 0.15)',
            },
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
              Quick Action
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, mb: 1 }}>
              User Listing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage all registered users in the system.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/users')}
            data-testid="view-user-listing-button"
            sx={{
              mt: 3,
              borderRadius: 3,
              py: 1.5,
              bgcolor: '#F9B970',
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#EF5C1E',
                color: '#fff',
              },
            }}
          >
            View User Listing
            <ArrowForward sx={{ ml: 1, fontSize: 20 }} />
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};
