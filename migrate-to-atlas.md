# Migrate Local MongoDB to MongoDB Atlas for Cloud Run

## **Step 1: Create MongoDB Atlas Account**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Create an account or sign in
4. Choose "Free" tier (M0)
5. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
6. Choose a region close to your Cloud Run service
7. Click "Create"

## **Step 2: Set Up Database Access**

1. In Atlas dashboard, go to **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and password (save these!)
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

## **Step 3: Set Up Network Access**

1. Go to **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for now - you can restrict later)
4. Click **"Confirm"**

## **Step 4: Get Your Connection String**

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `karno`

**Your connection string will look like:**
```
mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority
```

## **Step 5: Import Your Data to Atlas**

### **Option A: Using MongoDB Compass (GUI)**
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to your Atlas cluster using the connection string
3. Go to your local backup folder: `./backup/karno/`
4. Import each collection manually

### **Option B: Using Command Line**
```bash
# Import all collections from your backup
mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net/karno" ./backup/karno/
```

## **Step 6: Update Cloud Run Environment Variables**

In your Cloud Run service, update the environment variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority
JWT_SECRET = your-super-secure-jwt-secret-for-karno-app-2024
NODE_ENV = production
FRONTEND_URL = https://karno-ecommerce.vercel.app
```

## **Step 7: Test the Connection**

After updating the environment variables:

1. **Deploy your Cloud Run service**
2. **Test the health endpoint:**
   ```
   https://your-service-url/health
   ```
3. **Test a database endpoint:**
   ```
   https://your-service-url/api/v1/products
   ```

## **Alternative Options**

### **Option 2: Use Google Cloud SQL for MongoDB**
- More expensive but fully managed
- Better integration with Google Cloud

### **Option 3: Use MongoDB Atlas with Google Cloud**
- Atlas has direct integration with Google Cloud
- Can be set up through Google Cloud Console

### **Option 4: Keep Local MongoDB (Not Recommended)**
- Would require exposing your local MongoDB to the internet
- Security risks and reliability issues
- Not suitable for production

## **Cost Comparison**

| Option | Cost | Setup Difficulty | Reliability |
|--------|------|------------------|-------------|
| MongoDB Atlas Free | $0/month | Easy | High |
| MongoDB Atlas Paid | $9+/month | Easy | Very High |
| Google Cloud SQL | $25+/month | Medium | Very High |
| Local MongoDB | $0 | Hard | Low |

## **Recommended: MongoDB Atlas Free Tier**

- **Free forever** for small applications
- **512MB storage** (sufficient for most projects)
- **Shared RAM** (good performance)
- **Automatic backups**
- **99.95% uptime SLA**

## **Next Steps**

1. **Create MongoDB Atlas account**
2. **Import your data** using the backup we created
3. **Update Cloud Run environment variables**
4. **Test the deployment**
5. **Monitor the logs** for any connection issues

## **Troubleshooting**

### **If connection fails:**
- Check your connection string format
- Verify username/password
- Ensure network access allows connections
- Check if your IP is whitelisted (if using IP restrictions)

### **If data import fails:**
- Check file permissions
- Verify backup files are complete
- Try importing collections one by one

### **If Cloud Run can't connect:**
- Verify environment variables are set correctly
- Check Cloud Run logs for specific error messages
- Ensure MongoDB Atlas cluster is running

## **Security Best Practices**

1. **Use strong passwords** for database users
2. **Restrict network access** to specific IPs when possible
3. **Enable MongoDB Atlas security features** (encryption, audit logs)
4. **Regularly backup your data**
5. **Monitor access logs**

---

**Need help with any specific step? Let me know and I'll guide you through it!** 