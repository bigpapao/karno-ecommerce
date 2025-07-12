import React, { useReducer, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login, clearError, logoutUser } from "../store/slices/authSlice";
import { isValidIranianMobile } from "../utils/phoneUtils";
import { getSessionId } from "../utils/sessionUtils";

// ───────────────────────────────── types ─────────────────────────────────────
const FIELD = {
  IDENT: "identifier",
  PASS: "password",
  ERR: "errors",
};

// ───────────────────────────────── reducer ───────────────────────────────────
const initialState = {
  identifier: "", // email or phone
  password: "",
  errors: {},
  identifierType: "phone", // or "email"
  rememberMe: false,
  showPassword: false,
  submitting: false,
};

function reducer(state, { type, field, value, payload }) {
  switch (type) {
    case "SET_FIELD":
      return { ...state, [field]: value };
    case "SET_ERRORS":
      return { ...state, errors: payload };
    case "CLEAR_ERROR":
      return { ...state, errors: { ...state.errors, [field]: "" } };
    case "TOGGLE":
      return { ...state, [field]: !state[field] };
    case "SET_SUBMITTING":
      return { ...state, submitting: value };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ───────────────────────────────── component ────────────────────────────────
const Login = () => {
  const [state, dispatchLocal] = useReducer(reducer, initialState);
  const { identifier, password, errors, identifierType, rememberMe, showPassword, submitting } =
    state;

  const reduxDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error, user } = useSelector((s) => s.auth);

  // ───────── clear global error on mount ─────────
  useEffect(() => {
    reduxDispatch(clearError());
  }, [reduxDispatch]);

  // ───────── redirect on login ─────────
  useEffect(() => {
    // Only redirect if user just logged in (not already authenticated when page loaded)
    if (isAuthenticated && state.submitting) {
      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location, state.submitting]);

  // ───────── sync global error → local errors ─────────
  useEffect(() => {
    if (error) dispatchLocal({ type: "SET_ERRORS", payload: { general: error } });
  }, [error]);

  // ───────── stop spinner when redux loading off ─────────
  useEffect(() => {
    if (!loading) dispatchLocal({ type: "SET_SUBMITTING", value: false });
  }, [loading]);

  // ───────── helpers ─────────
  const setField = (field) => (e) => {
    const value = e.target.value;
    if (field === FIELD.IDENT) {
      const type = value.includes("@") ? "email" : "phone";
      dispatchLocal({ type: "SET_FIELD", field: "identifierType", value: type });
    }
    dispatchLocal({ type: "SET_FIELD", field, value });
    if (errors[field]) dispatchLocal({ type: "CLEAR_ERROR", field });
  };

  const validate = useCallback(() => {
    const errs = {};
    if (!identifier) errs.identifier = "شماره موبایل یا ایمیل را وارد کنید";
    else if (identifierType === "phone" && !isValidIranianMobile(identifier))
      errs.identifier = "فرمت شماره موبایل نامعتبر است";
    else if (
      identifierType === "email" &&
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(identifier)
    )
      errs.identifier = "فرمت ایمیل نامعتبر است";

    if (!password) errs.password = "رمز عبور را وارد کنید";
    else if (password.length < 6) errs.password = "رمز عبور حداقل ۶ کاراکتر";

    dispatchLocal({ type: "SET_ERRORS", payload: errs });
    return Object.keys(errs).length === 0;
  }, [identifier, identifierType, password]);

  // ───────── submit ─────────
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    dispatchLocal({ type: "SET_SUBMITTING", value: true });
    const loginData = {
      sessionId: getSessionId(),
      rememberMe,
      password,
      ...(identifierType === "email" ? { email: identifier } : { phone: identifier }),
    };

    try {
      dispatchLocal({ type: "SET_ERRORS", payload: {} });
      await reduxDispatch(login(loginData)).unwrap();
      // redirect handled in isAuthenticated effect
    } catch {
      dispatchLocal({
        type: "SET_ERRORS",
        payload: { general: "نام کاربری یا رمز عبور اشتباه است" },
      });
      dispatchLocal({ type: "SET_SUBMITTING", value: false });
    }
  };

  // ───────── logout handler ─────────
  const handleLogout = async () => {
    try {
      await reduxDispatch(logoutUser()).unwrap();
      dispatchLocal({ type: "RESET" });
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ─────────────────────────── already logged in UI ───────────────────────────
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            شما وارد شده‌اید
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="text-center">
              <p className="font-medium mb-2">خوش آمدید!</p>
              <p className="text-sm">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || user.phone}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/profile"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500"
            >
              مشاهده پروفایل
            </Link>
            
            <Link
              to="/"
              className="flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-500"
            >
              بازگشت به صفحه اصلی
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-500"
            >
              خروج از حساب کاربری
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            کاربر دیگری هستید؟{' '}
            <button
              onClick={handleLogout}
              className="text-indigo-600 hover:text-indigo-500 underline"
            >
              ابتدا خروج کنید
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────── login form render ───────────────────────────
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          ورود به حساب کاربری
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          {/* identifier */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-900">
              شماره موبایل یا ایمیل
            </label>
            <div className="mt-2">
              <input
                id="identifier"
                name="identifier"
                type={identifierType === "email" ? "email" : "tel"}
                autoComplete={identifierType === "email" ? "email" : "tel"}
                className={`block w-full rounded-md border py-1.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600 sm:text-sm ${
                  errors.identifier ? "border-red-500 ring-red-500" : "border-gray-300"
                }`}
                placeholder={identifierType === "email" ? "example@mail.com" : "09123456789"}
                dir="ltr"
                value={identifier}
                onChange={setField(FIELD.IDENT)}
              />
              {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
            </div>
          </div>

          {/* password */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                رمز عبور
              </label>
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                فراموشی رمز عبور؟
              </Link>
            </div>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`block w-full rounded-md border py-1.5 text-gray-900 shadow-sm pr-10 focus:ring-2 focus:ring-indigo-600 sm:text-sm ${
                  errors.password ? "border-red-500 ring-red-500" : "border-gray-300"
                }`}
                dir="ltr"
                value={password}
                onChange={setField(FIELD.PASS)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                onClick={() => dispatchLocal({ type: "TOGGLE", field: "showPassword" })}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c1.834 0 3.55.508 5.042 1.39" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5c-4.35 0-8.026 2.942-9.458 7.5 1.432 4.558 5.108 7.5 9.458 7.5s8.026-2.942 9.458-7.5c-1.432-4.558-5.108-7.5-9.458-7.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
              </button>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>

          {/* remember me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              checked={rememberMe}
              onChange={() => dispatchLocal({ type: "TOGGLE", field: "rememberMe" })}
            />
            <label htmlFor="remember-me" className="mr-2 text-sm text-gray-900">
              مرا به خاطر بسپار
            </label>
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 ${
              submitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            ورود
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          حساب کاربری ندارید؟{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
            ثبت نام کنید
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
