import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      login(response.data.data.token, response.data.data.email);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      data-testid="login-page"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
      }}
    >
      {/* Left side - Login Form */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Logo */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#EF5C1E',
                letterSpacing: '-0.02em',
              }}
            >
              MathayBari
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Admin Panel
            </Typography>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              data-testid="login-email-input"
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 3 }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              data-testid="login-password-input"
              sx={{ mb: 4 }}
              InputProps={{
                sx: { borderRadius: 3 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              data-testid="login-submit-button"
              sx={{
                py: 1.5,
                borderRadius: 3,
                bgcolor: '#F9B970',
                color: '#1a1a1a',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#EF5C1E',
                  color: '#fff',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  Sign In
                  <ArrowForward sx={{ ml: 1 }} />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 4 }}
          >
            Secure admin access only
          </Typography>
        </Box>
      </Box>

      {/* Right side - Image */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'relative',
          bgcolor: '#f5f5f5',
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1561518065-a76ab6e7ab50?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMG1pbmltYWwlMjBhcmNoaXRlY3R1cmUlMjB3aGl0ZXxlbnwwfHx8fDE3NjYwNTY1Mzd8MA&ixlib=rb-4.1.0&q=85"
          alt="Abstract geometric architecture"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(100%)',
            opacity: 0.8,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 48,
            left: 48,
            right: 48,
          }}
        >
          <Typography
            variant="h5"
            sx={{ color: 'white', fontWeight: 600, lineHeight: 1.4 }}
          >
            "Simplicity is the ultimate sophistication."
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>
            — Leonardo da Vinci
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
