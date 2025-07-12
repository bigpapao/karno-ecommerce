import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Fade,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';

const EnhancedSearchBar = ({ onClose, fullWidth = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches] = useState([
    'لنت ترمز پراید',
    'چراغ جلو دنا',
    'فیلتر روغن ساینا',
    'لاستیک 185/60R14',
    'ضربه گیر پژو',
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const anchorRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (debouncedSearchTerm.length > 1) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);

  const fetchSuggestions = async (term) => {
    try {
      // Simulate API call for suggestions
      // In real implementation, replace with actual API call
      const mockSuggestions = [
        `${term} پراید`,
        `${term} پژو`,
        `${term} دنا`,
        `${term} ساینا`,
        `${term} تیبا`,
      ].filter((item, index) => index < 5);
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = (term = searchTerm) => {
    if (!term.trim()) return;

    // Add to recent searches
    const updatedRecent = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    // Navigate to search results
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
    onClose && onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const removeRecentSearch = (searchToRemove) => {
    const updated = recentSearches.filter(item => item !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        ref={anchorRef}
        fullWidth
        placeholder="جستجو در محصولات..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setShowSuggestions(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: 'background.paper',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
          },
        }}
      />

      <Popper
        open={showSuggestions}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ width: anchorRef.current?.offsetWidth || 'auto', zIndex: 1400 }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{
                mt: 1,
                borderRadius: 2,
                overflow: 'hidden',
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
                <List sx={{ py: 0 }}>
                  {/* Search Suggestions */}
                  {suggestions.length > 0 && (
                    <>
                      {suggestions.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleSearch(suggestion)}
                          sx={{
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <SearchIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={suggestion}
                            sx={{ '& .MuiTypography-root': { direction: 'rtl' } }}
                          />
                        </ListItem>
                      ))}
                      <Divider />
                    </>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && searchTerm.length === 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          جستجوهای اخیر
                        </Typography>
                        <IconButton size="small" onClick={clearRecentSearches}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {recentSearches.map((search, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleSearch(search)}
                          sx={{
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <HistoryIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={search}
                            sx={{ '& .MuiTypography-root': { direction: 'rtl' } }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(search);
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                      <Divider />
                    </>
                  )}

                  {/* Trending Searches */}
                  {searchTerm.length === 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          جستجوهای محبوب
                        </Typography>
                      </Box>
                      <Box sx={{ px: 2, pb: 2, direction: 'rtl' }}>
                        {trendingSearches.map((trending, index) => (
                          <Chip
                            key={index}
                            label={trending}
                            size="small"
                            onClick={() => handleSearch(trending)}
                            icon={<TrendingIcon />}
                            sx={{
                              m: 0.5,
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </List>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default EnhancedSearchBar; 