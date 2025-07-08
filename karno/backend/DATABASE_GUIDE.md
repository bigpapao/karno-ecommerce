# 🗄️ **MongoDB Database Management Guide**

## 📋 **Quick Reference**

### **Database Export & Analysis Tools**
- `export-db-structure.js` - Export complete database structure
- `populate-real-products.js` - Populate with real automotive data
- `optimize-database.js` - Create indexes and optimize performance
- `database-structure.json` - Current database structure export
- `database-analysis.md` - Detailed analysis report

---

## 🚀 **Getting Started**

### **1. Export Current Database Structure**
```bash
cd karno/backend
node export-db-structure.js
```
This creates:
- `database-structure.json` - Complete schema + sample data
- Console output with collection statistics

### **2. Populate with Real Data**
```bash
node populate-real-products.js
```
This adds 10 realistic automotive products with:
- Proper Persian names and descriptions
- Real OEM numbers and specifications
- Automotive-specific categories
- Proper pricing and inventory

### **3. Optimize Database Performance**
```bash
node optimize-database.js
```
This creates:
- Text search indexes for product search
- Compound indexes for filtering
- Performance optimizations

---

## 📊 **Database Sharing Methods**

### **Method 1: Structure Export (Recommended)**
**Best for:** Schema analysis, development planning
```bash
# Export structure
node export-db-structure.js

# Share these files:
# - database-structure.json
# - database-analysis.md
```

### **Method 2: MongoDB Dump**
**Best for:** Complete data backup/restore
```bash
# Export entire database
mongodump --db karno --out ./db-backup

# Import database
mongorestore --db karno ./db-backup/karno
```

### **Method 3: Specific Collection Export**
**Best for:** Sharing specific data
```bash
# Export products collection
mongoexport --db karno --collection products --out products.json

# Import products collection
mongoimport --db karno --collection products --file products.json
```

### **Method 4: Cloud Database Sharing**
**Best for:** Live collaboration
- MongoDB Atlas connection string
- Shared database credentials
- Read-only access for analysis

---

## 🔧 **Database Optimization Scripts**

### **Available Scripts**

| Script | Purpose | Usage |
|--------|---------|--------|
| `export-db-structure.js` | Export schema & samples | `node export-db-structure.js` |
| `populate-real-products.js` | Add realistic data | `node populate-real-products.js` |
| `optimize-database.js` | Create indexes | `node optimize-database.js` |

### **Custom Scripts You Can Create**

#### **1. Backup Script**
```javascript
// backup-database.js
import { exec } from 'child_process';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `karno-backup-${timestamp}`);

exec(`mongodump --db karno --out ${backupPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error}`);
    return;
  }
  console.log(`✅ Database backed up to: ${backupPath}`);
});
```

#### **2. Data Validation Script**
```javascript
// validate-data.js
import mongoose from 'mongoose';
import Product from './src/models/product.model.js';

async function validateData() {
  await mongoose.connect('mongodb://localhost:27017/karno');
  
  // Check for missing required fields
  const invalidProducts = await Product.find({
    $or: [
      { name: { $exists: false } },
      { price: { $exists: false } },
      { category: { $exists: false } }
    ]
  });
  
  console.log(`Found ${invalidProducts.length} invalid products`);
  
  await mongoose.disconnect();
}
```

---

## 📈 **Performance Monitoring**

### **Query Performance Analysis**
```javascript
// In your application
const explain = await Product.find({ category: 'brake-system' }).explain('executionStats');
console.log('Query execution time:', explain.executionStats.executionTimeMillis);
```

### **Index Usage Monitoring**
```javascript
// Check index usage
const stats = await Product.collection.stats({ indexDetails: true });
console.log('Index usage:', stats.indexSizes);
```

### **Slow Query Detection**
```javascript
// Enable profiling in MongoDB
db.setProfilingLevel(2, { slowms: 100 });

// Query slow operations
db.system.profile.find({ ts: { $gte: new Date(Date.now() - 1000 * 60 * 5) } });
```

---

## 🛠️ **Development Workflow**

### **1. Local Development**
```bash
# Start MongoDB locally
mongod --dbpath ./data/db

# Run your application
npm run dev

# Export structure for analysis
node export-db-structure.js
```

### **2. Testing with Real Data**
```bash
# Clear test data
node -e "
import mongoose from 'mongoose';
import Product from './src/models/product.model.js';
mongoose.connect('mongodb://localhost:27017/karno');
Product.deleteMany({});
"

# Populate with real data
node populate-real-products.js

# Test your application
npm test
```

### **3. Production Deployment**
```bash
# Backup production database
mongodump --uri "mongodb://production-url" --out ./prod-backup

# Apply optimizations
node optimize-database.js

# Verify performance
node -e "
// Performance test script
import mongoose from 'mongoose';
import Product from './src/models/product.model.js';

mongoose.connect('mongodb://localhost:27017/karno');
const start = Date.now();
const products = await Product.find({ category: 'brake-system' }).limit(10);
console.log('Query time:', Date.now() - start, 'ms');
"
```

---

## 📝 **Best Practices**

### **1. Schema Design**
- ✅ Use proper data types
- ✅ Add validation rules
- ✅ Create appropriate indexes
- ✅ Normalize when needed, denormalize for performance

### **2. Data Management**
- ✅ Regular backups
- ✅ Data validation scripts
- ✅ Performance monitoring
- ✅ Index optimization

### **3. Development**
- ✅ Use sample data for testing
- ✅ Export/import for team collaboration
- ✅ Document schema changes
- ✅ Version control migration scripts

### **4. Security**
- ✅ Secure connection strings
- ✅ Limit database access
- ✅ Regular security audits
- ✅ Encrypt sensitive data

---

## 🎯 **Common Use Cases**

### **Sharing Database with Team**
1. Export structure: `node export-db-structure.js`
2. Share `database-structure.json`
3. Team imports: `mongorestore --db karno ./backup`

### **Analyzing Performance Issues**
1. Export structure for analysis
2. Run optimization script
3. Monitor query performance
4. Adjust indexes as needed

### **Adding New Features**
1. Analyze current schema
2. Plan database changes
3. Create migration scripts
4. Test with real data

### **Production Deployment**
1. Backup current database
2. Apply optimizations
3. Test performance
4. Deploy with confidence

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
- **Connection errors**: Check MongoDB service status
- **Slow queries**: Run optimization script
- **Schema errors**: Validate data with custom scripts
- **Import/export issues**: Check file permissions

### **Getting Help**
- Share `database-structure.json` for schema analysis
- Share `database-analysis.md` for recommendations
- Use MongoDB Compass for visual analysis
- Check MongoDB logs for errors

---

*This guide provides everything you need to effectively manage and share your MongoDB database. Update it as your database evolves!* 