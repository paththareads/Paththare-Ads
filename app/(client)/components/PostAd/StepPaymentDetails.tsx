"use client";

import { useState, useEffect } from "react";

interface StepPaymentDetailsProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export default function StepPaymentDetails({
  formData,
  updateFormData,
}: StepPaymentDetailsProps) {
  // ✅ Default to "bank-transfer" if no value provided
  const [paymentMethod, setPaymentMethod] = useState<
    "online" | "bank-transfer"
  >(formData.paymentMethod || "bank-transfer");

  // Ensure formData syncs if changed externally
  useEffect(() => {
    if (!formData.paymentMethod) {
      updateFormData({ paymentMethod: "bank-transfer" });
    }
  }, []);

  const handlePaymentChange = (method: "online" | "bank-transfer") => {
    setPaymentMethod(method);
    updateFormData({ paymentMethod: method });
  };

  const handleChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl md:text-3xl font-bold text-center">
        Payment Details
      </h2>

      {/* Payment Method Selection */}
      <div className="flex justify-center gap-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="bank-transfer"
            checked={paymentMethod === "bank-transfer"}
            onChange={() => handlePaymentChange("bank-transfer")}
            className="accent-primary-accent"
          />
          <span className="font-medium">Bank Transfer</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer opacity-60">
          <input
            type="radio"
            name="paymentMethod"
            value="online"
            checked={paymentMethod === "online"}
            onChange={() => handlePaymentChange("online")}
            className="accent-primary-accent"
            disabled
          />
          <span className="font-medium">Online</span>
        </label>
      </div>

      {/* Payment Section */}
      <div className="md:w-2/3 mx-auto flex flex-col gap-8 border border-gray-200 rounded-2xl p-6 shadow-sm bg-white">
        {paymentMethod === "online" ? (
          <>
            <h3 className="text-xl font-semibold mb-2 text-center text-primary-accent">
              Secure Online Payment
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Please provide your card details to complete payment securely.
            </p>

            {/* Name on Card */}
            <div>
              <label className="block mb-2 font-medium">Name on Card *</label>
              <input
                type="text"
                value={formData.cardName || ""}
                onChange={(e) => handleChange("cardName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 
                           focus:ring-2 focus:ring-primary-accent"
                placeholder="As printed on your card"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block mb-2 font-medium">Card Number *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={19}
                value={formData.cardNumber || ""}
                onChange={(e) => handleChange("cardNumber", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 
                           focus:ring-2 focus:ring-primary-accent"
                placeholder="XXXX XXXX XXXX XXXX"
              />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Expiry Date *</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={formData.expiryDate || ""}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 
                             focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">CVV *</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={formData.cvv || ""}
                  onChange={(e) => handleChange("cvv", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 
                             focus:ring-2 focus:ring-primary-accent"
                  placeholder="***"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Your payment is processed securely with end-to-end encryption.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-2 text-center text-primary-accent">
              Bank Transfer Details
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-800">
                Bank: <span className="font-normal">Commercial Bank</span>
              </p>
              <p className="font-medium text-gray-800">
                Branch: <span className="font-normal">Colombo Main</span>
              </p>
              <p className="font-medium text-gray-800">
                Account Name:{" "}
                <span className="font-normal">Paththare Ads Pvt Ltd</span>
              </p>
              <p className="font-medium text-gray-800">
                Account Number:{" "}
                <span className="font-normal">123456789012</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Please include your name and advertisement reference number as
                the payment reference.
              </p>
            </div>

            {/* Upload Bank Slip */}
            <div>
              <label className="block mb-2 font-medium">
                Upload Bank Slip *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  handleChange("bankSlip", e.target.files?.[0]?.name || "")
                }
                className="w-full border border-gray-300 rounded-lg p-3 
                           focus:ring-2 focus:ring-primary-accent file:mr-4 file:py-2 file:px-4 
                           file:rounded-full file:border-0 file:bg-primary-accent file:text-white 
                           file:cursor-pointer hover:file:bg-primary-accent/90"
              />
              {formData.bankSlip && (
                <p className="text-sm text-gray-500 mt-2">
                  Uploaded: {formData.bankSlip}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
