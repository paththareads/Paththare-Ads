"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import newspaperData from "../../../data/newspaper_data.json"; // adjust path
import { sendSMS } from "@/lib/sendSms";
import { buildAdSubmitSMS } from "@/lib/buildSmsMessage";
import prisma from "@/lib/prisma";

type AdData = {
  reference_number: string;
  status: string;
  created_at: string;
  advertisement_text: string;
  attempts: number;
  review_history: any[];
  upload_image: string;
  price?: number | null;
  latest_price_change?: {
    requested_price: number;
    old_price: number;
    reason: string;
    status: string;
    created_at: string;
  } | null;
};

export default function TrackAdClient({ reference }: { reference: string }) {
  const search = useSearchParams();
  const token = search?.get("t") ?? "";
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state for edits
  const [editableText, setEditableText] = useState("");
  const [newImage, setNewImage] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [maxWords, setMaxWords] = useState<number | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [adminNumber, setAdminNumber] = useState("");

  // const adminNumber = "+94770400185";
  useEffect(() => {
    const fetchAdminPhone = async () => {
      try {
        const res = await fetch("/api/admin/phone");
        const data = await res.json();
        setAdminNumber(data.phone || "");
      } catch (err) {
        console.error("Failed to fetch admin phone:", err);
      }
    };

    fetchAdminPhone();
  }, []);
  const referenceNumber = reference;

  useEffect(() => {
    if (!token) {
      setError("Missing token in URL.");
      return;
    }
    fetchAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, token]);

  async function fetchAd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?ref=${reference}&t=${token}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Unable to fetch ad");
        setLoading(false);
        return;
      }
      const addata = data.ad;
      setAd(addata);
      setEditableText(addata.advertisement_text || "");
      setIsEdited(false);

      // set attempts and expiry: expiry = 7 days from latest updated_at in review_history or ad created_at
      let latestDate = addata.created_at
        ? new Date(addata.created_at)
        : new Date();
      if (addata.review_history && addata.review_history.length) {
        const d = new Date(
          addata.review_history[0].updated_at ??
            addata.review_history[0].created_at,
        );
        if (d > latestDate) latestDate = d;
      }
      const exp = new Date(latestDate);
      exp.setDate(exp.getDate() + 7);
      setExpiry(exp.toISOString().slice(0, 10));

      console.log("Ad max words here ", addata.ad_types.max_words);

      setMaxWords(addata.ad_types.max_words);
      // try {
      //   const keys = Object.keys(newspaperData as any);
      //   if (addata.ad_type && keys.includes(addata.ad_type)) {
      //     const conf = (newspaperData as any)[addata.ad_type];
      //     const t = (conf?.typeofAd && Object.keys(conf.typeofAd)[0]) || null;
      //     setMaxWords(t ? conf.typeofAd[t].maxWords : null);
      //   } else {
      //     const first = (newspaperData as any)[keys[0]];
      //     setMaxWords(first.typeofAd?.classified?.maxWords ?? null);
      //   }
      // } catch (e) {
      //   setMaxWords(null);
      // }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  }

  function countWords(s: string) {
    if (!s) return 0;
    return s.trim().split(/\s+/).filter(Boolean).length;
  }

  function onTextChange(v: string) {
    if (!maxWords) {
      setEditableText(v);
      setIsEdited(v.trim() !== (ad?.advertisement_text ?? "").trim());
      return;
    }

    const words = v.trim().split(/\s+/).filter(Boolean);

    if (words.length <= maxWords) {
      setEditableText(v);
    } else {
      // Trim to maxWords
      const trimmed = words.slice(0, maxWords).join(" ");
      setEditableText(trimmed);
    }

    setIsEdited(v.trim() !== (ad?.advertisement_text ?? "").trim());
  }

  async function handleResubmit() {
    if (!isEdited && !newImage) {
      return alert("Edit the text or upload a new image before resubmitting.");
    }

    const res = await fetch(`/api/ads/${reference}/resubmit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        newText: editableText !== ad?.advertisement_text ? editableText : null,
        upload_image: newImage || null,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Resubmitted successfully.");
      fetchAd();
    } else alert(data.error || "Failed");
  }

  const updateStatus = async (
    status: string,
    message: string,
    errMessage: string,
  ) => {
    const res = await fetch(`/api/ads/updateStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_number: reference,
        status,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setAlertMessage(errMessage + (result.error || "Unknown error"));
      return;
    }

    setAlertMessage(message);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  async function handleConfirm() {
    if (isEdited)
      return alert(
        "Cannot confirm while you edited text. Use Resubmit or revert.",
      );

    try {
      setIsProcessing(true);

      const res = await fetch(`/api/ads/${reference}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.ok) {
        updateStatus(
          "PaymentPending",
          "Confirmed and approved. Thank you!",
          "Error!",
        );
        fetchAd();
      } else {
        alert(data.error || "Failed to confirm");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this ad?")) return;
    const res = await fetch(`/api/ads/${reference}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Ad cancelled successfully.");
      let to = "admin";
      let status = "Cancelled";
      const trackingLink = "-";
      const smsMessageUser = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });

      await sendSMS({
        to: adminNumber,
        message: smsMessageUser ?? "",
      });
      fetchAd();
    } else {
      alert(data.error || "Failed to cancel ad.");
    }
  }

  async function handlePayment() {
    try {
      setIsProcessing(true);

      // small delay ensures React renders the overlay before redirect
      setTimeout(() => {
        window.location.href = `/payment/${reference}?t=${token}`;
      }, 100);
    } catch (err) {
      setIsProcessing(false);
      alert("Failed to initiate payment.");
    }
  }

  async function uploadImageToCloudinary(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    return res.json();
  }

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  function TrackAdSkeleton() {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-10 my-12 bg-white rounded-2xl shadow-lg border border-gray-100 animate-pulse">
        {/* Title */}
        <div className="h-8 w-2/3 mx-auto bg-gray-200 rounded mb-12" />

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full" />
          ))}
          <div className="h-4 bg-gray-200 rounded w-3/4 sm:col-span-2" />
        </div>

        {/* Textarea */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-44 bg-gray-200 rounded-xl" />
          <div className="h-3 w-3/4 bg-gray-200 rounded mt-4 mx-auto" />
        </div>

        {/* Admin revision block */}
        <div className="mb-6 p-4 rounded-lg bg-gray-100">
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
          <div className="h-3 w-full bg-gray-200 rounded mb-2" />
          <div className="h-3 w-5/6 bg-gray-200 rounded mb-4" />
          <div className="h-9 w-48 bg-gray-200 rounded-lg" />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-36 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (loading) return <TrackAdSkeleton />;
  if (!ad) return <div className="p-8"></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-10 my-12 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-12 text-gray-800">
        Advertisement Progress Tracker
      </h1>
      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 text-gray-700">
        <p>
          <strong>Reference:</strong> {ad.reference_number}
        </p>
        <p>
          <strong>Status:</strong>
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-normal ${
              ad.status === "Approved"
                ? "bg-green-100 text-green-700"
                : ad.status === "Pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : ad.status === "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
            }`}
          >
            {ad.status}
          </span>
        </p>
        <p>
          <strong>Posted:</strong> {new Date(ad.created_at).toLocaleString()}
        </p>
        <p>
          <strong>Attempts:</strong> {ad.attempts}
        </p>
        <p className="sm:col-span-2">
          <strong>Resubmit Expiry (7 days):</strong> {expiry}
        </p>
      </div>
      {/* Textarea */}
      {["Pending", "Revision", "Resubmitted", "UpdateImage"].includes(
        ad.status,
      ) && (
        <>
          <div className="mb-6">
            <div className="flex justify-between">
              <label className="font-semibold text-gray-800 block mb-2">
                Revised Text
              </label>
              {maxWords && (
                <div
                  className={`text-sm mt-1 ${
                    countWords(editableText) > maxWords
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {countWords(editableText)} / {maxWords} words
                </div>
              )}
            </div>
            <textarea
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-gray-800 transition-all resize-y min-h-[180px]"
              value={editableText}
              disabled={
                !["Pending", "Revision", "Resubmitted", "UpdateImage"].includes(
                  ad.status,
                )
              }
              onChange={(e) => onTextChange(e.target.value)}
              rows={8}
              placeholder="Edit your advertisement text here..."
            />

            {ad.status === "UpdateImage" && (
              <div>
                <label className="block font-medium mb-1">
                  Upload Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      const data = await uploadImageToCloudinary(file);

                      setNewImage(data.secure_url);
                      setIsEdited(true); // 🔑 allow resubmit even if text unchanged
                    } catch (error) {
                      console.error(error);
                      alert("Image upload failed. Please try again.");
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-accent"
                />
              </div>
            )}

            <div>
              <p id="placeholder_" className="text-sm text-center">
                (You can edit your advertisement here. Note that if you edit the
                advertisement, then it must be resubmitted to get approved)
              </p>
            </div>
          </div>
          {/* Admin Revision */}
          {ad.review_history?.[0]?.requested_revision_text && (
            <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-900 mb-2">
                Requested revision from admin:
              </p>
              <p className="text-gray-800 whitespace-pre-wrap mb-3">
                {ad.review_history[0].requested_revision_text}
              </p>
              <button
                onClick={() => {
                  setEditableText(ad.review_history[0].requested_revision_text);
                  setIsEdited(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Apply Admin Suggestion
              </button>
            </div>
          )}{" "}
        </>
      )}

      {ad.status === "Approved" && ad.price != null && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-baseline text-green-700">
            Your advertisement has been approved. Kindly Proceed with Payment.
          </p>
          <p className="text-xl font-bold text-green-800">
            Total Amount: LKR{" "}
            {ad.latest_price_change
              ? ad.latest_price_change.requested_price.toLocaleString()
              : ad.price}
          </p>
        </div>
      )}
      {ad.status === "PaymentDone" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-baseline text-green-700">
            Your payment information has been received. Kindly wait until we
            verify the payment.
          </p>
          {/* <p className="text-xl font-bold text-green-800">
            Total Amount: LKR{" "}
            {ad.latest_price_change
              ? ad.latest_price_change.requested_price.toLocaleString()
              : ad.price}
          </p> */}
        </div>
      )}
      {ad.latest_price_change && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold mb-1">
            Initial Price:{" "}
            <span className="font-normal">
              {ad.latest_price_change.old_price.toLocaleString()}
            </span>
          </p>

          <p className="text-lg font-bold text-yellow-900">
            Requested Price Change: LKR{" "}
            {ad.latest_price_change.requested_price.toLocaleString()}
          </p>

          <p className="mt-2 text-sm text-gray-700">
            <strong>Reason:</strong> {ad.latest_price_change.reason}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Requested on{" "}
            {new Date(ad.latest_price_change.created_at).toLocaleString()}
          </p>

          {/* <span
            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
              ad.latest_price_change.status === "Pending"
                ? "bg-yellow-200 text-yellow-900"
                : ad.latest_price_change.status === "Approved"
                  ? "bg-green-200 text-green-900"
                  : "bg-red-200 text-red-900"
            }`}
          >
            {ad.latest_price_change.status}
          </span> */}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {[
          "Pending",
          "Revision",
          "Resubmitted",
          "UpdateImage",
          "PriceChange",
        ].includes(ad.status) && (
          <button
            onClick={handleResubmit}
            disabled={!isEdited}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              isEdited
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Resubmit
          </button>
        )}

        {["Revision", "PriceChange"].includes(ad.status) && (
          <button
            onClick={handleConfirm}
            disabled={isEdited}
            title={isEdited ? "Revert edits to enable Confirm" : ""}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              !isEdited
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        )}

        {[
          "Revision",
          "Pending",
          "Approved",
          "Resubmitted",
          "UpdateImage",
          "PriceChange",
          "PaymentPending",
        ].includes(ad.status) && (
          <button
            onClick={handleCancel}
            disabled={ad.status === "Cancelled"}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              ad.status === "Cancelled"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
            }`}
          >
            Cancel Ad
          </button>
        )}

        {(ad.status === "Approved" || ad.status === "PaymentPending") && (
          <button
            onClick={handlePayment}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm sm:text-base font-medium transition-all shadow-sm"
          >
            Proceed to Payment
          </button>
        )}

        {/* 🆕 Close Button */}
        {[
          "Revision",
          "Pending",
          "Approved",
          "Resubmitted",
          "Cancelled",
          "Print",
          "PaymentPending",
          "UpdateImage",
          "PriceChange",
        ].includes(ad.status) && (
          <button
            onClick={() => window.close()}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm sm:text-base font-medium transition-all shadow-sm"
          >
            Close
          </button>
        )}
      </div>

      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-[var(--color-primary-dark)] p-6 w-80 text-white shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Notice</h2>

            <p className="mb-6 text-sm">{alertMessage}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setAlertMessage(null)}
                className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)] transition hover:brightness-110"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[var(--color-primary-dark)] text-white rounded-xl p-6 w-80 shadow-xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>

            <h2 className="text-lg font-semibold mb-2">Processing...</h2>

            <p className="text-sm opacity-90">
              Please wait while we confirm your advertisement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
