# 🔧 Environment Setup Guide for Karno Vercel Deployment

## 📋 **What You Need to Configure**

### **1. MongoDB Database Setup**

**Option A: MongoDB Atlas (Recommended)**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user
5. Get your connection string
6. Add to Vercel environment variables

**Option B: Local MongoDB**
- Only for development, not recommended for production

### **2. Vercel Environment Variables**

Go to your Vercel project dashboard → Settings → Environment Variables

#### **Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karno
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
```

#### **Optional Variables (Add as needed):**
```
# Payment Gateways
ZARINPAL_MERCHANT_ID=your_zarinpal_merchant_id
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# Redis (Optional)
REDIS_URL=your_redis_url

# App URLs
FRONTEND_URL=https://your-domain.vercel.app
BACKEND_URL=https://your-domain.vercel.app/api
```

### **3. Frontend Environment Variables**

Create a file `karno/frontend/.env.production` with:

```env
# Production environment variables
REACT_APP_API_URL=https://your-domain.vercel.app/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

**Replace `your-domain.vercel.app` with your actual Vercel domain**

### **4. JWT Secret Generation**

Generate a secure JWT secret:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/64
```

### **5. MongoDB Atlas Setup Steps**

1. **Create Account**
   - Visit [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select cloud provider (AWS/Google Cloud/Azure)
   - Choose region closest to your users
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `karno_user`
   - Password: Generate a strong password
   - Role: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `karno`

### **6. Payment Gateway Setup**

#### **ZarinPal (Iranian Payment)**
1. Go to [zarinpal.com](https://zarinpal.com)
2. Create merchant account
3. Get your Merchant ID
4. Add to environment variables

#### **Stripe (International)**
1. Go to [stripe.com](https://stripe.com)
2. Create account
3. Get API keys from dashboard
4. Add to environment variables

### **7. Email Service Setup**

#### **Gmail SMTP**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### **Other SMTP Services**
- **SendGrid**: `smtp.sendgrid.net`
- **Mailgun**: `smtp.mailgun.org`
- **Amazon SES**: `email-smtp.us-east-1.amazonaws.com`

### **8. Testing Your Configuration**

After setting up environment variables:

1. **Deploy to Vercel**
2. **Test API Health**: `https://your-domain.vercel.app/api/health`
3. **Test Frontend**: Visit your Vercel URL
4. **Test Database**: Try creating a user or product
5. **Test Authentication**: Try login/register

### **9. Common Issues & Solutions**

#### **MongoDB Connection Failed**
- Check connection string format
- Verify network access is open
- Check database user credentials

#### **JWT Errors**
- Ensure JWT_SECRET is set
- Check JWT_SECRET is long enough (64+ characters)
- Verify JWT_SECRET is the same across deployments

#### **API Not Working**
- Check REACT_APP_API_URL is correct
- Verify API routes are properly configured
- Check CORS settings

#### **Build Failures**
- Check all required environment variables are set
- Verify Node.js version compatibility
- Check for missing dependencies

### **10. Security Best Practices**

1. **Never commit secrets to Git**
2. **Use strong, unique passwords**
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**
5. **Enable MongoDB Atlas security features**
6. **Set up proper CORS origins**

### **11. Monitoring & Logs**

- **Vercel Function Logs**: Check in Vercel dashboard
- **MongoDB Atlas Logs**: Available in Atlas dashboard
- **Frontend Errors**: Check browser console
- **API Errors**: Check Vercel function logs

---

## 🚀 **Quick Setup Checklist**

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] JWT secret generated
- [ ] Environment variables added to Vercel
- [ ] Frontend .env.production created
- [ ] Payment gateways configured (if needed)
- [ ] Email service configured (if needed)
- [ ] Deployed and tested

**Your Karno e-commerce platform will be ready to go live! 🎉** 