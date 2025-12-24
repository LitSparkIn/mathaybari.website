import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { Dashboard, People, Logout } from '@mui/icons-material';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <Dashboard />, label: 'Dashboard' },
    { to: '/users', icon: <People />, label: 'Users' },
  ];

  return (
    <Box
      component="aside"
      data-testid="sidebar"
      sx={{
        width: 280,
        minHeight: '100vh',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h5"
          data-testid="app-logo"
          sx={{
            fontWeight: 700,
            color: '#EF5C1E',
            letterSpacing: '-0.02em',
          }}
        >
          MathayBari
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          ADMIN PANEL
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ px: 2, mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase()}`}
              sx={{
                borderRadius: 3,
                '&.active': {
                  bgcolor: 'rgba(249, 185, 112, 0.15)',
                  '& .MuiListItemIcon-root': {
                    color: '#EF5C1E',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#EF5C1E',
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(249, 185, 112, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* User & Logout */}
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          LOGGED IN AS
        </Typography>
        <Typography
          variant="body2"
          data-testid="user-email"
          sx={{
            mt: 0.5,
            mb: 2,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user?.email}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
          data-testid="logout-button"
          sx={{
            borderRadius: 3,
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              borderColor: '#EF5C1E',
              color: '#EF5C1E',
              bgcolor: 'rgba(239, 92, 30, 0.05)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};
