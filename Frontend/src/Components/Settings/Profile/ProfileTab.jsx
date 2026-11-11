import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import ConfirmModal from "../RemoveModalComponent";
import Toast from "../../Toast";
import "./ProfileTab.css";

const ProfileTab = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || "");
      setPhoto(user.photo || "");
    }
  }, [user]);

  // 1. Name Save Handler
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await api.patch("/user/profile", { name: name });
      updateUser(res.data.user);
      setToast({
        isVisible: true,
        message: res.data.message || "Profile updated successfully",
        type: "success",
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        isVisible: true,
        message: "File size should be less than 5MB",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setIsUploading(true);

    try {
      const res = await api.post("/user/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPhoto(res.data.user.photo);
      updateUser(res.data.user);
      setToast({
        isVisible: true,
        message: "Photo updated successfully!",
        type: "success",
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to upload photo",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  // 3. Photo Remove Handler
  const confirmRemovePhoto = async () => {
    setIsRemoving(true);
    try {
      const res = await api.delete("/user/remove-photo");
      setPhoto("");
      updateUser(res.data.user);
      setIsRemoveModalOpen(false);
      setToast({
        isVisible: true,
        message: res.data.message || "Photo removed successfully",
        type: "success",
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: err.response?.data?.message || "Failed to remove photo",
        type: "error",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="pt-tab">
      <div className="pt-page-header">
        <h1 className="pt-page-title">Profile Settings</h1>
        <p className="pt-breadcrumb">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="pt-settings-card">
        <form onSubmit={handleSave} className="pt-profile-form">
          {/* Left Side - Avatar */}
          <div className="pt-avatar-section">
            <div className="pt-avatar-preview">
              {photo && photo.length > 5 ? (
                <img
                  src={photo.replace(/'/g, "")}
                  alt="Profile"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<span>${name ? name.charAt(0).toUpperCase() : "U"}</span>`;
                  }}
                />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
              )}
            </div>

            <div className="pt-avatar-actions">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />

              <button
                type="button"
                className="pt-btn-outline"
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Change Photo"}
              </button>
              <button
                type="button"
                className="pt-btn-text-danger"
                onClick={() => setIsRemoveModalOpen(true)}
              >
                Remove Photo
              </button>
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="pt-form-content">
            <div className="pt-form-row">
              <div className="pt-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="pt-form-group">
                <label>
                  Email Address
                  <span className="pt-verified-badge">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Verified
                  </span>
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="pt-readonly-input"
                />
              </div>
            </div>

            {/* Footer (Button Only) */}
            <div
              className="pt-form-footer"
              style={{ justifyContent: "flex-end" }}
            >
              <button
                type="submit"
                className="pt-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isRemoveModalOpen}
        title="Remove Profile Photo?"
        message="Are you sure you want to remove your profile photo? This action cannot be undone."
        onConfirm={confirmRemovePhoto}
        onCancel={() => setIsRemoveModalOpen(false)}
        isLoading={isRemoving}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default ProfileTab;
