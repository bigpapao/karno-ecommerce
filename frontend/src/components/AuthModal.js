// src/components/AuthModal.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  styled,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { updateProfile, login } from '../store/slices/authSlice';
import { normalizePhoneNumber } from '../utils/phoneUtils';

// ───────────────────────────────── styled ────────────────────────────────────
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    margin: theme.spacing(2),
    [theme.breakpoints.up('sm')]: { margin: theme.spacing(4) },
  },
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiInputBase-root': { background: theme.palette.background.paper },
}));

// ───────────────────────────────── component ─────────────────────────────────
const AuthModal = ({ open, onClose, redirectAfterLogin = '/' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, successMessage } = useSelector((s) => s.auth);

  /** flow: phone  →  password (if registering)  →  profile */
  const [step, setStep] = useState('phone');
  const [isRegister, setIsRegister] = useState(false);

  // form fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // ui helpers
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [localMsg, setLocalMsg] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  // ─────────────────────────── validators ───────────────────────────
  const phoneOk = () => /^(0?9\d{9})$/.test(phone);

  const validatePhone = () => {
    if (!phoneOk()) {
      setFormErrors({ phone: 'شماره موبایل باید با 9 شروع شود و 10 رقم باشد' });
      return false;
    }
    setFormErrors({});
    return true;
  };

  const validatePassword = () => {
    const errs = {};
    if (!password || password.length < 6) errs.password = 'رمز عبور حداقل 6 کاراکتر';
    if (isRegister && password !== confirmPassword)
      errs.confirmPassword = 'رمز عبور و تکرار آن مطابقت ندارند';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateProfile = () => {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'نام الزامی است';
    if (!lastName.trim()) errs.lastName = 'نام خانوادگی الزامی است';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─────────────────────────── submit handlers ───────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validatePhone() || !password) {
      if (!password) setFormErrors((p) => ({ ...p, password: 'رمز عبور الزامی است' }));
      return;
    }
    setSubmitting(true);
    try {
      // Format phone number for backend (09xxxxxxxxx format)
      let backendPhone = phone.toString().replace(/\D/g, '');
      if (backendPhone.startsWith('98')) {
        backendPhone = backendPhone.substring(2);
      }
      if (!backendPhone.startsWith('0')) {
        backendPhone = '0' + backendPhone;
      }
      
      await dispatch(
        login({
          phone: backendPhone,
          password,
          sessionId: localStorage.getItem('sessionId'),
        }),
      ).unwrap();
      setLocalMsg('ورود با موفقیت انجام شد');
      setTimeout(() => {
        onClose?.();
        navigate(redirectAfterLogin, { replace: true });
      }, 1500);
    } catch (err) {
      setFormErrors({ general: err.message || 'خطا در ورود' });
    } finally {
      setSubmitting(false);
    }
  };

  const startRegister = () => {
    if (!validatePhone()) return;
    setIsRegister(true);
    setStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validatePassword()) return;
    setSubmitting(true);
    try {
      // Format phone number for backend (09xxxxxxxxx format)
      let backendPhone = phone.toString().replace(/\D/g, '');
      if (backendPhone.startsWith('98')) {
        backendPhone = backendPhone.substring(2);
      }
      if (!backendPhone.startsWith('0')) {
        backendPhone = '0' + backendPhone;
      }
      
      /* فرض: updateProfile({ phone, password }) کاربر تازه می‌سازد */
      await dispatch(
        updateProfile({ phone: backendPhone, password }),
      ).unwrap();
      setStep('profile');
    } catch (err) {
      setFormErrors({ general: err.message || 'خطا در ثبت رمز عبور' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validateProfile()) return;
    setSubmitting(true);
    try {
      await dispatch(updateProfile({ firstName, lastName })).unwrap();
      setLocalMsg('حساب کاربری با موفقیت ایجاد شد');
      setTimeout(() => {
        onClose?.();
        navigate(redirectAfterLogin, { replace: true });
      }, 1500);
    } catch (err) {
      setFormErrors({ general: err.message || 'خطا در بروزرسانی پروفایل' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setStep('phone');
    setIsRegister(false);
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setFormErrors({});
    setLocalMsg('');
  };

  // ─────────────────────────── render ───────────────────────────
  return (
    <StyledDialog open={open} onClose={() => { resetState(); onClose?.(); }} fullWidth maxWidth="sm">
      <DialogTitle sx={{ textAlign: 'center' }}>
        {step === 'phone' ? 'ورود / ثبت نام'
          : step === 'password' ? 'تنظیم رمز عبور'
          : 'تکمیل اطلاعات'}
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {(localMsg || successMessage) && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {localMsg || successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === 'object' ? error.message : error}
          </Alert>
        )}
        {formErrors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formErrors.general}
          </Alert>
        )}

        {/* ───────────── step: phone ───────────── */}
        {step === 'phone' && (
          <Box component="form" onSubmit={handleLogin} noValidate>
            <StyledTextField
              label="شماره موبایل"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ direction: 'rtl' }}
            />
            <StyledTextField
              label="رمز عبور"
              fullWidth
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)}>
                      {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ direction: 'rtl' }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{ width: '48%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'ورود'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                sx={{ width: '48%' }}
                disabled={isSubmitting || !phoneOk()}
                onClick={startRegister}
              >
                ثبت‌نام
              </Button>
            </Box>
          </Box>
        )}

        {/* ───────────── step: password ───────────── */}
        {step === 'password' && (
          <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              یک رمز عبور برای حساب جدید انتخاب کنید
            </Typography>
            <StyledTextField
              label="رمز عبور"
              fullWidth
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)}>
                      {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ direction: 'rtl' }}
            />

            <StyledTextField
              label="تکرار رمز عبور"
              fullWidth
              type={showConfirmPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPwd((p) => !p)}>
                      {showConfirmPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ direction: 'rtl' }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'ادامه'}
            </Button>
          </Box>
        )}

        {/* ───────────── step: profile ───────────── */}
        {step === 'profile' && (
          <Box component="form" onSubmit={handleProfileSubmit} noValidate>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              لطفاً اطلاعات زیر را تکمیل کنید
            </Typography>
            <StyledTextField
              label="نام"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              sx={{ direction: 'rtl' }}
            />
            <StyledTextField
              label="نام خانوادگی"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              sx={{ direction: 'rtl' }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'ذخیره و ورود'}
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={() => { resetState(); onClose?.(); }} variant="outlined">
          انصراف
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AuthModal;
