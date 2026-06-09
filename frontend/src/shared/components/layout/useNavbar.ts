import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/shared/lib/api';
import { useSettings } from '@/shared/hooks/SettingsContext';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import type { UserDetails } from './navbarTypes';

export const useNavbar = () => {
  const location = useLocation();
  const { settings, updateSetting, saveSettingsToDb, playSfx } = useSettings();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showAgeModal, setShowAgeModal] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [ageModalError, setAgeModalError] = useState('');
  const [submittingAge, setSubmittingAge] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const checkGameState = () => {
      setIsGameActive(localStorage.getItem('isGameActive') === 'true');
    };
    checkGameState();
    window.addEventListener('game_state_changed', checkGameState);
    return () => window.removeEventListener('game_state_changed', checkGameState);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsDrawerOpen(false);
    }, 0);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && !sessionStorage.getItem('enbido_age_checked')) {
      api.get('/usuarios/me')
        .then(res => {
          setCurrentUserDetails(res.data);
          if (!res.data.birthDate) {
            setShowAgeModal(true);
          } else {
            sessionStorage.setItem('enbido_age_checked', 'true');
          }
        })
        .catch(err => {
          console.error('Error checking user age on login:', err);
        });
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isDrawerOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleToggleDrawer = useCallback(() => {
    playSfx('click');
    setIsDrawerOpen((prev) => !prev);
  }, [playSfx]);

  const handleCloseDrawer = useCallback(() => {
    playSfx('click');
    setIsDrawerOpen(false);
  }, [playSfx]);

  const handleCloseSettings = useCallback(() => {
    playSfx('click');
    setShowSettingsModal(false);
  }, [playSfx]);

  const handleSaveSettings = useCallback(async () => {
    playSfx('click');
    await saveSettingsToDb();
    setShowSettingsModal(false);
  }, [playSfx, saveSettingsToDb]);

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDateInput) {
      setAgeModalError('login.requiredField');
      return;
    }

    const birthDate = new Date(birthDateInput);
    const today = new Date();
    if (birthDate >= today) {
      setAgeModalError('login.invalidBirthDate');
      return;
    }

    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 3);
    if (birthDate > minDate) {
      setAgeModalError('login.invalidBirthDate');
      return;
    }

    setSubmittingAge(true);
    setAgeModalError('');

    try {
      await api.put('/usuarios/me', {
        name: currentUserDetails?.name || '',
        surname: currentUserDetails?.surname || '',
        phoneNumber: currentUserDetails?.phoneNumber || '',
        postalCode: currentUserDetails?.postalCode || '',
        birthDate: birthDateInput
      });

      sessionStorage.setItem('enbido_age_checked', 'true');
      setShowAgeModal(false);
      window.dispatchEvent(new Event('enbido_login'));
    } catch (err) {
      console.error('Error setting age:', err);
      setAgeModalError('account.updateError');
    } finally {
      setSubmittingAge(false);
    }
  };

  return {
    location,
    settings,
    updateSetting,
    playSfx,
    user,
    isAuthenticated,
    isAdmin,
    showSettingsModal,
    setShowSettingsModal,
    isDrawerOpen,
    setIsDrawerOpen,
    isGameActive,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    showAgeModal,
    setShowAgeModal,
    birthDateInput,
    setBirthDateInput,
    ageModalError,
    setAgeModalError,
    submittingAge,
    setSubmittingAge,
    currentUserDetails,
    setCurrentUserDetails,
    handleLogout,
    handleToggleDrawer,
    handleCloseDrawer,
    handleCloseSettings,
    handleSaveSettings,
    handleAgeSubmit,
  };
};
