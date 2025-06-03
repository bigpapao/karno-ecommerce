# User System Testing Checklist
## Comprehensive Manual Testing Guide

### 📋 **Pre-Testing Setup**
- [ ] Ensure development server is running (`npm run dev`)
- [ ] Backend API is accessible and running
- [ ] Database is connected and accessible
- [ ] Clear browser cache and localStorage
- [ ] Test in both desktop and mobile viewports

---

## 🔐 **Authentication Flow Testing**

### **1. User Registration**
- [ ] **Navigate to registration page**
  - Go to `/register` 
  - Check if form loads correctly
  
- [ ] **Test email registration**
  - Enter valid email, name, and password
  - Submit form and verify success
  - Check if user is automatically logged in
  - Verify redirect to homepage or profile
  
- [ ] **Test phone registration**
  - Enter valid Iranian phone number (09XXXXXXXXX format)
  - Enter name and password
  - Submit and verify OTP modal appears
  - Enter valid OTP code and verify completion
  
- [ ] **Validation testing**
  - [ ] Test empty fields (should show validation errors)
  - [ ] Test invalid email format
  - [ ] Test invalid phone format
  - [ ] Test weak password (less than 6 characters)
  - [ ] Test duplicate email/phone registration

### **2. User Login**
- [ ] **Email login**
  - Navigate to `/login`
  - Enter valid email and password
  - Check "Remember Me" option
  - Submit and verify successful login
  - Verify user data appears in profile
  
- [ ] **Phone login**
  - Use phone number for login
  - Enter password
  - Submit and verify login
  
- [ ] **Login validation**
  - [ ] Test empty credentials
  - [ ] Test invalid email format
  - [ ] Test wrong password
  - [ ] Test non-existent user
  - [ ] Verify error messages are user-friendly
  
- [ ] **Remember Me functionality**
  - Login with "Remember Me" checked
  - Close browser and reopen
  - Verify user stays logged in

### **3. Phone Verification**
- [ ] **OTP Request**
  - Click "Verify Phone" in profile
  - Check if OTP modal opens
  - Verify phone number display is correct
  - Check if countdown timer starts
  
- [ ] **OTP Input**
  - [ ] Test auto-focus on first input
  - [ ] Test auto-advance to next input
  - [ ] Test backspace navigation
  - [ ] Test paste functionality (multiple digits)
  
- [ ] **OTP Verification**
  - [ ] Enter correct OTP and verify success
  - [ ] Enter incorrect OTP and check error handling
  - [ ] Test OTP expiration
  - [ ] Test resend functionality after countdown

---

## 👤 **Profile Management Testing**

### **4. Profile Display**
- [ ] **Navigate to profile page**
  - Go to `/profile` while logged in
  - Verify all user information displays correctly:
    - [ ] First Name
    - [ ] Last Name  
    - [ ] Email
    - [ ] Phone Number
    - [ ] Address
    - [ ] City
    - [ ] Province
    - [ ] Postal Code
  
- [ ] **Profile completion banner**
  - Check if banner shows when profile is incomplete
  - Verify it lists missing required fields
  - Check if banner disappears when profile is complete
  
- [ ] **Phone verification status**
  - Check if unverified phone shows verification button
  - Verify verified phone shows verified status
  - Test verification button functionality

### **5. Profile Editing**
- [ ] **Navigate to edit profile**
  - Click "Edit Profile" button or go to `/profile/edit`
  - Verify form pre-populates with current data
  
- [ ] **Form validation**
  - [ ] Test required fields (name, email, address, etc.)
  - [ ] Test email format validation
  - [ ] Test phone number format (Iranian mobile)
  - [ ] Test postal code format (10 digits)
  - [ ] Verify validation messages appear correctly
  
- [ ] **Profile update**
  - [ ] Change first name and save
  - [ ] Change address information and save
  - [ ] Update phone number (should reset verification)
  - [ ] Verify success messages appear
  - [ ] Check if changes persist after page refresh
  
- [ ] **Error handling**
  - [ ] Test server errors during update
  - [ ] Test network connectivity issues
  - [ ] Verify proper error messages display

### **6. Profile Status & Completion**
- [ ] **Profile completion tracking**
  - Start with incomplete profile
  - Add required fields one by one
  - Verify completion percentage updates
  - Check when profile becomes "complete"
  
- [ ] **Mobile verification tracking**
  - Test with unverified phone
  - Complete phone verification
  - Verify status updates immediately
  
- [ ] **Checkout restrictions**
  - Try to access checkout with incomplete profile
  - Verify proper warnings/redirects
  - Complete profile and retry checkout access

---

## 🛡️ **Authorization & Security Testing**

### **7. Protected Routes**
- [ ] **Unauthenticated access**
  - Logout if logged in
  - Try to access these URLs directly:
    - `/profile` - should redirect to login
    - `/profile/edit` - should redirect to login  
    - `/orders` - should redirect to login
    - `/addresses` - should redirect to login
    - `/checkout` - should redirect to login
  
- [ ] **Login redirect**
  - Access protected route while logged out
  - Complete login process
  - Verify redirect back to original intended page
  
- [ ] **Admin route protection**
  - Try to access `/admin` as regular user
  - Verify proper access denial or redirect
  - Test with admin user if available

### **8. Session Management**
- [ ] **Token expiration**
  - Login and wait for token expiration (if short-lived)
  - Try to access protected resources
  - Verify proper handling of expired tokens
  
- [ ] **Logout functionality**
  - Click logout button/link
  - Verify redirect to homepage or login
  - Try to access protected routes after logout
  - Check if tokens are properly cleared
  
- [ ] **Multiple tab behavior**
  - Login in one tab
  - Open protected route in new tab
  - Verify consistent authentication state
  - Logout in one tab and check other tab

---

## 🔄 **User Flow Integration Testing**

### **9. Complete User Journey**
- [ ] **New user registration to purchase**
  1. Register new account
  2. Verify email/phone if required
  3. Complete profile information
  4. Add items to cart
  5. Proceed to checkout
  6. Verify all steps work seamlessly
  
- [ ] **Returning user experience**
  1. Login with existing account
  2. Access profile and verify data
  3. Update profile information
  4. Access order history (if implemented)
  5. Test all connected features
  
- [ ] **Guest to user conversion**
  1. Add items to cart as guest
  2. Proceed to checkout
  3. Create account during checkout
  4. Verify cart items are preserved
  5. Complete profile and order

### **10. Navigation & UI Consistency**
- [ ] **Header navigation**
  - Check profile icon when logged out (should go to login)
  - Check profile icon when logged in (should go to profile)
  - Verify user menu functionality if present
  
- [ ] **Mobile navigation**
  - Test on mobile viewport
  - Check mobile menu functionality
  - Verify profile access on mobile
  
- [ ] **Breadcrumbs & back navigation**
  - Use browser back button on profile pages
  - Check if navigation state is preserved
  - Test breadcrumb functionality if present

---

## 📱 **Responsive Design Testing**

### **11. Mobile Device Testing**
- [ ] **Profile page on mobile**
  - Verify layout adapts properly
  - Check form usability on small screens
  - Test input field focus and keyboard behavior
  
- [ ] **Authentication on mobile**
  - Test login form on mobile
  - Test registration form on mobile
  - Verify OTP input works well on mobile
  
- [ ] **Touch interactions**
  - Test button touch targets are adequate
  - Check swipe gestures if implemented
  - Verify mobile-specific UI elements

### **12. Browser Compatibility**
- [ ] **Cross-browser testing**
  - Test on Chrome
  - Test on Firefox
  - Test on Safari (if available)
  - Test on Edge
  
- [ ] **Feature consistency**
  - Verify authentication works in all browsers
  - Check localStorage/cookie behavior
  - Test form validation across browsers

---

## 🐛 **Error Scenarios & Edge Cases**

### **13. Network & Server Error Testing**
- [ ] **Network connectivity**
  - Disconnect internet during profile update
  - Verify proper error handling
  - Test retry mechanisms if implemented
  
- [ ] **Server errors**
  - Test with backend temporarily down
  - Verify graceful error messages
  - Check if user can retry operations
  
- [ ] **Rate limiting**
  - Test OTP request rate limiting
  - Test login attempt rate limiting
  - Verify proper feedback to user

### **14. Data Validation & Edge Cases**
- [ ] **Special characters**
  - Test names with special characters
  - Test addresses with various formats
  - Verify Unicode character support
  
- [ ] **Very long inputs**
  - Test with extremely long names
  - Test with very long addresses
  - Verify proper truncation or validation
  
- [ ] **Boundary conditions**
  - Test minimum/maximum field lengths
  - Test edge cases for phone numbers
  - Test postal code validation thoroughly

---

## ✅ **Success Criteria Checklist**

### **Critical Functionality (Must Pass)**
- [ ] Users can register successfully
- [ ] Users can login with correct credentials  
- [ ] Profile information displays correctly after login
- [ ] Users can update their profile information
- [ ] Protected routes properly restrict access
- [ ] Phone verification works end-to-end
- [ ] Profile completion tracking functions

### **Important Functionality (Should Pass)**
- [ ] Proper error handling for invalid inputs
- [ ] Mobile responsive design works well
- [ ] Remember me functionality works
- [ ] Navigation between user pages is smooth
- [ ] Loading states provide good user feedback
- [ ] Form validation provides clear guidance

### **Nice-to-Have Functionality (Could Pass)**
- [ ] Optimistic updates for better UX
- [ ] Advanced error recovery mechanisms
- [ ] Detailed profile completion guidance
- [ ] Enhanced mobile interactions
- [ ] Cross-browser consistency

---

## 📊 **Testing Results Template**

```
### Test Execution Results
Date: ___________
Tester: ___________
Environment: ___________

#### Critical Issues Found:
1. 
2. 
3. 

#### Minor Issues Found:
1. 
2. 
3. 

#### Suggestions for Improvement:
1. 
2. 
3. 

#### Overall Assessment:
- Functionality Score: ___/10
- User Experience Score: ___/10  
- Security Score: ___/10
- Mobile Experience Score: ___/10

#### Ready for Production: [ ] Yes [ ] No
#### Reason (if No): 
```

---

## 🎯 **Post-Testing Recommendations**

After completing this checklist:

1. **Document all issues found** with steps to reproduce
2. **Prioritize fixes** based on user impact and frequency
3. **Test fixes thoroughly** before marking as resolved
4. **Consider automated testing** for critical user flows
5. **Plan regular regression testing** for future updates

This comprehensive testing approach will ensure your user system functions reliably and provides an excellent user experience across all scenarios. 