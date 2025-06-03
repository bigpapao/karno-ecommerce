# Car Selector Implementation Guide

## Overview
This implementation provides a multi-step car selector that helps users find spare parts specific to their car models. The selector integrates seamlessly with your existing model pages and product filtering system.

## Features Implemented

### 🚗 CarSelector Component (`/src/components/CarSelector.js`)
- **Two-step selection process**: First manufacturer, then model
- **Mobile-responsive design**: Works on both desktop and mobile
- **localStorage persistence**: Remembers user's selected car
- **Two display variants**: 
  - Compact view (shows selected car)
  - Selector button (when no car is selected)
- **Smooth animations**: Fade transitions and hover effects

### 🔗 Integration with Existing Pages
- **Products page integration**: CarSelector appears at the top of `/products` page
- **Model page redirection**: Selecting a model redirects to existing model detail pages
- **URL-friendly format**: Uses slugs like `pride_111`, `peugeot_206` etc.

### 📊 Shared Data Structure (`/src/utils/carModelsData.js`)
- **Centralized car data**: Single source of truth for all car models
- **Consistent structure**: Works with both CarSelector and existing Models page
- **Backward compatibility**: Includes both string IDs and numeric IDs

## How It Works

### User Flow
1. **User visits Products page** (`/products`)
2. **Sees car selector** at the top (if no car selected) or compact view (if car selected)
3. **Clicks to open modal** with manufacturer selection
4. **Selects manufacturer** (SAIPA or Iran Khodro)
5. **Selects specific model** (e.g., Pride 111, Peugeot 206)
6. **Gets redirected** to model detail page (`/models/pride_111`)
7. **Selection is saved** in localStorage for future visits

### URL Structure
- Pride 111: `http://localhost:3000/models/pride_111`
- Pride 131: `http://localhost:3000/models/pride_131`
- Peugeot 206: `http://localhost:3000/models/peugeot_206`
- Tiba: `http://localhost:3000/models/tiba`
- And so on...

## Technical Implementation

### Data Structure
```javascript
{
  id: 'pride_111',           // URL-friendly slug
  numericId: 1,              // For backward compatibility
  name: 'پراید 111',          // Persian name
  nameEn: 'Pride 111',       // English name
  brand: 'سایپا',            // Manufacturer
  popular: true,             // Show star indicator
  // ... other model details
}
```

### localStorage Schema
```javascript
{
  manufacturer: { id: 'saipa', name: 'سایپا', ... },
  model: { id: 'pride_111', name: 'پراید 111', ... },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Available Car Models

### SAIPA (سایپا)
- Pride 111 (`pride_111`)
- Pride 131 (`pride_131`)
- Tiba (`tiba`)
- Quick (`quick`)
- Shahin (`shahin`)

### Iran Khodro (ایران خودرو)
- Peugeot 206 (`peugeot_206`)
- Peugeot Pars (`peugeot_pars`)
- Samand LX (`samand_lx`)
- Dena (`dena`)
- Runna (`runna`)

## Usage Examples

### Basic Integration
```jsx
import CarSelector from '../components/CarSelector';

// In your component
<CarSelector variant="compact" />
```

### With Callback
```jsx
<CarSelector 
  variant="compact" 
  onSelectionChange={(selection) => {
    console.log('User selected:', selection);
  }}
/>
```

## Styling & Theming
- Uses Material-UI components and theme
- Consistent with existing site design
- Blue gradient backgrounds matching your brand
- Persian/RTL text support
- Responsive breakpoints

## Future Enhancements

### Easy to Add More Models
To add more models, simply update `/src/utils/carModelsData.js`:

```javascript
{
  id: 'new_model_slug',
  numericId: 11,
  name: 'نام جدید',
  nameEn: 'New Model',
  brand: 'سایپا',
  // ... other details
}
```

### Product Filtering Integration
The CarSelector can easily be extended to filter products by selected model:

```javascript
// In your products API call
const selectedCar = JSON.parse(localStorage.getItem('selectedCarModel'));
if (selectedCar) {
  // Filter products for this model
  apiCall({ model: selectedCar.model.id });
}
```

## Files Modified/Created

### New Files
- `/src/components/CarSelector.js` - Main car selector component
- `/src/utils/carModelsData.js` - Shared car models data
- `CAR_SELECTOR_IMPLEMENTATION_GUIDE.md` - This guide

### Modified Files
- `/src/pages/Products.js` - Added CarSelector integration

## Testing the Implementation

1. **Visit Products page**: Go to `http://localhost:3000/products`
2. **See the selector**: Should see car selection interface at top
3. **Select a car**: Choose SAIPA → Pride 111
4. **Verify redirect**: Should go to `http://localhost:3000/models/pride_111`
5. **Check persistence**: Refresh and visit products again - should see compact view
6. **Test reset**: Click the X button to reset selection

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes

This implementation provides a solid foundation that can be easily extended as your car models and product catalog grows! 