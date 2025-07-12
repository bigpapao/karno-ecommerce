# PremiumCategoryCards Component

A modern, responsive, and beautifully designed React component for displaying automotive part categories with premium e-commerce aesthetics inspired by Amazon, Apple, and other leading platforms.

## Features

### 🎨 Design Features
- **Modern Card Design**: Clean, minimalist cards with subtle shadows and rounded corners
- **Responsive Grid Layout**: 3 columns on desktop, 1-2 columns on mobile/tablet
- **Premium Animations**: Smooth hover effects with 3D transforms and color transitions
- **Professional Color Palette**: Carefully chosen colors that work across different themes
- **Gradient Accents**: Beautiful gradient backgrounds and hover effects

### 🚗 Automotive-Specific Features
- **Custom Icons**: SVG icons specifically designed for automotive categories
- **Persian/Farsi RTL Support**: Full right-to-left layout support
- **Category Mapping**: Intelligent icon selection based on category names
- **Product Count Display**: Shows available products in each category

### ⚡ Performance Features
- **Lazy Loading**: Optimized data fetching with proper loading states
- **Smooth Animations**: Hardware-accelerated CSS transforms
- **Responsive Images**: Proper image loading with fade-in effects
- **Error Handling**: Graceful error states and fallbacks

## Installation & Usage

### Basic Usage

```jsx
import PremiumCategoryCards from '../components/PremiumCategoryCards';

// Default usage (recommended for homepage)
<PremiumCategoryCards />

// Custom configuration
<PremiumCategoryCards 
  maxCategories={6} 
  showTitle={true} 
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxCategories` | number | 12 | Maximum number of categories to display |
| `showTitle` | boolean | true | Whether to show the main component title |

### Usage Examples

#### 1. Homepage Hero Section
```jsx
// Full-featured display with title
<PremiumCategoryCards maxCategories={6} showTitle={true} />
```

#### 2. Category Page Section
```jsx
// Without title for embedding in other pages
<PremiumCategoryCards maxCategories={9} showTitle={false} />
```

#### 3. Sidebar Widget
```jsx
// Compact version for sidebars
<PremiumCategoryCards maxCategories={3} showTitle={false} />
```

## Category Icon Mapping

The component automatically selects appropriate icons based on category names (supports both Persian and English):

| Category Keywords | Icon | Description |
|-------------------|------|-------------|
| موتور, engine | Engine | Detailed engine block icon |
| ترمز, brake | Brake Disc | Circular brake disc design |
| تعلیق, suspension, جلوبندی | Suspension | Spring and damper system |
| برق, electrical, الکترونیک | Lightning | Electric system symbol |
| سوخت, fuel | Fuel Pump | Fuel system components |
| خنک, cooling, رادیاتور | Cooling | Radiator cooling system |
| بدنه, body, کاروسری | Car Body | Vehicle body outline |
| گیربکس, transmission, کلاچ | Gear | Gear and transmission |
| مصرفی, consumable, روغن, فیلتر | Oil Bottle | Maintenance items |
| جانبی, accessory, لوازم | Accessories | Optional parts |

## Styling & Customization

### Grid Breakpoints
```css
/* Mobile First Responsive Design */
xs: 12,    /* 1 column on extra small screens */
sm: 6,     /* 2 columns on small screens */
md: 4,     /* 3 columns on medium+ screens */
lg: 4      /* 3 columns on large screens */
```

### Color Scheme
```css
/* Primary Colors */
Primary Blue: #1976d2
Secondary Blue: #42a5f5
Background: #f8fafc
Card Background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)

/* Hover Effects */
Hover Shadow: 0 20px 40px rgba(0,0,0,0.15)
Icon Background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)
```

### Animation Timing
```css
/* Smooth Transitions */
Card Transform: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Icon Scale: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Button Slide: transform 0.3s ease
```

## Component Structure

```
PremiumCategoryCards/
├── CategoryIcon (Inline Component)
├── CategoryCardSkeleton (Loading State)
├── Grid Container
│   ├── Header Section (Optional)
│   ├── Cards Grid
│   │   ├── Card
│   │   │   ├── Hover Overlay
│   │   │   ├── Featured Badge
│   │   │   ├── Icon Section
│   │   │   ├── Content Section
│   │   │   └── Action Button
│   │   └── ...
│   └── View All Button
```

## API Integration

### Required API Endpoints
The component expects categories to be available via:
```javascript
categoryAPI.getCategories({
  featured: true,
  limit: maxCategories,
  parentOnly: true
})
```

### Expected Data Structure
```javascript
{
  data: {
    status: 'success',
    data: [
      {
        _id: 'category-id',
        name: 'قطعات موتوری',
        slug: 'engine-parts',
        description: 'قطعات مربوط به موتور خودرو',
        featured: true,
        productCount: 45,
        image: {
          url: '/images/categories/engine.jpg',
          alt: 'قطعات موتوری'
        }
      }
    ]
  }
}
```

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant color ratios
- **Alternative Text**: Proper alt text for images and icons

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**: CSS Grid, Flexbox, CSS Custom Properties, SVG

## Performance Considerations

### Optimization Features
- **Image Lazy Loading**: Images load only when visible
- **Component Splitting**: Separate loading states
- **Memoization**: Optimized re-renders
- **Intersection Observer**: Efficient scroll tracking

### Bundle Size
- **Component Size**: ~8KB gzipped
- **Dependencies**: Material-UI components only
- **Icons**: Inline SVG (no external icon library)

## Troubleshooting

### Common Issues

1. **Categories Not Loading**
   ```javascript
   // Check API endpoint is correct
   console.log('API Response:', response.data);
   
   // Verify data structure
   if (!response.data?.status === 'success') {
     // Handle API error
   }
   ```

2. **Icons Not Displaying**
   ```javascript
   // Ensure category names match icon mapping
   const categoryName = category.name?.toLowerCase() || '';
   console.log('Category for icon mapping:', categoryName);
   ```

3. **Layout Issues**
   ```javascript
   // Check Material-UI theme setup
   import { useTheme } from '@mui/material/styles';
   const theme = useTheme();
   console.log('Theme breakpoints:', theme.breakpoints);
   ```

### Debug Mode
```jsx
// Add debug props for development
<PremiumCategoryCards 
  maxCategories={6} 
  showTitle={true}
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Future Enhancements

### Planned Features
- [ ] Category image optimization
- [ ] Advanced filtering options
- [ ] Custom animation preferences
- [ ] Theme customization props
- [ ] Analytics integration
- [ ] A/B testing support

### Customization Options
- [ ] Custom icon upload
- [ ] Color scheme variants
- [ ] Layout template options
- [ ] Animation disable option

## Contributing

When contributing to this component:

1. **Follow Design System**: Maintain consistency with Material-UI theme
2. **Test Responsiveness**: Verify on all breakpoints
3. **Accessibility**: Test with screen readers
4. **Performance**: Check loading times and animations
5. **RTL Support**: Verify Persian/Arabic layout support

## License

This component is part of the Karno project and follows the project's licensing terms. 