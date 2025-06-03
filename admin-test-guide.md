# 🛠️ Karno Admin Panel Testing Guide

## 🔐 Authentication Status
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000  
- ✅ Successfully logged in as: `admin@karno.com`
- ✅ User role: `admin`

## 📋 Admin Pages to Test

### 1. **Dashboard** - `http://localhost:3000/admin`
**What to test:**
- [ ] Statistics cards display (orders, users, products, revenue)
- [ ] Recent orders list shows data
- [ ] Top products section
- [ ] Low stock alerts
- [ ] Refresh button functionality

**Expected behavior:**
- Should show overview statistics
- Recent orders with status badges
- Product performance metrics
- Stock level warnings

---

### 2. **Products Management** - `http://localhost:3000/admin/products`
**What to test:**
- [ ] Product list displays
- [ ] Search functionality
- [ ] Filter by category/brand
- [ ] Add new product button
- [ ] Edit existing product
- [ ] Delete product
- [ ] Bulk operations
- [ ] Image upload

**Expected behavior:**
- Paginated product list
- CRUD operations work
- Image uploads successful
- Filters apply correctly

---

### 3. **Orders Management** - `http://localhost:3000/admin/orders`
**What to test:**
- [ ] Orders list displays
- [ ] Order status filters
- [ ] Order details view
- [ ] Status update functionality
- [ ] Export orders
- [ ] Search by order number
- [ ] Date range filtering

**Expected behavior:**
- All orders visible
- Status changes save
- Order details complete
- Export functionality works

---

### 4. **Users Management** - `http://localhost:3000/admin/users`
**What to test:**
- [ ] Users list displays
- [ ] User search
- [ ] User details view
- [ ] Role management
- [ ] User status (active/inactive)
- [ ] User registration data

**Expected behavior:**
- Complete user information
- Role changes apply
- Search works correctly
- User activity tracking

---

### 5. **Categories** - `http://localhost:3000/admin/categories`
**What to test:**
- [ ] Categories list
- [ ] Add new category
- [ ] Edit category
- [ ] Delete category
- [ ] Category hierarchy
- [ ] Image upload for categories

**Expected behavior:**
- Tree structure for subcategories
- CRUD operations functional
- Images display correctly

---

### 6. **Brands** - `http://localhost:3000/admin/brands`
**What to test:**
- [ ] Brands list displays
- [ ] Add new brand
- [ ] Edit brand information
- [ ] Delete brand
- [ ] Brand logo upload
- [ ] Brand statistics

**Expected behavior:**
- All brands visible
- Logo uploads work
- Statistics accurate

---

### 7. **Settings** - `http://localhost:3000/admin/settings`
**What to test:**
- [ ] General settings
- [ ] Payment configuration
- [ ] Shipping settings
- [ ] Email templates
- [ ] System preferences
- [ ] Backup/restore options

**Expected behavior:**
- Settings save correctly
- Changes apply immediately
- Validation works

---

## 🚨 Common Issues & Solutions

### **Issue: Can't access admin pages**
**Solution:**
1. Check if you're logged in: `http://localhost:3000/profile`
2. Verify admin role in database
3. Clear browser cache/cookies
4. Re-login with admin credentials

### **Issue: Data not loading**
**Solution:**
1. Check browser console for errors
2. Verify backend API responses
3. Check network tab in developer tools
4. Ensure database connection is working

### **Issue: 401 Unauthorized errors**
**Solution:**
1. Check authentication middleware
2. Verify JWT token validity
3. Check user permissions
4. Re-authenticate if needed

---

## 🔧 Quick Test Commands

### Test API endpoints directly:
```bash
# Test admin dashboard stats
curl -X GET "http://localhost:5000/api/v1/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test admin products
curl -X GET "http://localhost:5000/api/v1/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test admin orders
curl -X GET "http://localhost:5000/api/v1/admin/orders" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Expected Admin Features

Based on your codebase, your admin panel should include:

- **Real-time Dashboard** with live statistics
- **Product Management** with inventory tracking
- **Order Processing** with status updates
- **User Management** with role-based access
- **Category & Brand Management**
- **Settings & Configuration**
- **Performance Monitoring**
- **Security Features**

---

## 🎯 Testing Checklist

- [ ] Login as admin successful
- [ ] Dashboard loads with data
- [ ] All menu items accessible
- [ ] CRUD operations work
- [ ] Search and filters functional
- [ ] File uploads working
- [ ] Data validation active
- [ ] Error handling proper
- [ ] Responsive design works
- [ ] Performance acceptable

---

## 📞 Next Steps

1. **Start with Dashboard**: Go to `http://localhost:3000/admin`
2. **Navigate through each section** using the sidebar menu
3. **Test core functionality** in each area
4. **Report any issues** you encounter
5. **Check browser console** for any JavaScript errors

Your admin system appears to be comprehensive and well-structured. The authentication is working, and all the necessary components are in place! 