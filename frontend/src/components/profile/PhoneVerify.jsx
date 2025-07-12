import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api'; // Assuming api service is in services folder
import { toast } from 'react-toastify';
// import { updateUserProfile } from '../../store/slices/authSlice'; // If you have an action to update user profile in Redux

const PhoneVerify = () => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter code, 3: Done
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Get user from Redux state if needed, e.g., to prefill phone number
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && user.phone && !user.phoneVerified) {
      // setPhoneNumber(user.phone); // Uncomment if you want to prefill
    }
    if (user && user.phoneVerified) {
        setStep(3); // Already verified
        setSuccessMessage('Your phone number is already verified.');
    }
  }, [user]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await api.post('/users/phone/request', { phoneNumber });
      setSuccessMessage(response.data.message || 'Verification code sent!');
      // For testing, if backend returns the code:
      if (response.data.verificationCode) {
        // Development verification code logging removed for production
        toast.info(`Test Verification Code: ${response.data.verificationCode}`);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request code. Please try again.');
      toast.error(err.message || 'Failed to request code. Please try again.');
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await api.post('/users/phone/verify', { code });
      setSuccessMessage(response.data.message || 'Phone number verified successfully!');
      toast.success(response.data.message || 'Phone number verified successfully!');
      setStep(3);
      // Optionally, dispatch an action to update user profile in Redux store if phoneVerified status changed
      // if (dispatch && updateUserProfile) dispatch(updateUserProfile({ ...user, phoneVerified: true, phone: phoneNumber }));
    } catch (err) {
      setError(err.message || 'Failed to verify code. Please check the code and try again.');
      toast.error(err.message || 'Failed to verify code. Please check the code and try again.');
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setStep(1);
    setPhoneNumber('');
    setCode('');
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Verify Your Phone Number</h2>
        <form onSubmit={handleRequestCode}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 09123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Enter Verification Code</h2>
        {successMessage && <p className="text-sm text-green-600 mb-4 text-center">{successMessage}</p>}
        <form onSubmit={handleVerifyCode}>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter 5-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button 
            type="button"
            onClick={() => setStep(1)} 
            className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            Back to phone number entry
          </button>
        </form>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Phone Verified!</h2>
        <p className="text-green-600 mb-6">{successMessage || 'Your phone number has been successfully verified.'}</p>
        <button 
          onClick={resetForm} 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Verify Another Number (or Start Over)
        </button>
        {/* Add a link to go to profile or dashboard */}
        {/* <Link to="/profile" className="mt-3 inline-block text-indigo-600 hover:text-indigo-500">Go to Profile</Link> */}
      </div>
    );
  }

  return null; // Should not reach here
};

export default PhoneVerify; 