import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Avatar,
  Grid,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Divider,
} from '@mui/material';
// Removed unused imports: formatDistanceToNow, useTranslation

const ReviewSection = ({ productId }) => {
  // Removed unused variables: t, theme
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0],
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [loading, setLoading] = useState(true);
  // Removed unused state variables: userReview, rating, comment, isSubmitting, error, success

  useEffect(() => {
    // TODO: Fetch reviews from API
    // For now, using mock data
    const mockReviews = [
      {
        id: 1,
        user: {
          name: 'John Doe',
          avatar: '/images/avatars/user1.jpg',
        },
        rating: 5,
        title: 'Great product!',
        comment: 'Excellent quality and fast shipping. Would definitely buy again.',
        date: new Date(2024, 4, 1),
        helpful: 12,
      },
      {
        id: 2,
        user: {
          name: 'Jane Smith',
          avatar: '/images/avatars/user2.jpg',
        },
        rating: 4,
        title: 'Good value for money',
        comment: 'The product works as expected. Installation was easy.',
        date: new Date(2024, 3, 15),
        helpful: 8,
      },
    ];

    setReviews(mockReviews);
    
    // Calculate stats
    const total = mockReviews.length;
    const average = mockReviews.reduce((acc, review) => acc + review.rating, 0) / total;
    const distribution = [0, 0, 0, 0, 0];
    mockReviews.forEach(review => {
      distribution[review.rating - 1]++;
    });

    setStats({ average, total, distribution });
    setLoading(false);
  }, [productId]);

  const handleDialogOpen = () => {
    if (!isAuthenticated) {
      // TODO: Redirect to login
      return;
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewReview({ rating: 5, title: '', comment: '' });
  };

  const handleSubmitReview = () => {
    // TODO: Submit review to API
    const review = {
      id: reviews.length + 1,
      user: {
        name: user.name,
        avatar: user.avatar,
      },
      ...newReview,
      date: new Date(),
      helpful: 0,
    };

    setReviews([review, ...reviews]);
    handleDialogClose();
  };

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Review Summary */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Overall Rating */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="div" gutterBottom>
              {stats.average.toFixed(1)}
            </Typography>
            <Rating value={stats.average} precision={0.1} readOnly size="large" />
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Based on {stats.total} reviews
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleDialogOpen}
            >
              Write a Review
            </Button>
          </Box>
        </Grid>

        {/* Rating Distribution */}
        <Grid item xs={12} md={8}>
          <Box>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Box
                key={rating}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography sx={{ minWidth: 40 }}>{rating}★</Typography>
                <Box sx={{ flexGrow: 1, mx: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.distribution[rating - 1] / stats.total) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography sx={{ minWidth: 40 }}>
                  {stats.distribution[rating - 1]}
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Review List */}
      <Box>
        {reviews.map((review) => (
          <Paper
            key={review.id}
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={review.user.avatar} alt={review.user.name} />
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle1">{review.user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(review.date, { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            
            <Rating value={review.rating} readOnly size="small" />
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 2 }}>
              {review.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.comment}
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Button size="small" color="inherit">
                Helpful ({review.helpful})
              </Button>
              <Button size="small" color="inherit">
                Report
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Write Review Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography component="legend" gutterBottom>
                Your Rating
              </Typography>
              <Rating
                value={newReview.rating}
                onChange={(event, value) => {
                  setNewReview({ ...newReview, rating: value });
                }}
                size="large"
              />
            </Box>
            
            <TextField
              label="Review Title"
              fullWidth
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Your Review"
              multiline
              rows={4}
              fullWidth
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={!newReview.title || !newReview.comment}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewSection;
