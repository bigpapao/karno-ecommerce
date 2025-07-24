# Setting Up Environment Variables for Karno Backend

## **Option 1: Direct Environment Variables (Quick Setup)**

### **Using Google Cloud Console:**
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your `karno-backend` service
3. Click **"Edit & Deploy New Revision"**
4. Scroll to **"Variables & Secrets"**
5. Add these environment variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority
JWT_SECRET = your_super_secret_jwt_key_here
NODE_ENV = production
```

### **Using gcloud CLI:**
```bash
gcloud run services update karno-backend \
  --set-env-vars \
  MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority",\
  JWT_SECRET="your_super_secret_jwt_key_here",\
  NODE_ENV="production"
```

## **Option 2: Google Secret Manager (Recommended for Production)**

### **Step 1: Create Secrets**
```bash
# Create MongoDB URI secret
echo -n "mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority" | \
gcloud secrets create mongodb-uri --data-file=-

# Create JWT secret
echo -n "your_super_secret_jwt_key_here" | \
gcloud secrets create jwt-secret --data-file=-
```

### **Step 2: Grant Access to Cloud Run**
```bash
# Get your Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe karno-backend --region=us-central1 --format="value(spec.template.spec.serviceAccountName)")

# Grant access to secrets
gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

### **Step 3: Update Cloud Run with Secret References**
```bash
gcloud run services update karno-backend \
  --set-env-vars \
  NODE_ENV="production",\
  PORT="5000" \
  --update-secrets \
  MONGODB_URI="mongodb-uri:latest",\
  JWT_SECRET="jwt-secret:latest"
```

## **Option 3: Update Cloud Build Trigger with Substitutions**

### **Step 1: Update your Cloud Build Trigger**
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click on your trigger
3. Go to **"Advanced"** section
4. Add these substitutions:

```
_MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority
_JWT_SECRET = your_super_secret_jwt_key_here
```

### **Step 2: The cloudbuild.yaml will use these automatically**

## **MongoDB Connection String Examples**

### **MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority
```

### **Local MongoDB (if you have a server):**
```
mongodb://username:password@your-server-ip:27017/karno
```

### **MongoDB Atlas with additional options:**
```
mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority&maxPoolSize=10&minPoolSize=5
```

## **Required Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/karno` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Port to listen on | `5000` |

## **Optional Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGIN` | Frontend URL for CORS | `https://karno-ecommerce.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe payment key | `sk_test_...` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | `...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_BUCKET_NAME` | S3 bucket name | `karno-uploads` |

## **Testing Your Configuration**

After setting up environment variables:

1. **Deploy your service**
2. **Test the health endpoint:**
   ```bash
   curl https://your-service-url/health
   ```

3. **Test the main endpoint:**
   ```bash
   curl https://your-service-url/
   ```

## **Troubleshooting**

### **If MongoDB connection fails:**
- Check your connection string format
- Verify network access (IP whitelist for Atlas)
- Check username/password
- Ensure database exists

### **If JWT errors occur:**
- Verify JWT_SECRET is set
- Check secret length (should be at least 32 characters)

### **If CORS errors occur:**
- Update CORS_ORIGIN with your frontend URL
- Check the CORS configuration in server.js

## **Security Best Practices**

1. **Never commit secrets to version control**
2. **Use Secret Manager for production**
3. **Rotate secrets regularly**
4. **Use least privilege access**
5. **Monitor access logs**

## **Next Steps**

1. Choose your preferred method (Option 1, 2, or 3)
2. Set up your environment variables
3. Deploy your service
4. Test the endpoints
5. Monitor the logs for any issues 