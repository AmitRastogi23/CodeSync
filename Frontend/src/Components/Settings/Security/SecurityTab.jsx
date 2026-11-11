import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./SecurityTab.css";
import api from "../../../api/axios";

import TwoFactorModal from "./TwoFactorModal";
import Disable2FAModal from "./Disable2FAModal";
import Toast from "../../Toast";
import ConfirmModal from "../RemoveModalComponent";
import DeleteVerificationModal from "./DeleteVerificationModal"; // 👈 NAYA

const SecurityTab = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const hasPassword = !!user?.hasPassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

  const is2FAEnabled = user?.isTwoFactorEnabled || false;
  const [is2FALoading, setIs2FALoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Delete Account States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "google") {
      const fetchUser = async () => {
        const res = await api.get("/auth/me");
        updateUser(res.data.user);
      };
      fetchUser();
      setToast({
        isVisible: true,
        message: "Google account connected successfully!",
        type: "success",
      });
      setSearchParams({});
    } else if (connected === "github") {
      const fetchUser = async () => {
        const res = await api.get("/auth/me");
        updateUser(res.data.user);
      };
      fetchUser();
      setToast({
        isVisible: true,
        message: "GitHub account connected successfully!",
        type: "success",
      });
      setSearchParams({});
    } else if (error === "connect_failed") {
      setToast({
        isVisible: true,
        message:
          "Failed to connect. This account may already be linked to another user.",
        type: "error",
      });
      setSearchParams({});
    }
  }, [searchParams, updateUser, setSearchParams]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({
        isVisible: true,
        message: "New passwords do not match!",
        type: "error",
      });
      return;
    }
    try {
      const res = await api.patch("/user/password", {
        currentPassword,
        newPassword,
      });
      setToast({ isVisible: true, message: res.data.message, type: "success" });
      if (res.data.user) updateUser(res.data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to update password",
        type: "error",
      });
    }
  };

  const handleEnable2FA = async () => {
    setIs2FALoading(true);
    setQrCodeUrl("");
    setTwoFactorSecret("");
    try {
      const res = await api.post("/user/2fa/generate");
      setQrCodeUrl(res.data.qrCode);
      setTwoFactorSecret(res.data.secret);
      setIsModalOpen(true);
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to generate 2FA",
        type: "error",
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleEnable2FASubmit = async (token) => {
    try {
      const res = await api.post("/user/2fa/verify", { token });
      updateUser(res.data.user);
      setIsModalOpen(false);
      setToast({
        isVisible: true,
        message: "2FA enabled successfully!",
        type: "success",
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Invalid 2FA code",
        type: "error",
      });
      throw err;
    }
  };

  const handleDisable2FASubmit = async (token) => {
    try {
      const res = await api.post("/user/2fa/disable", { token });
      updateUser(res.data.user);
      setIsDisableModalOpen(false);
      setToast({
        isVisible: true,
        message: "2FA disabled successfully!",
        type: "success",
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to disable 2FA",
        type: "error",
      });
      throw err;
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/connect`;
  };

  const handleConnectGithub = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github/connect`;
  };

  const handleRequestDelete = async () => {
    setIsDeletingAccount(true);
    setDeleteError("");
    try {
      const res = await api.post("/user/delete-account/request");
      setDeleteMethod(res.data.type);
      setIsDeleteModalOpen(false);
      setIsVerifyModalOpen(true);
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to send request",
        type: "error",
      });
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!verificationCode) {
      return setDeleteError("Please enter the code.");
    }
    setIsDeletingAccount(true);
    setDeleteError("");
    try {
      await api.post("/user/delete-account/confirm", {
        code: verificationCode,
      });
      setIsVerifyModalOpen(false);
      setToast({
        isVisible: true,
        message: "Account deleted successfully. Logging out...",
        type: "success",
      });

      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Invalid code or server error",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="st-tab">
      <div className="st-page-header">
        <h1 className="st-page-title">Security Settings</h1>
        <p className="st-breadcrumb">Settings / Security</p>
      </div>

      {/* 1. Password Section */}
      <div className="st-settings-card">
        <h2 className="st-card-heading">
          {hasPassword ? "Change Password" : "Add Password"}
        </h2>
        <p className="st-card-desc">
          {hasPassword
            ? "Update your password to keep your account secure."
            : "You signed up with Google/GitHub. Add a password to also login with your email."}
        </p>

        <form onSubmit={handlePasswordSubmit} className="st-password-form">
          <div className="st-form-grid">
            {hasPassword && (
              <div className="st-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  required
                />
              </div>
            )}
            <div className="st-form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />
            </div>
            <div className="st-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
          <div className="st-form-footer">
            <div className="st-msg-area"></div>
            <button type="submit" className="st-btn-primary">
              {hasPassword ? "Update Password" : "Save Password"}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Two-Factor Authentication (2FA) */}
      <div className="st-settings-card st-mt-24">
        <h2 className="st-card-heading">Two-Factor Authentication (2FA)</h2>
        <p className="st-card-desc">
          Add an extra layer of security to your account. When enabled, you will
          need to enter a 6-digit code from your Authenticator app every time
          you log in.
        </p>
        <div className="st-toggle-wrapper">
          <div className="st-toggle-info">
            <h4>Authenticator App</h4>
            <p>
              {is2FAEnabled
                ? "2FA is currently enabled. Your account is secure."
                : "Protect your account by requiring a code from your phone."}
            </p>
          </div>
          {is2FAEnabled ? (
            <button
              type="button"
              className="st-btn-text-danger"
              onClick={() => setIsDisableModalOpen(true)}
            >
              Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleEnable2FA}
              disabled={is2FALoading}
            >
              {is2FALoading ? "Loading..." : "Enable 2FA"}
            </button>
          )}
        </div>
      </div>

      {/* 3. Connected Accounts Section */}
      <div className="st-settings-card st-mt-24">
        <h2 className="st-card-heading">Connected Accounts</h2>
        <p className="st-card-desc">
          Manage your linked social accounts for easy login.
        </p>
        <div className="st-connected-list">
          <div className="st-connected-item">
            <div className="st-connected-info">
              <svg viewBox="0 0 24 24" className="st-social-icon">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </div>
            {user?.googleId ? (
              <button className="st-btn-outline" disabled>
                Connected
              </button>
            ) : (
              <button className="st-btn-outline" onClick={handleConnectGoogle}>
                Connect Now
              </button>
            )}
          </div>

          <div className="st-connected-item">
            <div className="st-connected-info">
              <svg viewBox="0 0 24 24" className="st-social-icon">
                <path
                  fill="#0A0A0B"
                  d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.438.55.1.752-.236.752-.525v-2.05c-3.057.66-3.7-1.32-3.7-1.32-.5-1.27-1.226-1.605-1.226-1.605-1.004-.686.076-.672.076-.672 1.11.078 1.695 1.14 1.695 1.14.986 1.69 2.586 1.202 3.216.92.1-.715.386-1.203.703-1.48-2.44-.278-5.005-1.22-5.005-5.43 0-1.2.43-2.18 1.134-2.95-.115-.278-.492-1.4.107-2.92 0 0 .925-.296 3.03 1.13a10.53 10.53 0 0 1 5.516 0c2.104-1.426 3.028-1.13 3.028-1.13.6 1.52.223 2.642.11 2.92.705.77 1.133 1.75 1.133 2.95 0 4.22-2.57 5.148-5.018 5.42.396.34.749 1.011.749 2.038v3.02c0 .29.2.63.756.523C19.853 20.977 23 16.866 23 12c0-6.077-4.923-11-11-11z"
                />
              </svg>
              <span>GitHub</span>
            </div>
            {user?.githubId ? (
              <button className="st-btn-outline" disabled>
                Connected
              </button>
            ) : (
              <button className="st-btn-outline" onClick={handleConnectGithub}>
                Connect Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="st-settings-card st-mt-24 st-danger-zone">
        <h2 className="st-card-heading">Danger Zone</h2>
        <p className="st-card-desc">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <div className="st-danger-action">
          <div className="st-danger-info">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all associated data.</p>
          </div>
          <button
            className="st-btn-danger-outline"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Modals */}
      <TwoFactorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        qrCodeUrl={qrCodeUrl}
        secret={twoFactorSecret}
        onVerify={handleEnable2FASubmit}
      />

      <Disable2FAModal
        isOpen={isDisableModalOpen}
        onClose={() => setIsDisableModalOpen(false)}
        onDisable={handleDisable2FASubmit}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Account?"
        message="Are you absolutely sure you want to delete your account? This action is permanent."
        onConfirm={handleRequestDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeletingAccount}
      />

      <DeleteVerificationModal
        isOpen={isVerifyModalOpen}
        type={deleteMethod}
        code={verificationCode}
        setCode={setVerificationCode}
        error={deleteError}
        isLoading={isDeletingAccount}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsVerifyModalOpen(false);
          setVerificationCode("");
          setDeleteError("");
        }}
      />
    </div>
  );
};

export default SecurityTab;
