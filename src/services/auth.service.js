import axios from "axios";
import { api1, api2 } from "../baseUrl"
const API_URL = api1;

const requestVisitorRegistration = async (email) => {
  const response = await axios.post(
    `${API_URL}/users/visitor/request`,
    { email },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response;
};

const verifyCode = async (formData, verificationCode) => {
  const visitorData = {
    email: formData.email,
    code: verificationCode,
    name: formData.firstName + " " + formData.lastName,
    gender: formData.gender,
    phone: formData.phone,
    password: formData.password,
    nationality: formData.nationality,
  };

  const response = await axios.post(
    `${API_URL}/users/visitor/verify`,
    visitorData,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response;
};

/**
 * Fetch a server-generated CAPTCHA challenge.
 * Returns { token, imageUrl, expiresAt }
 */
export const getCaptcha = () => {
  return axios.get(`${API_URL}/public/captcha`);
};

/**
 * Login with server-side CAPTCHA verification.
 * @param {string} email
 * @param {string} password
 * @param {string} captchaToken  - opaque token returned by getCaptcha
 * @param {string} captchaAnswer - what the user typed
 */
export const login = (email, password, captchaToken, captchaAnswer) => {
  return axios.post(
    `${API_URL}/public/login`,
    { email, password, captchaToken, captchaAnswer },
    {
      withCredentials: true, // so refresh cookie is set
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

const refreshAccessToken = async () => {
  const response = await axios.post(
    `${API_URL}/public/refresh`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

const forgotPassword = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/public/forgot-password`,
      { email },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending forgot password request:", error);
    throw error;
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(
      `${API_URL}/public/reset-password`,
      { token, newPassword },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

const resendVerificationCode = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/public/resend-verification-code`,
      { email },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error resending verification code:", error);
    throw error;
  }
};

const authService = {
  requestVisitorRegistration,
  verifyCode,
  getCaptcha,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
};

export default authService;


