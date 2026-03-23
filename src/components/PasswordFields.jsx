import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordFields = ({ 
  passwordValue = "", 
  confirmPasswordValue = "", 
  onPasswordChange, 
  onConfirmPasswordChange,
  passwordError = "",
  confirmPasswordError = "",
  showLabels = true,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordChange = (e) => {
    if (onPasswordChange) {
      onPasswordChange(e.target.value);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    if (onConfirmPasswordChange) {
      onConfirmPasswordChange(e.target.value);
    }
  };

  return (
    <>
      {/* Password */}
      <div className="relative">
        {showLabels && <label className="block mb-1">Password</label>}
        <input
          type={showPassword ? "text" : "password"}
          value={passwordValue}
          onChange={handlePasswordChange}
          placeholder={showLabels ? "Enter your password" : "Password"}
          className={`w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none pr-10 ${
            passwordError ? 'border-2 border-red-500' : ''
          }`}
          disabled={disabled}
          required
          minLength="6"
        />
        <span
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#a94442]"
          onClick={() => setShowPassword(!showPassword)}
          style={{ top: showLabels ? 'calc(50% + 12px)' : '50%' }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
        {passwordError && (
          <p className="text-red-500 text-xs mt-1">{passwordError}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="relative mt-4">
        {showLabels && <label className="block mb-1">Confirm Password</label>}
        <input
          type={showConfirm ? "text" : "password"}
          value={confirmPasswordValue}
          onChange={handleConfirmPasswordChange}
          placeholder={showLabels ? "Re-enter your password" : "Confirm Password"}
          className={`w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none pr-10 ${
            confirmPasswordError ? 'border-2 border-red-500' : ''
          }`}
          disabled={disabled}
          required
          minLength="6"
        />
        <span
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#a94442]"
          onClick={() => setShowConfirm(!showConfirm)}
          style={{ top: showLabels ? 'calc(50% + 12px)' : '50%' }}
        >
          {showConfirm ? <FaEyeSlash /> : <FaEye />}
        </span>
        {confirmPasswordError && (
          <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
        )}
      </div>
    </>
  );
};

export default PasswordFields;