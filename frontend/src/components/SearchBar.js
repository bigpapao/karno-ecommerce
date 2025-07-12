import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  Typography,
  Chip,
  useTheme,
  alpha,
  Avatar,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Inventory as ProductIcon,
  Business as BrandIcon,
  Category as CategoryIcon,
  AutoAwesome as SmartIcon,

} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleSearch } from '../store/slices/uiSlice';
import { useSearch } from '../hooks/useSearch';

// Suggestion item icons mapping
const suggestionIcons = {
  product: ProductIcon,
  brand: BrandIcon,
  category: CategoryIcon,
  suggestion: SmartIcon,
  recent: HistoryIcon,
  popular: TrendingIcon,
};

// Enhanced suggestion item component
const SuggestionItem = ({ suggestion, isSelected, onClick, showImage = true }) => {
  const theme = useTheme();
  const IconComponent = suggestionIcons[suggestion.type] || SearchIcon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <ListItem
        button
        onClick={() => onClick(suggestion)}
        sx={{
          borderRadius: 2,
          mx: 1,
          mb: 0.5,
          background: isSelected 
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
          border: isSelected 
            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            : '1px solid transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {suggestion.image && showImage ? (
            <Avatar
              src={suggestion.image}
              sx={{ width: 32, height: 32 }}
            >
              <IconComponent sx={{ fontSize: 16 }} />
            </Avatar>
          ) : (
            <IconComponent 
              sx={{ 
                fontSize: 20,
                color: isSelected 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
              }} 
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSelected ? 600 : 400,
                color: isSelected 
                  ? theme.palette.primary.main 
                  : theme.palette.text.primary,
              }}
            >
              {suggestion.name}
            </Typography>
          }
          secondary={
            suggestion.subtitle && (
              <Typography
                variant="caption"
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                }}
              >
                {suggestion.subtitle}
              </Typography>
            )
          }
        />
        {suggestion.type === 'product' && (
          <Chip
            label="محصول"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </ListItem>
    </motion.div>
  );
};

// Loading skeleton for suggestions
const SuggestionSkeleton = () => (
  <Box sx={{ px: 2, py: 1 }}>
    {[...Array(3)].map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
    ))}
  </Box>
);

const SearchBar = ({ variant = 'default', placeholder = 'جستجو در محصولات...' }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  // Use the intelligent search hook
  const {
    query,
    combinedSuggestions,
    loading,
    isOpen,
    selectedIndex,
    hasError,
    setQuery,
    setIsOpen,
    performSearch,
    handleSuggestionSelect,
    handleKeyDown,
    clearSearch,
    clearRecentSearches,
    isSearching,
    hasQuery,
  } = useSearch({
    debounceDelay: 300,
    maxSuggestions: 8,
    enableAutoComplete: true,
    enableRecentSearches: true,
  });

  // Auto-focus for mobile variant
  useEffect(() => {
    if (variant === 'mobile' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [variant]);

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (query.trim()) {
      performSearch(query);
      setIsOpen(false);
      if (variant === 'mobile') {
        dispatch(toggleSearch());
      }
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setFocused(true);
    setIsOpen(true);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setFocused(false);
      setIsOpen(false);
    }, 200);
  };

  // Clear input
  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  // Different styles based on variant
  const getSearchBarStyles = () => {
    const baseStyles = {
      borderRadius: 3,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: 'relative',
    };

    switch (variant) {
      case 'hero':
        return {
          ...baseStyles,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: focused 
            ? '0 8px 32px rgba(0, 0, 0, 0.15)' 
            : '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: `2px solid ${focused ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.3)'}`,
          transform: focused ? 'translateY(-2px)' : 'translateY(0)',
        };
      case 'mobile':
        return {
          ...baseStyles,
          background: theme.palette.background.paper,
          border: `2px solid ${focused ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
        };
      default:
        return {
          ...baseStyles,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${focused ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
          boxShadow: focused 
            ? '0 8px 25px rgba(0, 0, 0, 0.15)' 
            : '0 2px 10px rgba(0, 0, 0, 0.1)',
        };
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative' }}
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={getSearchBarStyles()}
          elevation={0}
        >
          <TextField
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            error={hasError}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: 'none',
                borderRadius: 3,
                backgroundColor: 'transparent',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                color: variant === 'default' ? 'white' : theme.palette.text.primary,
                fontSize: '1rem',
                fontWeight: 400,
                py: 1.5,
                '&::placeholder': {
                  color: variant === 'default' 
                    ? 'rgba(255, 255, 255, 0.7)' 
                    : alpha(theme.palette.text.secondary, 0.7),
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <motion.div
                    animate={{ rotate: isSearching ? 360 : 0 }}
                    transition={{ 
                      duration: 1, 
                      repeat: isSearching ? Infinity : 0,
                      ease: 'linear'
                    }}
                  >
                    <SearchIcon
                      sx={{
                        color: variant === 'default' 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : theme.palette.primary.main,
                        transition: 'color 0.3s ease',
                      }}
                    />
                  </motion.div>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Stack direction="row" spacing={1}>
                    {/* Clear button */}
                    <AnimatePresence>
                      {hasQuery && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Tooltip title="پاک کردن">
                            <IconButton
                              onClick={handleClear}
                              size="small"
                              sx={{
                                color: variant === 'default' 
                                  ? 'rgba(255, 255, 255, 0.8)' 
                                  : theme.palette.text.secondary,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main,
                                },
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Stack>
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isOpen && (focused || hasQuery) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1300 }}
          >
            <Paper
              sx={{
                mt: 1,
                borderRadius: 3,
                maxHeight: 400,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backdropFilter: 'blur(20px)',
                background: alpha(theme.palette.background.paper, 0.95),
              }}
            >
              {loading ? (
                <SuggestionSkeleton />
              ) : combinedSuggestions.length > 0 ? (
                <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
                  {combinedSuggestions.map((group, groupIndex) => (
                    <Box key={groupIndex}>
                      {/* Group header */}
                      <Box sx={{ px: 2, py: 1, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {group.title}
                        </Typography>
                        {group.title === 'جستجوهای اخیر' && group.items.length > 0 && (
                          <Button
                            size="small"
                            onClick={clearRecentSearches}
                            sx={{ 
                              ml: 1, 
                              minWidth: 'auto',
                              color: theme.palette.text.secondary,
                              fontSize: '0.7rem',
                            }}
                          >
                            پاک کردن
                          </Button>
                        )}
                      </Box>

                      {/* Group items */}
                      <List dense sx={{ py: 1 }}>
                        {group.items.map((suggestion, index) => {
                          const globalIndex = combinedSuggestions
                            .slice(0, groupIndex)
                            .reduce((acc, g) => acc + g.items.length, 0) + index;
                          
                          return (
                            <SuggestionItem
                              key={suggestion.id}
                              suggestion={suggestion}
                              isSelected={globalIndex === selectedIndex}
                              onClick={handleSuggestionSelect}
                              showImage={suggestion.type === 'product'}
                            />
                          );
                        })}
                      </List>

                      {groupIndex < combinedSuggestions.length - 1 && (
                        <Divider sx={{ mx: 2 }} />
                      )}
                    </Box>
                  ))}

                  {/* Search action at bottom */}
                  {hasQuery && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2 }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={() => performSearch(query)}
                            sx={{
                              borderRadius: 2,
                              py: 1.5,
                              fontWeight: 600,
                              textTransform: 'none',
                              background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #0d47a1, #1976d2)',
                              },
                            }}
                          >
                            جستجو برای "{query}"
                          </Button>
                        </motion.div>
                      </Box>
                    </>
                  )}
                </Box>
              ) : hasQuery ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    نتیجه‌ای یافت نشد
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    لطفاً کلمات کلیدی دیگری امتحان کنید
                  </Typography>
                </Box>
              ) : null}

              {hasError && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    خطا در بارگیری پیشنهادات
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setQuery(query)}
                    sx={{ mt: 1 }}
                  >
                    تلاش مجدد
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SearchBar;
