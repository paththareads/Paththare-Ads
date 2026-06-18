"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import jsPDF from "jspdf";

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

  const downloadPDF = () => {
    const doc = new jsPDF();

    let y = 18;

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const addFooter = (pageNumber: number, totalPages: number) => {
      doc.setDrawColor(220);
      doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);

      doc.setFontSize(8);
      doc.setTextColor(100);

      doc.text(
        "PaththareAds by Hastec Solutions (Pvt) Ltd",
        15,
        pageHeight - 12,
      );

      doc.text("No. XX, Your Address, Colombo, Sri Lanka", 15, pageHeight - 8);

      doc.text(
        "Tel: +94 XX XXX XXXX | www.paththareads.lk",
        15,
        pageHeight - 4,
      );

      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - 35,
        pageHeight - 4,
      );

      doc.setTextColor(0);
    };

    const addSection = (title: string) => {
      y += 3;

      doc.setFillColor(245, 245, 245);
      doc.rect(15, y - 4, 180, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, 18, y + 1);

      y += 8;
    };

    const addPair = (
      label1: string,
      value1: any,
      label2?: string,
      value2?: any,
    ) => {
      doc.setFontSize(9);

      doc.setFont("helvetica", "bold");
      doc.text(label1, 15, y);

      doc.setFont("helvetica", "normal");
      doc.text(String(value1 ?? "-"), 50, y);

      if (label2) {
        doc.setFont("helvetica", "bold");
        doc.text(label2, 110, y);

        doc.setFont("helvetica", "normal");
        doc.text(String(value2 ?? "-"), 145, y);
      }

      y += 6;
    };

    const addParagraph = (title: string, value: any) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(title, 15, y);

      y += 4;

      doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(String(value ?? "-"), 170);

      doc.text(lines, 15, y);

      y += lines.length * 4 + 5;
    };

    // HEADER

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Advertisement Summary", 15, y);

    y += 10;

    doc.setFontSize(10);

    addPair("Reference No", referenceNumber, "Status", "Pending");

    // BASIC INFORMATION

    addSection("Basic Information");

    addPair(
      "Newspaper",
      formData?.selectedNewspaper?.name,
      "Ad Type",
      formData?.adType,
    );

    addPair(
      "Publish Date",
      formData?.publishDate,
      "District",
      formData?.district,
    );

    addPair("Province", formData?.province);

    // ADVERTISEMENT DETAILS

    addSection("Advertisement Details");

    addPair(
      "Background Color",
      String(formData?.backgroundColor),
      "Combined Ad",
      String(formData?.combinedAd),
    );

    addPair("Priority Price", String(formData?.priorityPrice));

    addParagraph("Advertisement Text", formData?.adText);

    addParagraph("Special Notes", formData?.specialNotes);

    // ARTWORK

    addSection("Artwork Options");

    addPair(
      "Has Own Artwork",
      String(formData?.hasOwnArtwork),
      "Need Artwork",
      String(formData?.needArtwork),
    );

    // LANGUAGE

    addSection("Language Selection");

    // addPair("Combine Selected", String(formData?.userLangCombineSelected));

    if (formData.userLangCombineSelected) {
      addPair(
        "Tamil",
        String(formData?.userLangCombineSelected_Tam),
        "English",
        String(formData?.userLangCombineSelected_Eng),
      );

      addPair(
        "Sinhala",
        String(formData?.userLangCombineSelected_Sin),
        "Sin + Eng",
        String(formData?.userLangCombineSelected_Sin_Eng),
      );

      addPair(
        "Sin + Tam",
        String(formData?.userLangCombineSelected_Sin_Tam),
        "Eng + Tam",
        String(formData?.userLangCombineSelected_Eng_Tam),
      );
    }

    // PRINT & LAYOUT

    addSection("Print & Layout");

    addPair(
      "CO Paper",
      String(formData?.userCOPaper),
      "B/W",
      String(formData?.userIntBW),
    );

    addPair(
      "Full Color",
      String(formData?.userIntFC),
      "Highlight",
      String(formData?.userIntHighlight),
    );

    if (formData.adType === "casual") {
      addPair(
        "Columns",
        formData?.noOfColumns,
        "Ad Height",
        formData?.adHeight,
      );

      addPair(
        "Color Option",
        formData?.colorOption,
        "Ad Size Type",
        formData?.adSizeType,
      );

      addPair("Box Type", formData?.boxType);
    }

    // VEHICLE

    if (formData.classifiedCategory === "Automobile") {
      addSection("Vehicle Information");

      addPair(
        "Brand",
        formData?.vehicle_brand,
        "Vehicle Type",
        formData?.vehicleType,
      );

      addPair("Year", formData?.vehicleYear);
    }

    // ADVERTISER

    addSection("Advertiser Details");

    addPair(
      "Name",
      formData?.advertiserName,
      "Phone",
      formData?.advertiserPhone,
    );

    addPair("NIC", formData?.advertiserNIC, "Email", formData?.advertiserEmail);

    addParagraph("Address", formData?.advertiserAddress);

    addParagraph("Postal Address", formData?.advertiserPostalAddress);

    // TRACKING

    addSection("Track Advertisement");

    doc.setTextColor(0, 102, 204);

    doc.textWithLink("Click Here To Track Your Advertisement", 15, y, {
      url: `https://www.paththareads.lk${cleanedLink}`,
    });

    doc.setTextColor(0);

    // FOOTERS

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    doc.save(`Advertisement_PaththareAds_RefNo-${referenceNumber}.pdf`);
  };

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
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center text-center justify-center min-w-[200px] gap-2 rounded-lg border border-[var(--color-primary-dark)] px-4 py-2 text-sm font-medium text-black shadow-md transition-all hover:scale-105 hover:shadow-lg"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                View Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                View Full Summary
              </>
            )}
          </button>

          <button
            onClick={downloadPDF}
            className="inline-flex items-center text-center justify-center min-w-[200px] gap-2 rounded-lg bg-[var(--color-orange-accent)] px-4 py-2 text-sm font-medium text-[var(--color-primary-dark)] shadow-md transition-all hover:scale-105 hover:shadow-lg"
          >
            <Download size={16} />
            Download PDF
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
