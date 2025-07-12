import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { calculateCartTotals } from '../../utils/cartUtils';
import { cartService } from '../../services/cart.service';

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (auth.isAuthenticated) {
        // Fetch cart from server for authenticated users
        const response = await cartService.getCart();
        return response.data.items || [];
      } else {
        // Load cart from localStorage for guest users
        const guestCart = localStorage.getItem('cart');
        return guestCart ? JSON.parse(guestCart) : [];
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (item, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      
      if (auth.isAuthenticated) {
        // Add to server cart for authenticated users
        const response = await cartService.addItem(item);
        return response.data.items || [];
      } else {
        // Add to localStorage for guest users
        const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = guestCart.findIndex(cartItem => cartItem.productId === item.productId);
        
        if (existingItemIndex >= 0) {
          guestCart[existingItemIndex].quantity += item.quantity || 1;
        } else {
          guestCart.push({
            productId: item.productId,
            quantity: item.quantity || 1,
            ...item
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(guestCart));
        return guestCart;
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      if (auth.isAuthenticated) {
        // Update server cart for authenticated users
        const response = await cartService.updateQuantity(productId, quantity);
        return response.data.items || [];
      } else {
        // Update localStorage for guest users
        const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const itemIndex = guestCart.findIndex(item => item.productId === productId);
        
        if (itemIndex >= 0) {
          if (quantity <= 0) {
            guestCart.splice(itemIndex, 1);
          } else {
            guestCart[itemIndex].quantity = quantity;
          }
        }
        
        localStorage.setItem('cart', JSON.stringify(guestCart));
        return guestCart;
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      if (auth.isAuthenticated) {
        // Remove from server cart for authenticated users
        const response = await cartService.removeItem(productId);
        return response.data.items || [];
      } else {
        // Remove from localStorage for guest users
        const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = guestCart.filter(item => item.productId !== productId);
        
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return updatedCart;
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      if (auth.isAuthenticated) {
        // Clear server cart for authenticated users
        await cartService.clearCart();
        return [];
      } else {
        // Clear localStorage for guest users
        localStorage.removeItem('cart');
        return [];
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Initial state for the cart
const initialState = {
  items: [],
  total: 0,
  quantity: 0,
  lastUpdated: null,
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Initialize cart from storage (for app startup)
    initializeCart: (state, action) => {
      const savedCart = action.payload;
      if (savedCart && Array.isArray(savedCart)) {
        state.items = savedCart;
        const totals = calculateCartTotals(savedCart);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      }
    },

    // Sync cart after login (merge guest cart with user cart)
    syncCartAfterLogin: (state, action) => {
      const serverCart = action.payload;
      if (serverCart && Array.isArray(serverCart)) {
        state.items = serverCart;
        const totals = calculateCartTotals(serverCart);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      }
    },

    // Clear cart error
    clearCartError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        const totals = calculateCartTotals(state.items);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add to Cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        const totals = calculateCartTotals(state.items);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Quantity
    builder
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        const totals = calculateCartTotals(state.items);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        const totals = calculateCartTotals(state.items);
        state.total = totals.total;
        state.quantity = totals.quantity;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Clear Cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.total = 0;
        state.quantity = 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  initializeCart,
  syncCartAfterLogin,
  clearCartError
} = cartSlice.actions;

// Export selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartQuantity = (state) => state.cart.quantity;
export const selectCartLastUpdated = (state) => state.cart.lastUpdated;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

// Export reducer
export default cartSlice.reducer;
