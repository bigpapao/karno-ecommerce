# User Model Address Storage Cleanup Guide

This guide outlines the steps to consolidate the redundant address storage approaches in the User model of the Karno e-commerce platform.

## Problem

The User model currently contains two different approaches for storing address information:

1. **Flat fields approach**: Individual fields for address, city, province, and postalCode
2. **Structured approach**: An `address` object with nested fields and an `addresses` array for multiple addresses

This duplication creates confusion, potential data inconsistencies, and maintenance challenges.

## Solution

Consolidate to a single approach for storing address information. Based on the current usage in the application, we recommend:

### Option 1: Keep the Structured Approach (Recommended)

The structured approach with the `addresses` array allows for multiple addresses per user, which provides more flexibility for future features like multiple shipping addresses.

## Implementation Steps

### 1. Update the User Model

Modify `src/models/user.model.js`:

```javascript
// BEFORE:
const userSchema = new mongoose.Schema(
  {
    // ... other fields
    
    // Flat address fields
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    province: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    
    // Legacy single address field
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    
    // Array of addresses
    addresses: [addressSchema],
    
    // ... other fields
  }
);

// AFTER:
const userSchema = new mongoose.Schema(
  {
    // ... other fields
    
    // Only keep the addresses array for multiple addresses
    addresses: [addressSchema],
    
    // Add a defaultAddressId to track the default address
    defaultAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'addresses',
    },
    
    // ... other fields
  }
);
```

### 2. Update the Virtual Method for Profile Completion

```javascript
// BEFORE:
userSchema.virtual('isProfileComplete').get(function() {
  return !!(
    this.firstName && 
    this.lastName && 
    this.address && 
    this.city && 
    this.province && 
    this.postalCode && 
    this.phone
  );
});

// AFTER:
userSchema.virtual('isProfileComplete').get(function() {
  // Ensure there's at least one address and it has required fields
  const hasCompleteAddress = this.addresses && this.addresses.length > 0 && 
    this.addresses.some(addr => 
      addr.fullName && addr.phoneNumber && addr.address && 
      addr.city && addr.state && addr.zipCode && addr.country
    );
  
  return !!(
    this.firstName && 
    this.lastName && 
    this.phone &&
    hasCompleteAddress
  );
});
```

### 3. Update Helper Methods

```javascript
// Update the getIncompleteFields function in user.controller.js
const getIncompleteFields = (user) => {
  const missingFields = [];
  
  if (!user.firstName) missingFields.push('firstName');
  if (!user.lastName) missingFields.push('lastName');
  if (!user.phone) missingFields.push('phone');
  if (!user.mobileVerified) missingFields.push('mobileVerification');
  
  // Check address information
  const hasCompleteAddress = user.addresses && user.addresses.length > 0 && 
    user.addresses.some(addr => 
      addr.fullName && addr.phoneNumber && addr.address && 
      addr.city && addr.state && addr.zipCode && addr.country
    );
  
  if (!hasCompleteAddress) {
    missingFields.push('address');
  }
  
  return missingFields;
};
```

### 4. Update Controllers and Endpoints

Update the `updateProfile` controller to use the new address structure:

```javascript
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      addressData  // New structure for address
    } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic profile information
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    
    // Handle phone number changes and verification
    if (phone && phone !== user.phone) {
      // Phone validation logic...
      user.phone = phone;
      user.mobileVerified = false;
    }
    
    // Update address if provided
    if (addressData) {
      // Check if user already has addresses
      if (user.addresses && user.addresses.length > 0) {
        // Find default address index
        const defaultAddressIndex = user.addresses.findIndex(addr => addr.isDefault);
        
        if (defaultAddressIndex >= 0) {
          // Update existing default address
          Object.assign(user.addresses[defaultAddressIndex], addressData);
        } else {
          // No default address, add as new default
          addressData.isDefault = true;
          user.addresses.push(addressData);
        }
      } else {
        // No addresses yet, add as first and default
        addressData.isDefault = true;
        user.addresses = [addressData];
      }
    }
    
    // Save the updated user
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          addresses: user.addresses,
          mobileVerified: user.mobileVerified,
          isProfileComplete: user.isProfileComplete,
          email: user.email
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};
```

### 5. Update Frontend Components

Update the Profile component to handle the structured address approach:

```javascript
// In Profile.js, update the state structure
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: {
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Iran',
    addressType: 'home',
    isDefault: true
  }
});

// When loading user data
useEffect(() => {
  if (user) {
    // Get default address from user data
    const defaultAddress = user.addresses && user.addresses.length > 0 
      ? user.addresses.find(addr => addr.isDefault) || user.addresses[0]
      : {
          fullName: `${user.firstName} ${user.lastName}`,
          phoneNumber: user.phone,
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Iran',
          addressType: 'home',
          isDefault: true
        };
    
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      email: user.email || '',
      address: defaultAddress
    });
  }
}, [user]);
```

### 6. Data Migration

Create a one-time migration script to move data from the flat fields to the structured approach:

```javascript
// migration.js
import User from './models/user.model.js';

const migrateAddresses = async () => {
  try {
    // Get all users
    const users = await User.find({});
    let migrated = 0;
    
    for (const user of users) {
      // Check if user has the old address format
      if (user.address || user.city || user.province || user.postalCode) {
        // Check if user already has addresses array
        if (!user.addresses) {
          user.addresses = [];
        }
        
        // Only add new address if there are actual address fields populated
        if (user.address || user.city || user.province || user.postalCode) {
          // Create new address object from flat fields
          const newAddress = {
            fullName: `${user.firstName} ${user.lastName}`,
            phoneNumber: user.phone,
            address: user.address || '',
            city: user.city || '',
            state: user.province || '',
            zipCode: user.postalCode || '',
            country: 'Iran',
            addressType: 'home',
            isDefault: true,
            additionalInfo: ''
          };
          
          // Check if we should update an existing address or add a new one
          if (user.addresses.length === 0) {
            // Add as first address
            user.addresses.push(newAddress);
          } else {
            // Set all existing addresses to non-default
            user.addresses.forEach(addr => {
              addr.isDefault = false;
            });
            
            // Add new address as default
            user.addresses.push(newAddress);
          }
          
          // Save the user with updated addresses
          await user.save();
          migrated++;
        }
      }
    }
    
    console.log(`Migration complete. ${migrated} users updated.`);
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run the migration
migrateAddresses();
```

## Testing

After making these changes, thoroughly test:

1. Profile updates via the UI
2. Address management functionality
3. Checkout flow that depends on address information
4. Admin views of user profiles

## Clean Up Phase

After confirming everything works correctly:

1. Remove redundant code that handled the flat address fields
2. Update all related templates and views
3. Update any documentation referencing the old address structure

By implementing these changes, we'll have a more consistent and maintainable approach to user address management, with the flexibility to support multiple addresses per user in the future. 