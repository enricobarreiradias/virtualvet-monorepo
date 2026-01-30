"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import { Visibility, VisibilityOff, Pets } from "@mui/icons-material";
import { AuthService } from "../services/api";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await AuthService.login({ email, password });
      
      const { accessToken, user } = response.data;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }

        router.push("/dashboard");
      } else {
        setError("Token não recebido. Tente novamente.");
      }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Email ou senha incorretos.");
      } else {
        setError("Erro ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        {/* Logo/Branding */}
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          mb={4}
          gap={1}
        >
          <Pets 
            sx={{ 
              fontSize: 32,
              color: theme.palette.primary.main,
            }} 
          />
          <Typography
            variant="h5"
            fontWeight={600}
            color="text.primary"
          >
            VirtualVet
          </Typography>
        </Box>

        {/* Card de Login */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: theme.palette.divider,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            padding: { xs: 3, sm: 4 },
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={500}
            gutterBottom
            color="text.primary"
          >
            Entrar
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={3}
          >
            Continue para a plataforma
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                }
              }}
            />

            <TextField
              fullWidth
              required
              label="Senha"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      disabled={loading}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.25,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: '0.875rem',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Entrar"
              )}
            </Button>
          </Box>

          {/* Links de ajuda */}
          <Box mt={3} pt={2} borderTop={1} borderColor="divider">
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
            >
              <Button
                variant="text"
                size="small"
                sx={{
                  textTransform: "none",
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                Esqueceu a senha?
              </Button>
              {" • "}
              <Button
                variant="text"
                size="small"
                sx={{
                  textTransform: "none",
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                Problemas para entrar?
              </Button>
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box mt={4}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
          >
            © {new Date().getFullYear()} VirtualVet
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}