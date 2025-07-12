import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, clearError } from '../store/slices/authSlice';
import { getSessionId } from '../utils/sessionUtils';
import { toast } from 'react-toastify';
import Joi from 'joi';

// Client-side validation schema using Joi
const registerSchema = Joi.object({
  firstName: Joi.string().min(3).max(50).required()
    .messages({
      'string.min': 'نام باید حداقل 3 کاراکتر باشد',
      'string.max': 'نام نباید بیشتر از 50 کاراکتر باشد',
      'any.required': 'نام الزامی است'
    }),
  lastName: Joi.string().min(3).max(50).required()
    .messages({
      'string.min': 'نام خانوادگی باید حداقل 3 کاراکتر باشد',
      'string.max': 'نام خانوادگی نباید بیشتر از 50 کاراکتر باشد',
      'any.required': 'نام خانوادگی الزامی است'
    }),
  mobile: Joi.string().pattern(/^09\d{9}$/).messages({
    'string.pattern.base': 'شماره موبایل باید 11 رقم و با فرمت 09XXXXXXXXX باشد'
  }),
  email: Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).messages({
    'string.pattern.base': 'فرمت ایمیل نامعتبر است'
  }),
  password: Joi.string().min(8).pattern(/.*[0-9].*/).required()
    .messages({
      'string.min': 'رمز عبور باید حداقل 8 کاراکتر باشد',
      'string.pattern.base': 'رمز عبور باید حداقل شامل یک عدد باشد',
      'any.required': 'رمز عبور الزامی است'
    }),
  confirmPassword: Joi.any().equal(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'رمز عبور و تکرار آن مطابقت ندارند' }),
  termsAccepted: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'پذیرش قوانین و مقررات الزامی است' })
}).or('email', 'mobile').messages({
  'object.missing': 'حداقل یکی از فیلدهای ایمیل یا شماره موبایل باید وارد شود'
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ''
  });
  
  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Show error message if registration fails
  useEffect(() => {
    if (error) {
      if (typeof error === 'object' && error.fieldErrors) {
        // Handle field-specific errors
        setFormErrors(error.fieldErrors);
      } else {
        // Handle general error - ensure it's always a string
        const errorMessage = typeof error === 'object' ? 
          (error.message || 'خطا در ثبت نام') : 
          (error || 'خطا در ثبت نام');
        setFormErrors({ general: errorMessage });
      }
      setIsSubmitting(false);
    }
  }, [error]);
  
  // Update local submitting state based on global loading state
  useEffect(() => {
    if (!loading) {
      setIsSubmitting(false);
    }
  }, [loading]);

  // Validate form before submission
  const validateForm = useCallback((silent = false) => {
    // Use Joi for validation
    const { error } = registerSchema.validate(formData, { abortEarly: false });
    
    if (error) {
      const validationErrors = {};
      
      error.details.forEach((detail) => {
        validationErrors[detail.path[0]] = detail.message;
      });
      
      // Only update UI errors if not in silent mode
      if (!silent) {
        setFormErrors(validationErrors);
      }
      
      setIsFormValid(false);
      return false;
    }
    
    // Additional validation for either email or mobile
    if (!formData.email && !formData.mobile) {
      const errors = {
        ...(silent ? {} : formErrors),
        general: 'حداقل یکی از فیلدهای ایمیل یا شماره موبایل باید وارد شود'
      };
      
      if (!silent) {
        setFormErrors(errors);
      }
      
      setIsFormValid(false);
      return false;
    }
    
    setIsFormValid(true);
    return true;
  }, [formData, formErrors]);

  // Validate form whenever formData changes
  useEffect(() => {
    validateForm(true);
  }, [formData, validateForm]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  // Check password strength
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = 'ضعیف';
    let color = 'text-red-600';
    
    // Improved strength check
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++; // Special character
    
    if (score >= 4) {
      message = 'قوی';
      color = 'text-green-600';
    } else if (score >= 3) {
      message = 'متوسط';
      color = 'text-yellow-600';
    } else if (score >= 2) {
      message = 'ضعیف';
      color = 'text-orange-600';
    } else {
      message = 'بسیار ضعیف';
      color = 'text-red-600';
    }
    
    setPasswordStrength({
      score,
      message,
      color
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Set local submitting state
    setIsSubmitting(true);
    
    // Get session ID for cart merging
    const sessionId = getSessionId();
    
    // Prepare registration data
    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      password: formData.password,
      sessionId
    };
    
    // Add either mobile or email based on what the user provided
    if (formData.mobile) {
      registrationData.mobile = formData.mobile;
    }
    
    if (formData.email) {
      registrationData.email = formData.email;
    }
    
    try {
      await dispatch(register(registrationData)).unwrap();
      // On success, the useEffect for isAuthenticated will handle redirect
      toast.success('ثبت‌نام با موفقیت انجام شد');
      navigate("/profile", { replace: true });
    } catch (err) {
      // Registration error handled
      
      // Display detailed error message from the server
      if (err.fieldErrors) {
        // Field-specific errors are already handled in the useEffect
        toast.error('لطفاً خطاهای فرم را برطرف کنید');
      } else {
        const errorMsg = err?.data?.message || err?.message || "خطا در ثبت نام";
        toast.error(errorMsg);
      }
    } finally {
      // Ensure loading state is reset even if there's an unexpected error
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          ثبت نام در سایت
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {formErrors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{formErrors.general}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">
                نام
              </label>
              <div className="mt-2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    formErrors.firstName ? 'ring-red-500' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {formErrors.firstName && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">
                نام خانوادگی
              </label>
              <div className="mt-2">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    formErrors.lastName ? 'ring-red-500' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {formErrors.lastName && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900">
                شماره موبایل
              </label>
              <div className="mt-2">
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    formErrors.mobile ? 'ring-red-500' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="09123456789"
                  dir="ltr"
                />
                {formErrors.mobile && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.mobile}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                ایمیل (اختیاری)
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    formErrors.email ? 'ring-red-500' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  dir="ltr"
                />
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">وارد کردن یکی از موارد شماره موبایل یا ایمیل الزامی است</p>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              رمز عبور
            </label>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  formErrors.password ? 'ring-red-500' : 'ring-gray-300'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pr-10`}
                value={formData.password}
                onChange={handleChange}
                dir="ltr"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={() => togglePasswordVisibility('password')}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {formErrors.password && (
                <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
              )}
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength.score < 2 ? 'bg-red-500' : 
                        passwordStrength.score < 3 ? 'bg-orange-500' :
                        passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${Math.min(100, (passwordStrength.score / 5) * 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                    قدرت رمز عبور: {passwordStrength.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
              تأیید رمز عبور
            </label>
            <div className="mt-2 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  formErrors.confirmPassword ? 'ring-red-500' : 'ring-gray-300'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pr-10`}
                value={formData.confirmPassword}
                onChange={handleChange}
                dir="ltr"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {formErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <label htmlFor="termsAccepted" className="mr-2 block text-sm text-gray-900">
              <span>من با </span>
              <a href="/terms" className="text-indigo-600 hover:text-indigo-500">قوانین و مقررات</a>
              <span> موافق هستم</span>
            </label>
          </div>
          {formErrors.termsAccepted && (
            <p className="mt-1 text-sm text-red-600">{formErrors.termsAccepted}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                (isSubmitting || !isFormValid) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              ثبت نام
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          قبلاً ثبت نام کرده‌اید؟{' '}
          <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            وارد شوید
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
