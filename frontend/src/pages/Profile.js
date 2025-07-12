import React, { useEffect, useReducer, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getProfile,
  updateProfile,
  requestPhoneVerification,
  verifyPhone
} from "../store/slices/authSlice";
import { isValidIranianMobile, normalizePhoneNumber } from "../utils/phoneUtils";

// -----------------------------------------------------------------------------
// Form reducer ‑ keeps all profile fields in a single object so we avoid dozens
//   of useState calls and can update any field with a single action.
// -----------------------------------------------------------------------------
const FORM_RESET = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  province: "",
  postalCode: ""
};

function formReducer(state, { type, field, value, payload }) {
  switch (type) {
    case "SET_FIELD":
      return { ...state, [field]: value };
    case "BULK_SET": // when we load user profile from API
      return { ...state, ...payload };
    case "RESET":
      return { ...FORM_RESET };
    default:
      return state;
  }
}

const initialErrors = {};

const Profile = () => {
  // ---------------------------------------------------------------------------
  // Redux / routing glue
  // ---------------------------------------------------------------------------
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, authChecked, successMessage, error } = useSelector(
    (s) => s.auth
  );

  // ---------------------------------------------------------------------------
  // Local state ‑ forms, OTP, misc flags
  // ---------------------------------------------------------------------------
  const [formData, dispatchForm] = useReducer(formReducer, FORM_RESET);
  const [errors, setErrors] = useState(initialErrors);
  const [isSubmitting, setSubmitting] = useState(false);

  // OTP section
  const [otpStep, setOtpStep] = useState("idle"); // idle | sent | verifying
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0); // seconds

  // ---------------------------------------------------------------------------
  // Side‑effects
  // ---------------------------------------------------------------------------
  // Load profile once auth is ready
  useEffect(() => {
    if (authChecked && isAuthenticated && !user) {
      dispatch(getProfile());
    }
  }, [authChecked, isAuthenticated, user, dispatch]);

  // Prefill form when user data arrives
  useEffect(() => {
    if (user)
      dispatchForm({ type: "BULK_SET", payload: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        city: user.city || "",
        province: user.province || "",
        postalCode: user.postalCode || ""
      }});
  }, [user]);

  // Redirect if user is not authenticated but auth check finished
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authChecked, isAuthenticated, navigate]);

  // Handle OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const setField = (e) => {
    const { name, value } = e.target;
    dispatchForm({ type: "SET_FIELD", field: name, value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateProfile = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = "نام الزامی است";
    if (!formData.lastName.trim()) e.lastName = "نام خانوادگی الزامی است";
    if (!formData.address.trim()) e.address = "آدرس الزامی است";
    if (!formData.city.trim()) e.city = "شهر الزامی است";
    if (!formData.province.trim()) e.province = "استان الزامی است";
    if (!formData.postalCode.trim()) e.postalCode = "کد پستی الزامی است";

    if (!formData.phone) e.phone = "شماره موبایل الزامی است";
    else if (!isValidIranianMobile(formData.phone)) e.phone = "فرمت شماره موبایل نامعتبر است";
    if (formData.postalCode && !/^\d{10}$/.test(formData.postalCode))
      e.postalCode = "کد پستی باید ۱۰ رقم باشد";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------
  const onProfileSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateProfile()) return;

    setSubmitting(true);
    try {
      await dispatch(updateProfile(formData)).unwrap();
    } catch (err) {
      // Error handled
    } finally {
      setSubmitting(false);
    }
  };

  // Send OTP to phone
  const sendOtp = async () => {
    const apiKey = process.env.REACT_APP_SMS_API_KEY;
    if (!isSubmitting) {
      // API call with apiKey
      setSubmitting(true);
      try {
        // Format phone number for backend (09xxxxxxxxx format)
        let backendPhone = formData.phone.toString().replace(/\D/g, '');
        if (backendPhone.startsWith('98')) {
          backendPhone = backendPhone.substring(2);
        }
        if (!backendPhone.startsWith('0')) {
          backendPhone = '0' + backendPhone;
        }
        
        // Request with SMS.ir API key
        const response = await fetch(`https://sms.ir/api/otp/send?apiKey=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: backendPhone,
            // other parameters
          }),
        });
  
        const data = await response.json();
        if (data.success) {
          setOtpStep("sent");
          setOtpCountdown(120);
        } else {
          setErrors((p) => ({ ...p, phone: "OTP sending failed" }));
        }
      } catch (err) {
        // Error handled
        setErrors((p) => ({ ...p, phone: err.message || "OTP request failed" }));
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (otpCode.length !== 6) return setErrors((p) => ({ ...p, otp: "کد ۶ رقم است" }));

    setSubmitting(true);
    try {
      // Format phone number for backend (09xxxxxxxxx format)
      let backendPhone = formData.phone.toString().replace(/\D/g, '');
      if (backendPhone.startsWith('98')) {
        backendPhone = backendPhone.substring(2);
      }
      if (!backendPhone.startsWith('0')) {
        backendPhone = '0' + backendPhone;
      }
      
      await dispatch(
        verifyPhone({ phone: backendPhone, code: otpCode })
      ).unwrap();
      setOtpStep("verified");
    } catch (err) {
      setErrors((p) => ({ ...p, otp: err.message || "کد نادرست است" }));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderOtpSection = () => {
    if (otpStep === "verified" || user?.mobileVerified) {
      return <p className="text-green-600 text-sm mt-1">شماره موبایل تایید شده است ✔</p>;
    }

    return (
      <>
        {otpStep === "idle" && (
          <button
            type="button"
            onClick={sendOtp}
            disabled={isSubmitting}
            className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-60"
          >
            دریافت کد تایید
          </button>
        )}

        {otpStep === "sent" && (
          <form onSubmit={verifyOtp} className="flex items-center space-x-2 mt-2" dir="ltr">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D+/g, ""))}
              className="border rounded-md p-2 w-24 text-center"
              placeholder="------"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-60"
            >
              تایید
            </button>
            <button
              type="button"
              disabled={otpCountdown > 0 || isSubmitting}
              onClick={sendOtp}
              className="text-xs text-indigo-600 disabled:opacity-40"
            >
              {otpCountdown > 0 ? `ارسال مجدد (${otpCountdown})` : "ارسال مجدد"}
            </button>
            {errors.otp && <span className="text-red-600 text-xs">{errors.otp}</span>}
          </form>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">پروفایل کاربری</h1>

      {successMessage && (
        <div className="mb-4 p-4 rounded bg-green-100 border border-green-400 text-green-700">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onProfileSubmit} className="bg-white p-6 rounded shadow-md space-y-6">
        {/* Personal info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              نام <span className="text-red-500">*</span>
            </label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              شماره موبایل <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                name="phone"
                value={formData.phone}
                onChange={setField}
                className={`flex-grow rounded-md border p-2 ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                dir="ltr"
              />
              {renderOtpSection()}
            </div>
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">ایمیل (اختیاری)</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={setField}
              className="w-full rounded-md border p-2 border-gray-300"
              dir="ltr"
            />
          </div>
        </section>

        {/* Address */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              آدرس <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              rows={3}
              value={formData.address}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.address ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              شهر <span className="text-red-500">*</span>
            </label>
            <input
              name="city"
              value={formData.city}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.city ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              استان <span className="text-red-500">*</span>
            </label>
            <input
              name="province"
              value={formData.province}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.province ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.province && <p className="text-red-600 text-xs mt-1">{errors.province}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              کد پستی <span className="text-red-500">*</span>
            </label>
            <input
              name="postalCode"
              value={formData.postalCode}
              onChange={setField}
              className={`w-full rounded-md border p-2 ${errors.postalCode ? "border-red-500" : "border-gray-300"}`}
              dir="ltr"
            />
            {errors.postalCode && <p className="text-red-600 text-xs mt-1">{errors.postalCode}</p>}
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:opacity-60"
        >
          {isSubmitting ? "در حال ذخیره…" : "ذخیره اطلاعات"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
