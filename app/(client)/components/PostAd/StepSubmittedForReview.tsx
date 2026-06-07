"use client";

import { useEffect, useState } from "react";

interface StepSubmittedForReviewProps {
  formData: any;
  referenceNumber: string;
  trackingLink?: string; // optional for safety
}

export default function StepSubmittedForReview({
  formData,
  referenceNumber,
  trackingLink,
}: StepSubmittedForReviewProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cleanedLink = trackingLink
    ? trackingLink.replace(/^(https?:\/\/)?[^/]+\/?/, "")
    : trackingLink;

  console.log(cleanedLink);
  console.log(trackingLink);

  const [expanded, setExpanded] = useState(false);

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-5">
      <h3
        className="text-sm font-semibold mb-2"
        style={{ color: "var(--color-primary)" }}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
        {children}
      </div>
    </div>
  );

  const Item = ({ label, value }: { label: string; value: any }) => (
    <p>
      <span className="font-medium text-gray-500">{label}: </span>
      <span className="text-[var(--color-text)]">{value ?? "-"}</span>
    </p>
  );

  return (
    <div className="text-center p-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-green-700 mb-4">
        🎉 Your ad has been submitted successfully!
      </h2>
      <div className=" w-full md:w-1/2  border border-gray-300 rounded-lg inline-block px-6 py-4 mb-4 bg-white shadow-sm transition-all duration-300">
        {/* Header */}
        <div className="flex justify-center items-center mb-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-primary-dark)" }}
          >
            Advertisement Summary
          </h2>
        </div>
        <div className="flex justify-end items-center mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium px-3 py-1 rounded-md transition text-primary"
            // style={{
            //   backgroundColor: "var(--color-primary-accent)",
            //   color: "white",
            // }}
          >
            {expanded ? "View Less" : "View All"}
          </button>
        </div>

        {/* Always Visible (Quick Info) */}
        <Section title="Basic Information">
          <Item label="Newspaper" value={formData?.selectedNewspaper?.name} />
          <Item label="Ad Type" value={formData?.adType} />
          <Item label="Publish Date" value={formData?.publishDate} />
          <Item label="District" value={formData?.district} />
          <Item label="Province" value={formData?.province} />
        </Section>

        {/* Expandable Content */}
        {expanded && (
          <>
            <Section title="Advertisement Details">
              <Item label="Ad Text" value={formData?.adText} />
              <Item
                label="Background Color"
                value={String(formData?.backgroundColor)}
              />
              <Item label="Combined Ad" value={String(formData?.combinedAd)} />
              <Item
                label="Priority Price"
                value={String(formData?.priorityPrice)}
              />
              <Item label="Special Notes" value={formData?.specialNotes} />
            </Section>

            <Section title="Artwork Options">
              <Item
                label="Has Own Artwork"
                value={String(formData?.hasOwnArtwork)}
              />
              <Item
                label="Need Artwork"
                value={String(formData?.needArtwork)}
              />
            </Section>

            <Section title="Language Selection">
              <Item
                label="Combine Selected"
                value={String(formData?.userLangCombineSelected)}
              />
              {formData.userLangCombineSelected && (
                <>
                  <Item
                    label="Tamil"
                    value={String(formData?.userLangCombineSelected_Tam)}
                  />
                  <Item
                    label="English"
                    value={String(formData?.userLangCombineSelected_Eng)}
                  />
                  <Item
                    label="Sinhala"
                    value={String(formData?.userLangCombineSelected_Sin)}
                  />
                  <Item
                    label="Sinhala + English"
                    value={String(formData?.userLangCombineSelected_Sin_Eng)}
                  />
                  <Item
                    label="Sinhala + Tamil"
                    value={String(formData?.userLangCombineSelected_Sin_Tam)}
                  />
                  <Item
                    label="English + Tamil"
                    value={String(formData?.userLangCombineSelected_Eng_Tam)}
                  />
                </>
              )}
            </Section>

            <Section title="Print & Layout">
              <Item label="CO Paper" value={String(formData?.userCOPaper)} />
              <Item label="B/W" value={String(formData?.userIntBW)} />
              <Item label="Full Color" value={String(formData?.userIntFC)} />
              <Item
                label="Highlight"
                value={String(formData?.userIntHighlight)}
              />
              {formData.adType === "casual" && (
                <>
                  <Item label="Columns" value={formData?.noOfColumns} />
                  <Item label="Ad Height" value={formData?.adHeight} />
                  <Item label="Color Option" value={formData?.colorOption} />
                  <Item label="Ad Size Type" value={formData?.adSizeType} />
                  <Item label="Box Type" value={formData?.boxType} />
                </>
              )}
            </Section>

            {formData.classifiedCategory === "Automobile" && (
              <>
                <Section title="Vehicle Information">
                  <Item label="Brand" value={formData?.vehicle_brand} />
                  <Item label="Vehicle Type" value={formData?.vehicleType} />
                  <Item label="Year" value={formData?.vehicleYear} />
                </Section>
              </>
            )}

            <Section title="Advertiser Details">
              <Item label="Name" value={formData?.advertiserName} />
              <Item label="Address" value={formData?.advertiserAddress} />
              <Item
                label="Postal Address"
                value={formData?.advertiserPostalAddress}
              />
              <Item label="Phone" value={formData?.advertiserPhone} />
              <Item label="NIC" value={formData?.advertiserNIC} />
              <Item label="Email" value={formData?.advertiserEmail} />
            </Section>
          </>
        )}
      </div>

      <p className="text-basline mb-4">
        You can now track its progress using your reference number below.
      </p>

      <div className="border border-gray-300 rounded-lg px-6 py-4 mb-4 bg-white">
        <p className="text-gray-600 font-medium">Reference Number:</p>
        <p className="text-2xl font-bold text-primary-dark">
          {referenceNumber}
        </p>
      </div>

      <p className="text-gray-700 text-lg">
        <span className="font-semibold">Status:</span> Pending
      </p>

      {/* ✅ Show this section only if trackingLink exists */}
      {trackingLink ? (
        <p className="text-gray-700 pt-5 break-all">
          <span className="font-semibold">
            Click on this link to track your progress:
          </span>
          <br />
          <a
            href={cleanedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {cleanedLink}
          </a>
          <br />
          <span>Check your Messages for the link.</span>
        </p>
      ) : (
        <p className="text-gray-500 italic pt-5">
          Tracking link will be available soon.
        </p>
      )}
    </div>
  );
}
