/**
 * Email Templates with RTL Support for Persian Text
 *
 * This module provides reusable email templates with proper RTL support
 * for Persian text. All templates include UTF-8 encoding, RTL direction,
 * and responsive design for better email client compatibility.
 */

/**
 * Creates the base HTML structure for all email templates
 * @param {string} title - Email title
 * @param {string} content - Email content (HTML)
 * @returns {string} Complete HTML email template
 */
export const baseEmailTemplate = (title, content) => `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <!-- Import Vazirmatn font for Persian text -->
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
      <style>
        @font-face {
          font-family: 'Vazirmatn';
          src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Vazirmatn';
          src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        body {
          font-family: 'Vazirmatn', 'IRANSans', 'Tahoma', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          color: #333333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eeeeee;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1976d2;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        /* Ensure Persian numbers are displayed correctly */
        .persian-numbers {
          font-feature-settings: "ss01";
        }
        /* RTL table styles */
        .rtl-table {
          width: 100%;
          border-collapse: collapse;
          text-align: right;
        }
        .rtl-table th {
          text-align: right;
          padding: 8px;
          border-bottom: 2px solid #eeeeee;
        }
        .rtl-table td {
          padding: 8px;
          border-bottom: 1px solid #eeeeee;
        }
        /* Ensure proper alignment for mixed content */
        .ltr {
          direction: ltr;
          text-align: left;
        }
        .rtl {
          direction: rtl;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.</p>
          <p class="persian-numbers">&copy; ${new Date().getFullYear()} کارنو - تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </body>
    </html>
  `;

/**
 * Email verification template
 * @param {string} verificationUrl - URL for email verification
 * @returns {string} HTML email template for verification
 */
export const verificationEmailTemplate = (verificationUrl) => {
  const content = `
    <p>سلام،</p>
    <p>برای تکمیل ثبت‌نام و تأیید آدرس ایمیل خود، لطفاً روی دکمه زیر کلیک کنید:</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">تأیید آدرس ایمیل</a>
    </div>
    <p>اگر شما این درخواست را ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
    <p class="persian-numbers">این لینک به مدت ۲۴ ساعت معتبر است.</p>
  `;
  return baseEmailTemplate('به کارنو خوش آمدید!', content);
};

/**
 * Password reset template
 * @param {string} resetUrl - URL for password reset
 * @returns {string} HTML email template for password reset
 */
export const passwordResetTemplate = (resetUrl) => {
  const content = `
    <p>سلام،</p>
    <p>شما درخواست بازنشانی رمز عبور کرده‌اید. برای ایجاد رمز عبور جدید، لطفاً روی دکمه زیر کلیک کنید:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">بازنشانی رمز عبور</a>
    </div>
    <p>اگر شما این درخواست را ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
    <p class="persian-numbers">این لینک به مدت ۱ ساعت معتبر است.</p>
  `;
  return baseEmailTemplate('درخواست بازنشانی رمز عبور', content);
};

/**
 * Order confirmation template
 * @param {Object} order - Order details
 * @returns {string} HTML email template for order confirmation
 */
export const orderConfirmationTemplate = (order) => {
  const {
    orderNumber, items, totalPrice, shippingAddress,
  } = order;

  let itemsHtml = '';
  items.forEach((item) => {
    itemsHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eeeeee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eeeeee;" class="persian-numbers">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eeeeee;" class="persian-numbers">${item.price.toLocaleString('fa-IR')} تومان</td>
      </tr>
    `;
  });

  const content = `
    <p>سلام،</p>
    <p>از خرید شما متشکریم! سفارش شما با موفقیت ثبت شد.</p>
    <p><strong>شماره سفارش:</strong> <span class="persian-numbers">${orderNumber}</span></p>
    
    <h3>اقلام سفارش:</h3>
    <table class="rtl-table">
      <thead>
        <tr>
          <th>محصول</th>
          <th>تعداد</th>
          <th>قیمت</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="text-align: left; padding: 8px; font-weight: bold;">مجموع:</td>
          <td style="padding: 8px; font-weight: bold;" class="persian-numbers">${totalPrice.toLocaleString('fa-IR')} تومان</td>
        </tr>
      </tfoot>
    </table>
    
    <h3>آدرس ارسال:</h3>
    <p>
      ${shippingAddress.fullName}<br>
      ${shippingAddress.address}<br>
      ${shippingAddress.city}، ${shippingAddress.state}<br>
      <span class="persian-numbers">کد پستی: ${shippingAddress.zipCode}</span><br>
      <span class="persian-numbers">شماره تماس: ${shippingAddress.phoneNumber}</span>
    </p>
    
    <p>اطلاعات بیشتر در مورد سفارش خود را می‌توانید در حساب کاربری خود مشاهده کنید.</p>
  `;

  return baseEmailTemplate('تأیید سفارش', content);
};

/**
 * Shipping notification template
 * @param {Object} shipment - Shipment details
 * @returns {string} HTML email template for shipping notification
 */
export const shippingNotificationTemplate = (shipment) => {
  const { orderNumber, trackingNumber, estimatedDelivery } = shipment;

  const content = `
    <p>سلام،</p>
    <p>سفارش شما ارسال شده است!</p>
    <p><strong>شماره سفارش:</strong> <span class="persian-numbers">${orderNumber}</span></p>
    <p><strong>کد رهگیری:</strong> <span class="persian-numbers">${trackingNumber}</span></p>
    <p><strong>زمان تقریبی تحویل:</strong> <span class="persian-numbers">${estimatedDelivery}</span></p>
    
    <p>شما می‌توانید با استفاده از کد رهگیری، وضعیت سفارش خود را پیگیری کنید.</p>
    
    <div style="text-align: center;">
      <a href="https://karno.ir/orders" class="button">مشاهده سفارش‌ها</a>
    </div>
    
    <p>با تشکر از خرید شما!</p>
  `;

  return baseEmailTemplate('سفارش شما ارسال شد', content);
};

/**
 * Welcome email template
 * @param {string} userName - User's name
 * @returns {string} HTML email template for welcome message
 */
export const welcomeTemplate = (userName) => {
  const content = `
    <p>سلام ${userName}،</p>
    <p>به فروشگاه کارنو خوش آمدید! از اینکه ما را انتخاب کردید، متشکریم.</p>
    
    <p>در فروشگاه کارنو، شما می‌توانید:</p>
    <ul>
      <li>قطعات اصلی و با کیفیت خودرو را پیدا کنید</li>
      <li>از تخفیف‌های ویژه اعضا بهره‌مند شوید</li>
      <li>سفارش‌های خود را به راحتی پیگیری کنید</li>
      <li>از مشاوره تخصصی برخوردار شوید</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="https://karno.ir/products" class="button">مشاهده محصولات</a>
    </div>
    
    <p>اگر سوالی دارید، کافیست با پشتیبانی ما تماس بگیرید.</p>
  `;

  return baseEmailTemplate('به کارنو خوش آمدید!', content);
};
