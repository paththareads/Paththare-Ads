"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Mail, X } from "lucide-react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Printer,
  Image as ImageIcon,
} from "lucide-react";
import prisma from "@/lib/prisma";

interface Advertisement {
  reference_number: string;

  newspaper_name: string;
  language?: string;
  id?: string;
  publisher_email?: string | "";

  advertiser_name: string;
  advertiser_nic?: string;
  advertiser_phone?: string;
  advertiser_address?: string;

  ad_type: string;
  classified_category?: string;
  subcategory?: string;
  count_first_words?: number | null;

  publish_date?: string | null;
  created_at: string;
  updated_at?: string | null;

  advertisement_text: string;
  special_notes?: string | null;

  background_color?: boolean | null;
  post_in_web?: boolean | null;
  upload_image?: string | null;
  uploaded_images?: string[] | null;

  price?: number | null;
  updated_price?: number | null;
  status: string;
  print_url: string;
  is_read: boolean;

  casual_ad?: {
    ad_size: string;
    no_of_columns: number;
    ad_height: number;
    color_option: string;
    has_artwork: boolean;
    need_artwork: boolean;
    no_of_boxes: number;
    section?: {
      id: number;
      name: string;
      extra_notes?: string | null;
      supports_box_ads: boolean;
      max_boxes?: number | null;
    } | null;
  } | null;

  classified_ad?: {
    is_publish_eng: boolean | false;
    is_publish_tam: boolean;
    is_priority: boolean;
    is_publish_sin: boolean;
    is_publish_sin_eng: boolean;
    is_publish_sin_tam: boolean;
    is_publish_eng_tam: boolean;
    is_co_paper: boolean;
    is_int_bw: boolean;
    is_int_fc: boolean;
    is_int_highlight?: boolean; // only exists in set 1
    district?: string;
    province?: string;
    vehicle_brand?: string;
  } | null;

  payment?: {
    amount?: number | null;
    status?: string | null;
    payment_date?: string | null;
    verified_by?: string | null;
    remarks?: string | null;
    file_path: string | null;
    original_filename?: string | null;
    created_at: string;
  } | null;
}

export async function uploadPrintedBlobToCloudinary(file: File | Blob) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  );
  formData.append("folder", "printed"); // 👈 store inside "printed" folder

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url as string; // 👈 this will be your print_url
}

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [requestPriceChange, setRequestPriceChange] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [priceReason, setPriceReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 15;

  const [requestImageChange, setRequestImageChange] = useState(false);
  const [selectedAds, setSelectedAds] = useState<Advertisement[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string | "">("");
  const [differentPublisher, setdifferentPublisher] = useState<Boolean>(false);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [printing, setPrinting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editableAd, setEditableAd] = useState<Advertisement | null>(null);
  const [editMode, setEditMode] = useState(false);

  const isChanged = JSON.stringify(selectedAd) !== JSON.stringify(editableAd);

  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [showAttachmentPrompt, setShowAttachmentPrompt] = useState(false);
  const [showPDFViewPrompt, setshowPDFViewPrompt] = useState(false);
  const [showAttachmentView, setShowAttachmentView] = useState(false);

  const [showReprintPrompt, setShowReprintPrompt] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachmentData | undefined
  >();

  const [publisherName, setPublisherName] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublisher = async () => {
      if (!editableAd?.newspaper_name) return;

      const newspaper_id = editableAd.newspaper_name
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

      try {
        const res = await fetch(
          `/api/ads/agency/getByNewspaper?newspaper_id=${newspaper_id}`,
        );

        const data = await res.json();

        setPublisherName(data.publisher_name);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPublisher();
  }, [editableAd]);

  type AttachmentData = {
    customizeType: boolean;
    customizeColor: boolean;
    customizeSize: boolean;
    noInsertions: string;
    size: string;
    color: string;
    isPhotoClassified: boolean;
    classifiedType: "normal" | "photo" | null;
    colorType: "full" | "bw" | "bw1" | "bw2" | null;
    adminNotes: string;

    //wijeya
    classification: string;
    isCarsOthers: "c" | "o" | null;
    specialPosition: string;

    //associated
    isCO: boolean;
    classification2: string;
    page: string;
    position: string;
    hasPhoto: boolean;

    changedText: string;
  };

  const [attachments, setAttachments] = useState<AttachmentData>({
    customizeType: false,
    customizeColor: false,
    customizeSize: false,
    noInsertions: "0",
    size: "",
    color: "",
    isPhotoClassified: false,
    classifiedType: null,
    colorType: null,
    adminNotes: "",

    classification: "",
    isCarsOthers: null,
    specialPosition: "",

    isCO: false,
    classification2: "",
    page: "",
    position: "",
    hasPhoto: false,
    changedText: "",
  });

  const ACTION_BTN_CLASS =
    "flex items-center justify-center gap-2 w-50 px-4 py-2.5 rounded-lg shadow text-sm font-medium transition";

  // Fetch ads
  useEffect(() => {
    const fetchAds = async (showLoader = false) => {
      try {
        if (showLoader) setLoading(true);

        const res = await fetch("/api/ads");
        const data = await res.json();

        setAds(data);
        setFilteredAds(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoader) setLoading(false);
      }
    };

    // Show loader only on first load
    fetchAds(true);

    const interval = setInterval(() => {
      fetchAds(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filtering + sorting
  useEffect(() => {
    let updated = ads.filter((ad) => {
      const matchesSearch =
        ad.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        ad.newspaper_name.toLowerCase().includes(search.toLowerCase()) ||
        ad.advertiser_name.toLowerCase().includes(search.toLowerCase()) ||
        ad.status.toLowerCase().includes(search.toLowerCase());

      const createdDate = new Date(ad.created_at);

      const fromValid = dateFrom ? createdDate >= new Date(dateFrom) : true;
      const toValid = dateTo ? createdDate <= new Date(dateTo) : true;

      const statusValid =
        statusFilter === "all"
          ? true
          : ad.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && fromValid && toValid && statusValid;
    });

    updated.sort((a, b) => {
      if (sortKey === "created_at") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const aValue = String(a[sortKey as keyof Advertisement] ?? "");
      const bValue = String(b[sortKey as keyof Advertisement] ?? "");

      return aValue.localeCompare(bValue);
    });

    setFilteredAds(updated);
  }, [search, ads, sortKey, dateFrom, dateTo, statusFilter]);

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);

  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const openModal = async (ad: Advertisement) => {
    setSelectedAd(ad);
    console.log(ad);

    setEditedText(ad.advertisement_text);
    setOriginalText(ad.advertisement_text);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAd(null);
    setIsModalOpen(false);
  };

  const updateStatus = async (status: string) => {
    if (!selectedAd) return;

    const res = await fetch(`/api/ads/updateStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_number: selectedAd.reference_number,
        status,
        advertisement_text: editedText,
        old_price: selectedAd.price,
        price_change: requestPriceChange
          ? {
              new_price: Number(newPrice),
              reason: priceReason,
            }
          : null,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("Failed to update ad: " + (result.error || "Unknown error"));
      return;
    }

    alert("Advertisement updated successfully!");
    closeModal();

    const refreshed = await fetch("/api/ads");
    const data = await refreshed.json();
    setAds(data);
  };

  function blobToFile(blob: Blob, filename: string) {
    return new File([blob], filename, { type: blob.type });
  }

  // Check if text changed
  const isTextChanged = editedText.trim() !== originalText.trim();
  const statusColorHandler = (status_: string) => {
    switch (status_) {
      case "Approved":
        return "text-green-600";
      case "Declined":
        return "text-gray-600";
      case "Resubmitted":
        return "text-blue-600";
      case "Revision":
        return "text-fuchsia-800";
      case "PaymentPending":
        return "text-amber-600";
      case "Pending":
        return "text-red-700 font-bold";
      case "Print":
        return "text-violet-950";
      default:
        return "text-black-900";
    }
  };

  function InfoRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-800">{value}</p>
      </div>
    );
  }

  const EditableInfoRow = ({ label, value, onChange, editable }: any) => (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>

      {editable ? (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      ) : (
        <p className="font-medium">{value || "-"}</p>
      )}
    </div>
  );

  const formatDateYMD = (dateStr: string) => {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${year}-${month}-${day}`;
  };

  const formatColorType = (value: string): string => {
    switch (value?.toLowerCase()) {
      case "full":
        return "F/C";
      case "bw":
        return "BW";
      case "bw1":
        return "BW+1 color";
      case "bw2":
        return "BW+2 colors";
      default:
        return value; // fallback (safe)
    }
  };

  const toggleSelectAd = (ad: Advertisement) => {
    // if (
    //   ad.status?.toLowerCase() !== "print" ||
    //   ad.status?.toLowerCase() !== "sent to print"
    // ) {
    //   return; // safety guard
    // }

    const isAlreadySelected = selectedAds.some(
      (a) => a.reference_number === ad.reference_number,
    );

    // If first selection → set publisher
    if (!selectedPublisher) {
      setSelectedPublisher(ad.publisher_email ?? "");
      setSelectedAds([ad]);
      return;
    }

    // Restrict different publisher
    if (ad.publisher_email !== selectedPublisher) {
      // alert("You can only select ads from the same publisher.");
      setdifferentPublisher(true);
      return;
    }

    // Toggle logic
    if (isAlreadySelected) {
      const updated = selectedAds.filter(
        (a) => a.reference_number !== ad.reference_number,
      );

      setSelectedAds(updated);

      // If empty → reset publisher lock
      if (updated.length === 0) {
        setSelectedPublisher("");
      }
    } else {
      setSelectedAds([...selectedAds, ad]);
    }
  };

  const handlePrintRequest = (extraData?: AttachmentData) => {
    console.log(editableAd);
    if (!editableAd) return;

    // Check if PDF already exists
    if (editableAd.print_url) {
      setPendingAttachments(extraData);
      setShowReprintPrompt(true);
      return;
    }

    // No existing PDF -> continue normally
    handlePrint(extraData);
  };

  // print function
  const handlePrint = async (extraData?: AttachmentData) => {
    // console.log(selectedAd);
    // if (!selectedAd) return;
    // setPrinting(true);

    console.log(editableAd);
    if (!editableAd) return;
    setPrinting(true);
    setIsProcessing(true);

    // Trim + split by ONE OR MORE SPACES
    const words = editableAd.advertisement_text.trim().split(/\s+/); // space-separated words

    const wordCount = editableAd.classified_ad?.is_priority
      ? words.length - 1
      : words.length;

    const res = await fetch("/api/ads/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        /* ---------------- Core identifiers ---------------- */
        reference_number: editableAd.reference_number,
        newspaper_name: editableAd.newspaper_name,
        language: editableAd.language,

        newspaper_id: editableAd.newspaper_name
          ?.trim()
          .toUpperCase()
          .replace(/\s+/g, "_"),

        /* ---------------- Advertiser details ---------------- */
        advertiser_name: editableAd.advertiser_name,
        advertiser_nic: editableAd.advertiser_nic ?? null,
        advertiser_phone: editableAd.advertiser_phone ?? null,
        advertiser_address: editableAd.advertiser_address ?? null,

        /* ---------------- Ad classification ---------------- */
        ad_type: editableAd.ad_type,
        category: editableAd.classified_category ?? null,
        subcategory:
          editableAd.ad_type === "name_notice"
            ? "310"
            : (editableAd.subcategory ?? null),
        count_first_words: editableAd.count_first_words ?? null,

        /* ---------------- Dates ---------------- */
        publish_date: formatDateYMD(
          editableAd.publish_date ? editableAd.publish_date : "",
        ),
        created_at: editableAd.created_at,
        updated_at: editableAd.updated_at ?? null,

        /* ---------------- Text & content ---------------- */
        advertisement_text: editableAd.advertisement_text,
        advertisement_words: words,
        word_count: wordCount,
        special_notes: editableAd.special_notes ?? null,

        /* ---------------- Flags ---------------- */
        background_color: editableAd.background_color ?? null,
        post_in_web: editableAd.post_in_web ?? null,

        /* ---------------- Media ---------------- */
        upload_image: editableAd.upload_image ?? null,

        /* ---------------- Pricing & status ---------------- */
        price: editableAd.price ?? null,
        status: editableAd.status,

        /* ---------------- Casual Ad ---------------- */
        casual_ad: editableAd.casual_ad
          ? {
              ad_size: editableAd.casual_ad.ad_size,
              no_of_columns: editableAd.casual_ad.no_of_columns,
              ad_height: editableAd.casual_ad.ad_height,
              color_option: editableAd.casual_ad.color_option,
              has_artwork: editableAd.casual_ad.has_artwork,
              need_artwork: editableAd.casual_ad.need_artwork,
              no_of_boxes: editableAd.casual_ad.no_of_boxes,
            }
          : null,

        /* ---------------- Classified Ad ---------------- */
        classified_ad: editableAd.classified_ad
          ? {
              is_publish_eng: editableAd.classified_ad.is_publish_eng,
              is_publish_tam: editableAd.classified_ad.is_publish_tam,
              is_priority: editableAd.classified_ad.is_priority,
              is_publish_sin: editableAd.classified_ad.is_publish_sin,
              is_publish_sin_eng: editableAd.classified_ad.is_publish_sin_eng,
              is_publish_sin_tam: editableAd.classified_ad.is_publish_sin_tam,
              is_publish_eng_tam: editableAd.classified_ad.is_publish_eng_tam,
              is_co_paper: editableAd.classified_ad.is_co_paper,
              is_int_bw: editableAd.classified_ad.is_int_bw,
              is_int_fc: editableAd.classified_ad.is_int_fc,
              is_int_highlight: editableAd.classified_ad.is_int_highlight,
              district: editableAd.classified_ad.district,
              province: editableAd.classified_ad.province,
              vehicle_brand: editableAd.classified_ad.vehicle_brand,
            }
          : null,
        attachments: extraData ?? null,
      }),
    });

    function generatePublisherEmail(ad: Advertisement) {
      const category =
        ad.ad_type === "Classified"
          ? (ad.classified_category ?? "N/A")
          : (ad.casual_ad?.ad_size ?? "N/A");

      const publicationDate = ad.publish_date
        ? new Date(ad.publish_date).toLocaleDateString()
        : "TBD";

      const printUrl = ad.print_url ?? "URL not available yet";

      return `
              Dear Publisher,

              The following advertisement has been processed in Paththare Ads:

              Reference Number: ${ad.reference_number}
              Advertiser Name: ${ad.advertiser_name}
              Ad Type / Category: ${ad.ad_type} / ${category}
              Newspaper: ${ad.newspaper_name}
              Publish Date: ${publicationDate}
              Price: ${ad.price ?? "N/A"}

              The advertisement has been printed and can be accessed at the following URL:
              ${printUrl}

              Please review and proceed accordingly.

              Best regards,
              Paththare Ads Team
              `;
    }

    const blob = await res.blob();
    if (res.status !== 400) {
      updateStatus("AdProcessed");

      // 1. upload blob to cloudinary
      const file = new File([blob], `${editableAd.reference_number}.pdf`, {
        type: "application/pdf",
      });

      const cloudUrl = await uploadPrintedBlobToCloudinary(file);

      // 2. save URL to DB
      await fetch(`/api/ads/${editableAd.reference_number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ print_url: cloudUrl }),
      });

      setPrinting(false);

      setAds((prev) =>
        prev.map((ad) =>
          ad.reference_number === editableAd.reference_number
            ? { ...ad, print_url: cloudUrl }
            : ad,
        ),
      );

      setEditableAd((prev) => prev && { ...prev, print_url: cloudUrl });
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setIsProcessing(false);
    setAlertMessage("PDF Printed");
  };

  useEffect(() => {
    if (showAttachmentView && editedText) {
      setAttachments((prev) => ({
        ...prev,
        changedText: editedText,
      }));
    }
  }, [showAttachmentView]);

  const handlePrint2 = async (extraData?: AttachmentData) => {
    {
      // // console.log(selectedAd);
      // // if (!selectedAd) return;
      // // setPrinting(true);
      // console.log(editableAd);
      // if (!editableAd) return;
      // setPrinting(true);
      // setIsProcessing(true);
      // // Trim + split by ONE OR MORE SPACES
      // const words = editableAd.advertisement_text.trim().split(/\s+/); // space-separated words
      // const wordCount = words.length;
      // const res = await fetch("/api/ads/print", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     /* ---------------- Core identifiers ---------------- */
      //     reference_number: editableAd.reference_number,
      //     newspaper_name: editableAd.newspaper_name,
      //     language: editableAd.language,
      //     newspaper_id: editableAd.newspaper_name
      //       ?.trim()
      //       .toUpperCase()
      //       .replace(/\s+/g, "_"),
      //     /* ---------------- Advertiser details ---------------- */
      //     advertiser_name: editableAd.advertiser_name,
      //     advertiser_nic: editableAd.advertiser_nic ?? null,
      //     advertiser_phone: editableAd.advertiser_phone ?? null,
      //     advertiser_address: editableAd.advertiser_address ?? null,
      //     /* ---------------- Ad classification ---------------- */
      //     ad_type: editableAd.ad_type,
      //     category: editableAd.classified_category ?? null,
      //     subcategory: editableAd.subcategory ?? null,
      //     count_first_words: editableAd.count_first_words ?? null,
      //     /* ---------------- Dates ---------------- */
      //     publish_date: formatDateYMD(
      //       editableAd.publish_date ? editableAd.publish_date : "",
      //     ),
      //     created_at: editableAd.created_at,
      //     updated_at: editableAd.updated_at ?? null,
      //     /* ---------------- Text & content ---------------- */
      //     advertisement_text: editableAd.advertisement_text,
      //     advertisement_words: words,
      //     word_count: wordCount,
      //     special_notes: editableAd.special_notes ?? null,
      //     /* ---------------- Flags ---------------- */
      //     background_color: editableAd.background_color ?? null,
      //     post_in_web: editableAd.post_in_web ?? null,
      //     /* ---------------- Media ---------------- */
      //     upload_image: editableAd.upload_image ?? null,
      //     /* ---------------- Pricing & status ---------------- */
      //     price: editableAd.price ?? null,
      //     status: editableAd.status,
      //     /* ---------------- Casual Ad ---------------- */
      //     casual_ad: editableAd.casual_ad
      //       ? {
      //           ad_size: editableAd.casual_ad.ad_size,
      //           no_of_columns: editableAd.casual_ad.no_of_columns,
      //           ad_height: editableAd.casual_ad.ad_height,
      //           color_option: editableAd.casual_ad.color_option,
      //           has_artwork: editableAd.casual_ad.has_artwork,
      //           need_artwork: editableAd.casual_ad.need_artwork,
      //           no_of_boxes: editableAd.casual_ad.no_of_boxes,
      //         }
      //       : null,
      //     /* ---------------- Classified Ad ---------------- */
      //     classified_ad: editableAd.classified_ad
      //       ? {
      //           is_publish_eng: editableAd.classified_ad.is_publish_eng,
      //           is_publish_tam: editableAd.classified_ad.is_publish_tam,
      //           is_priority: editableAd.classified_ad.is_priority,
      //           is_publish_sin: editableAd.classified_ad.is_publish_sin,
      //           is_publish_sin_eng: editableAd.classified_ad.is_publish_sin_eng,
      //           is_publish_sin_tam: editableAd.classified_ad.is_publish_sin_tam,
      //           is_publish_eng_tam: editableAd.classified_ad.is_publish_eng_tam,
      //           is_co_paper: editableAd.classified_ad.is_co_paper,
      //           is_int_bw: editableAd.classified_ad.is_int_bw,
      //           is_int_fc: editableAd.classified_ad.is_int_fc,
      //           is_int_highlight: editableAd.classified_ad.is_int_highlight,
      //           district: editableAd.classified_ad.district,
      //           province: editableAd.classified_ad.province,
      //           vehicle_brand: editableAd.classified_ad.vehicle_brand,
      //         }
      //       : null,
      //     attachments: extraData ?? null,
      //   }),
      // });
      // const blob = await res.blob();
      // if (res.status !== 400) {
      //   setPrinting(false);
      //   const url = URL.createObjectURL(blob);
      //   window.open(url, "_blank");
      //   setIsProcessing(false);
      //   setAlertMessage("PDF is ready");
      // } else {
      //   setPrinting(false);
      //   setIsProcessing(false);
      //   setAlertMessage("An error occured!");
      // }
    }
    window.open(editableAd?.print_url, "_blank", "noopener,noreferrer");
  };

  const formatPublishDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${day}.${month}.${year} (${weekday})`;
  };

  const handleSendSelected = async () => {
    if (selectedAds.length === 0) return;
    setIsProcessing(true);
    const referenceNumbers = selectedAds.map((ad) => ad.reference_number);

    try {
      // Publisher email (assumes same publisher for all selected ads)
      const publisherEmail = selectedPublisher;
      if (!publisherEmail) {
        alert("Publisher email is missing");
        return;
      }

      // Email subject
      const subject = `Advertisements Summary - ${new Date().toLocaleDateString()}`;

      // Build email body for all selected ads
      let body = `<h2>Advertisements Processed in Paththare Ads</h2><ul>`;
      selectedAds.forEach((ad) => {
        const category =
          ad.ad_type === "Classified"
            ? (ad.classified_category ?? "N/A")
            : (ad.casual_ad?.ad_size ?? "N/A");

        const publicationDate = ad.publish_date
          ? new Date(ad.publish_date).toLocaleDateString()
          : "TBD";

        const printUrl = ad.print_url ?? "URL not available yet";

        body += `
        <li style="margin-bottom: 16px;">
          <strong>Reference Number:</strong> ${ad.reference_number}<br/>
          <strong>Advertiser Name:</strong> ${ad.advertiser_name}<br/>
          <strong>Ad Type / Category:</strong> ${ad.ad_type} / ${category}<br/>
          <strong>Newspaper:</strong> ${ad.newspaper_name}<br/>
          <strong>Publish Date:</strong> ${publicationDate}<br/>
          <strong>Price:</strong> ${ad.price ?? "N/A"}<br/>
          <strong>Print File:</strong> 

        </li>
      `;
      });
      body += `</ul>`;
      // updateStatus("Submitted");

      // Send request to API

      const mainres = await Promise.all(
        referenceNumbers.map((ref) =>
          fetch("/api/ads/updateStatus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference_number: ref,
              status: "Submitted",
            }),
          }),
        ),
      );
      console.log(mainres);
      const res = await fetch("/api/ads/send-bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: publisherEmail,
          subject,
          body,
          ads: selectedAds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to send email");
        return;
      }

      alert("Email sent successfully!");

      // Reset selection
      setSelectedAds([]);
      setSelectedPublisher("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while sending email");
    }

    setIsProcessing(false);
  };

  useEffect(() => {
    if (selectedAd) {
      setEditableAd(JSON.parse(JSON.stringify(selectedAd)));
    }
  }, [selectedAd]);

  return (
    <div className="flex min-h-screen text-violet-950 bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Advertisements</h2>

        {/* Filter controls */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by reference, name, paper, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border px-4 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
               sm:max-w-md"
          />

          <div className="flex flex-wrap gap-3">
            {selectedAds.length > 0 && (
              <button
                onClick={() => handleSendSelected()}
                className="flex items-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-2 text-sm shadow hover:bg-violet-700 transition"
              >
                <Mail className="h-4 w-4" />
                Send Selected ({selectedAds.length})
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              />

              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-baseline text-gray-500 hover:text-red-500 underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="all">Show All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="resubmitted">Resubmitted</option>
              <option value="paymentpending">Pending Payment</option>
              <option value="paymentdone">Payment Done</option>
              <option value="pricechange">Price Change Requested</option>
              <option value="updateimage">Media Change Requested</option>
              <option value="adprocessed">Processed</option>
              <option value="submitted">Submitted (Emailed)</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="created_at">Sort by Date</option>
              <option value="newspaper_name">Sort by Newspaper</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow rounded-lg mt-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Advertiser Name</th>
                <th className="px-4 py-3">Advertise Tel</th>
                <th className="px-4 py-3">Newspaper</th>
                {/* <th className="px-4 py-3">Advertiser ID</th> */}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-4 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-28 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-40 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-28 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-32 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-24 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-4 w-24 rounded"></div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="skeleton h-8 w-24 rounded-full"></div>
                    </td>
                  </tr>
                ))}
              {!loading &&
                paginatedAds.map((ad) => (
                  <tr
                    key={ad.reference_number}
                    onClick={async (e) => {
                      // Prevent row click from interfering with checkbox
                      if ((e.target as HTMLElement).closest("input")) return;

                      try {
                        if (!ad.is_read) {
                          await fetch(`/api/ads/${ad.reference_number}`, {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              is_read: true,
                            }),
                          });

                          // Update local state immediately so UI changes without refresh
                          setAds((prev) =>
                            prev.map((item) =>
                              item.reference_number === ad.reference_number
                                ? { ...item, is_read: true }
                                : item,
                            ),
                          );

                          setFilteredAds((prev) =>
                            prev.map((item) =>
                              item.reference_number === ad.reference_number
                                ? { ...item, is_read: true }
                                : item,
                            ),
                          );
                        }

                        openModal(ad);
                      } catch (err) {
                        console.error("Failed to mark ad as read", err);
                        openModal(ad);
                      }
                    }}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedAds.some(
                        (a) => a.reference_number === ad.reference_number,
                      )
                        ? "bg-blue-100"
                        : ""
                    }  ${
                      !ad.is_read
                        ? "text-[var(--color-primary-dark)]"
                        : "text-gray-800"
                    }`}
                  >
                    <td className="px-4 py-2">
                      {(ad.status?.toLowerCase() === "print" ||
                        ad.status?.toLowerCase() === "sent to print" ||
                        ad.status?.toLowerCase() === "adprocessed" ||
                        ad.status?.toLowerCase() === "AdProcessed") &&
                      ad.publisher_email !== null ? (
                        <input
                          className="h-4 w-4"
                          type="checkbox"
                          checked={selectedAds.some(
                            (a) => a.reference_number === ad.reference_number,
                          )}
                          onChange={() => toggleSelectAd(ad)}
                          onClick={(e) => e.stopPropagation()} // prevent row click
                        />
                      ) : (
                        <span className="text-gray-300">—</span> // or empty cell
                      )}
                    </td>

                    <td
                      className={`px-4 py-2 font-mono ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {ad.reference_number}
                    </td>
                    <td
                      className={`px-4 py-2 font-mono ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {ad.advertiser_name}
                    </td>

                    <td
                      className={`px-4 py-2 font-mono ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {ad.advertiser_phone}
                    </td>

                    <td
                      className={`px-4 py-2 ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {ad.newspaper_name}
                    </td>

                    {/* <td className="px-4 py-2">{ad.advertiser_id}</td> */}

                    <td
                      className={`px-4 py-2 ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {ad.ad_type}
                    </td>

                    <td
                      className={`px-4 py-2 ${
                        !ad.is_read ? "font-bold" : "font-normal"
                      }`}
                    >
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td
                      className={`px-4 py-2 font-semibold ${statusColorHandler(
                        ad.status,
                      )}`}
                    >
                      {ad.status}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && selectedAd && editableAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between px-8 py-6 border-b bg-(--color-primary-dark) text-white">
                <div>
                  <h3 className="text-xl font-semibold">
                    Ref:{" "}
                    <span className="font-mono">
                      {selectedAd.reference_number}
                    </span>
                  </h3>
                  <p className="mt-1 opacity-80">
                    Advertiser:{" "}
                    <span className="font-bold">
                      {editMode ? (
                        <input
                          value={editableAd.advertiser_name}
                          onChange={(e) =>
                            setEditableAd({
                              ...editableAd,
                              advertiser_name: e.target.value,
                            })
                          }
                          className="bg-white text-black px-2 rounded"
                        />
                      ) : (
                        <span className="font-bold">
                          {editableAd.advertiser_name}
                        </span>
                      )}
                    </span>
                  </p>
                  <p className="mt-1 opacity-80">
                    Created at:{" "}
                    <span className="font-bold">
                      {new Date(selectedAd.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Top row */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xm font-medium ${
                        selectedAd.status === "Approved"
                          ? "bg-green-500/20 text-green-300"
                          : selectedAd.status === "Declined"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {selectedAd.status}
                    </span>

                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-sm"
                    >
                      {editMode ? "View Mode" : "Edit"}
                    </button>

                    <button
                      onClick={closeModal}
                      className="text-white/70 hover:text-white transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Bottom row */}
                  {isChanged && (
                    <span className="text-xs text-yellow-300 text-right">
                      You have unsaved changes
                    </span>
                  )}
                </div>
              </div>
              <div className="flex max-h-[60vh] flex-col bg-white rounded-2xl shadow-xl">
                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {selectedAd && (
                    <>
                      {/* CONTENT */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
                        {/* LEFT: DETAILS */}
                        <div className="lg:col-span-1 space-y-4 text-sm">
                          <div>
                            <InfoRow
                              label="Newspaper"
                              value={selectedAd.newspaper_name}
                            />

                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedAd.classified_ad?.is_publish_sin && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-amber-900/20 text-amber-700">
                                  Sinhala
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_eng && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-500">
                                  English
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-600">
                                  Tamil
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_sin_eng && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-600">
                                  Sinhala & English
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_sin_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-500/20 text-green-600">
                                  Sinhala & Tamil
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_eng_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-pink-500/20 text-pink-600">
                                  English & Tamil
                                </span>
                              )}
                            </div>
                          </div>

                          {selectedAd.publish_date && (
                            <InfoRow
                              label="Date to be Published"
                              value={formatPublishDate(selectedAd.publish_date)}
                            />
                          )}

                          <InfoRow label="Ad Type" value={selectedAd.ad_type} />
                          {selectedAd.ad_type === "casual" && (
                            <InfoRow
                              label="Section"
                              value={selectedAd.casual_ad?.section?.name}
                            />
                          )}
                          <InfoRow
                            label="Category"
                            value={selectedAd.classified_category}
                          />
                          <InfoRow
                            label="Subcategory"
                            value={selectedAd.subcategory}
                          />

                          <InfoRow
                            label="District"
                            value={selectedAd.classified_ad?.district}
                          />

                          <InfoRow
                            label="Province"
                            value={selectedAd.classified_ad?.province}
                          />

                          <InfoRow
                            label="Vehicle"
                            value={selectedAd.classified_ad?.vehicle_brand}
                          />

                          {selectedAd.casual_ad && (
                            <>
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                  selectedAd.casual_ad.no_of_boxes > 0
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-yellow-500/20 text-yellow-700"
                                }`}
                              >
                                {selectedAd.casual_ad.no_of_boxes > 0 &&
                                selectedAd.casual_ad.ad_size === ""
                                  ? "Box Ad"
                                  : "Column Ad"}
                              </span>

                              <InfoRow
                                label="Ad Size"
                                value={selectedAd.casual_ad.ad_size}
                              />

                              {selectedAd.casual_ad.ad_size.toLowerCase() ===
                                "custom" && (
                                <>
                                  <InfoRow
                                    label="No of Columns"
                                    value={selectedAd.casual_ad.no_of_columns.toString()}
                                  />
                                  <InfoRow
                                    label="Ad Height (cm)"
                                    value={selectedAd.casual_ad.ad_height.toString()}
                                  />
                                </>
                              )}

                              <InfoRow
                                label="Color Option"
                                value={selectedAd.casual_ad.color_option}
                              />

                              {(selectedAd.casual_ad.has_artwork ||
                                selectedAd.casual_ad.need_artwork) && (
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                    selectedAd.casual_ad.has_artwork
                                      ? "bg-green-500/20 text-green-600"
                                      : "bg-red-500/20 text-red-600"
                                  }`}
                                >
                                  {selectedAd.casual_ad.has_artwork
                                    ? "Has Artwork"
                                    : "Need Artwork"}
                                </span>
                              )}
                            </>
                          )}

                          {selectedAd.classified_ad?.is_priority && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-red-500/20 text-red-500">
                              Priority
                            </span>
                          )}

                          {selectedAd.classified_ad?.is_int_bw && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-fuchsia-400/40 text-amber-950">
                              Internet Black & White
                            </span>
                          )}

                          {selectedAd.classified_ad?.is_int_fc && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-fuchsia-400/40 text-amber-950">
                              Internet Full Color
                            </span>
                          )}
                          {selectedAd.classified_ad?.is_int_highlight && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-fuchsia-400/40 text-amber-950">
                              Internet Highlight
                            </span>
                          )}
                          {selectedAd.classified_ad?.is_co_paper && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-fuchsia-400/40 text-amber-950">
                              CO Paper
                            </span>
                          )}

                          {selectedAd.price && (
                            <InfoRow
                              label="Price"
                              value={String(selectedAd.price)}
                            />
                          )}

                          {selectedAd.payment &&
                            selectedAd.status === "PaymentPending" && (
                              <button
                                key={selectedAd.payment.file_path}
                                type="button"
                                onClick={() => {
                                  if (selectedAd.payment) {
                                    setPreviewImage(
                                      selectedAd.payment.file_path,
                                    );
                                  }
                                }}
                                className="rounded-xl p-2 bg-amber-300"
                              >
                                View Payment Receipt
                              </button>
                            )}
                          {selectedAd.payment &&
                            selectedAd.status === "PaymentDone" && (
                              <button
                                key={selectedAd.payment.file_path}
                                type="button"
                                onClick={() => {
                                  if (selectedAd.payment) {
                                    setPreviewImage(
                                      selectedAd.payment.file_path,
                                    );
                                  }
                                }}
                                className="rounded-xl p-2 bg-amber-300"
                              >
                                View Payment Receipt
                              </button>
                            )}
                          {selectedAd.payment &&
                            selectedAd.status === "Print" && (
                              <button
                                key={selectedAd.payment.file_path}
                                type="button"
                                onClick={() => {
                                  if (selectedAd.payment) {
                                    setPreviewImage(
                                      selectedAd.payment.file_path,
                                    );
                                  }
                                }}
                                className="rounded-xl p-2 bg-amber-300"
                              >
                                View Payment Receipt
                              </button>
                            )}

                          {selectedAd.payment &&
                            selectedAd.status === "AdProcessed" && (
                              <button
                                key={selectedAd.payment.file_path}
                                type="button"
                                onClick={() => {
                                  if (selectedAd.payment) {
                                    setPreviewImage(
                                      selectedAd.payment.file_path,
                                    );
                                  }
                                }}
                                className="rounded-xl p-2 bg-amber-300"
                              >
                                View Payment Receipt
                              </button>
                            )}

                          {selectedAd.special_notes && (
                            <div>
                              <p className="font-medium text-[var(--color-text-dark-highlight)]">
                                Special Notes
                              </p>
                              <p className="mt-1 text-gray-600 leading-relaxed">
                                {selectedAd.special_notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* RIGHT: AD CONTENT */}
                        <div className="lg:col-span-2">
                          <p className="mb-2 text-sm font-medium text-[var(--color-text-dark-highlight)]">
                            Advertisement Content
                          </p>

                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            readOnly={[
                              "Print",
                              "Approved",
                              "Declined",
                              "Cancelled",
                              "PaymentPending",
                              "PaymentDone",
                              "AdProcessed",
                              "Submitted",
                            ].includes(selectedAd.status || "")}
                            className={`w-full h-56 rounded-xl border p-4 text-gray-800 resize-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none ${
                              [
                                "Print",
                                "Approved",
                                "Declined",
                                "Cancelled",
                                "PaymentPending",
                                "PaymentDone",
                                "AdProcessed",
                                "Submitted",
                              ].includes(selectedAd.status || "")
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* IMAGES */}
                      {selectedAd.uploaded_images &&
                        selectedAd.uploaded_images.length > 0 && (
                          <div className="px-8 py-4 border-t space-y-4">
                            <div className="grid gap-3">
                              {selectedAd.uploaded_images.map((url, index) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl">📄</div>
                                    <div>
                                      <p className="font-medium">
                                        PDF Document {index + 1}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Click to view PDF
                                      </p>
                                    </div>
                                  </div>

                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 3h7m0 0v7m0-7L10 14"
                                    />
                                  </svg>
                                </a>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {selectedAd.uploaded_images.length} PDF file(s)
                                uploaded
                              </span>

                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={requestImageChange}
                                  onChange={(e) =>
                                    setRequestImageChange(e.target.checked)
                                  }
                                />
                                Request Document Change
                              </label>
                            </div>
                          </div>
                        )}

                      {/* PRICE CHANGE */}
                      {[
                        "Pending",
                        "Revision",
                        "Resubmitted",
                        "UpdateImage",
                        "PriceChange",
                      ].includes(selectedAd.status) && (
                        <div className="px-8 py-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                  type="checkbox"
                                  checked={requestPriceChange}
                                  onChange={(e) =>
                                    setRequestPriceChange(e.target.checked)
                                  }
                                  className="accent-[var(--color-primary)]"
                                />
                                Request Price Change
                              </label>
                              <p className="mt-2 text-xs text-gray-500">
                                Request a revision to the advertisement price.
                              </p>
                            </div>

                            {requestPriceChange && (
                              <div className="md:col-span-2 space-y-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                                <div>
                                  <p className="text-sm font-medium">
                                    New Price
                                  </p>
                                  <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) =>
                                      setNewPrice(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-medium">
                                    Reason for Price Change
                                  </p>
                                  <textarea
                                    value={priceReason}
                                    onChange={(e) =>
                                      setPriceReason(e.target.value)
                                    }
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-yellow-400"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t bg-gray-50 px-8 py-6">
                {/* Action buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  {[
                    "Pending",
                    "Revision",
                    "Resubmitted",
                    "UpdateImage",
                  ].includes(selectedAd.status) && (
                    <button
                      onClick={() => updateStatus("Declined")}
                      className={`${ACTION_BTN_CLASS} bg-red-600 text-white hover:bg-red-700`}
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  )}

                  {/* {(isTextChanged || requestImageChange || newPrice) && (
                    <button
                      onClick={() =>
                        updateStatus(
                          requestImageChange
                            ? "UpdateImage"
                            : requestImageChange && newPrice
                              ? "UpdateImagePrice"
                              : isTextChanged && newPrice
                                ? "RevisionPrice"
                                : "Revision",
                        )
                      }
                      className={`${ACTION_BTN_CLASS} bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-accent)]`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Request Revision
                    </button>
                  )} */}

                  {[
                    "Pending",
                    "Revision",
                    "Resubmitted",
                    "UpdateImage",
                  ].includes(selectedAd.status) &&
                    (isTextChanged || requestImageChange || newPrice) && (
                      <button
                        onClick={() => updateStatus("Revision")}
                        className={`${ACTION_BTN_CLASS} bg-orange-600 text-white hover:bg-blue-700`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Revision
                      </button>
                    )}

                  {[
                    "Pending",
                    "Revision",
                    "Resubmitted",
                    "UpdateImage",
                  ].includes(selectedAd.status) &&
                    (isTextChanged || requestImageChange || newPrice) && (
                      <button
                        onClick={() => updateStatus("Approved")}
                        className={`${ACTION_BTN_CLASS} bg-green-600 text-white hover:bg-green-700`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Force Approve
                      </button>
                    )}

                  {["Pending", "Resubmitted", "UpdateImage"].includes(
                    selectedAd.status,
                  ) &&
                    !isTextChanged &&
                    !requestImageChange &&
                    !newPrice && (
                      <button
                        onClick={() => updateStatus("Approved")}
                        className={`${ACTION_BTN_CLASS} bg-green-600 text-white hover:bg-green-700`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}

                  {["Print", "AdProcessed", "Submitted"].includes(
                    selectedAd.status,
                  ) && (
                    <div className="flex flex-col justify-center">
                      <button
                        onClick={() => setshowPDFViewPrompt(true)}
                        className={`${ACTION_BTN_CLASS} bg-white border-1 border-b-black text-black hover:bg-[var(--color-primary)] ${
                          printing ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        Preview
                      </button>
                      <p className="text-xs text-center mt-1">
                        (Click to View PDF Preview)
                      </p>
                    </div>
                  )}

                  {["PaymentDone", "Print", "AdProcessed"].includes(
                    selectedAd.status,
                  ) && (
                    <div className="flex flex-col justify-center">
                      <button
                        onClick={() => setShowAttachmentPrompt(true)}
                        disabled={printing}
                        className={`${ACTION_BTN_CLASS} bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)] ${
                          printing ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {printing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Printing...
                          </>
                        ) : selectedAd.status === "PaymentDone" ? (
                          <>
                            <Printer className="w-4 h-4" />
                            Print
                          </>
                        ) : (
                          <>
                            <>
                              <Printer className="w-4 h-4" />
                              Re-Print
                            </>
                          </>
                        )}
                      </button>
                      <p className="text-xs text-center mt-1">
                        (Click to Add Additional Data)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t bg-gray-50 px-8 py-6 text-center">
                {selectedAd.status === "Approved" && (
                  <p className="font-semibold">Waiting for Payment</p>
                )}
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white text-sm hover:underline"
              >
                Close ✕
              </button>

              <img
                src={previewImage}
                alt="Image preview"
                className="w-full max-h-[80vh] object-contain rounded-lg shadow-lg bg-white"
              />
            </div>
          </div>
        )}

        {differentPublisher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                Alert
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                You can only select multiple ads that belong to the same
                publisher email. Deselect the current selection or choose ads
                from the same publisher.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setdifferentPublisher(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm
             transition hover:bg-gray-100"
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

              <h2 className="text-lg font-semibold mb-2">
                <h4>Processing...</h4>
                {editableAd?.status === "Print" && "Printing Ad..."}
                {editableAd?.status === "AdProcessed" && "Printing Ad..."}
                {/* {currentStep === 2 && "Preparing advertiser form..."}
              {currentStep === 3 && "Your advertisement is saving..."} */}
              </h2>

              {/* <p className="text-sm opacity-90">
              {currentStep === 1 && "Loading ad types..."}
              {currentStep === 2 && "Preparing advertiser form..."}
              {currentStep === 3 && "Submitting advertisement..."}
            </p> */}
            </div>
          </div>
        )}

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

        {showAttachmentPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-[var(--color-primary-dark)] p-6 w-96 text-white shadow-lg">
              <h2 className="text-lg font-semibold mb-4">
                Additional Attachments
              </h2>

              <p className="mb-6 text-sm">
                Do you want to add additional attachments before printing?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAttachmentPrompt(false);
                    handlePrintRequest(attachments); // NO → continue directly
                  }}
                  className="rounded-full bg-gray-300 px-4 py-1.5 text-sm font-medium text-black"
                >
                  No
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentPrompt(false);
                    setShowAttachmentView(true); // YES → open form
                  }}
                  className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)]"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showReprintPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-96 rounded-xl bg-[var(--color-primary-dark)] p-6 text-white shadow-lg">
              <h2 className="mb-4 text-lg font-semibold">Existing PDF Found</h2>

              <p className="mb-6 text-sm">
                A printed PDF already exists for this advertisement.
                <br />
                Do you want to re-print and replace it?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReprintPrompt(false);
                    setPendingAttachments(undefined);
                  }}
                  className="rounded-full bg-gray-300 px-4 py-1.5 text-sm font-medium text-black"
                >
                  No
                </button>

                <button
                  onClick={() => {
                    setShowReprintPrompt(false);
                    handlePrint(pendingAttachments);
                    setPendingAttachments(undefined);
                  }}
                  className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)]"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showPDFViewPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-[var(--color-primary-dark)] p-6 w-96 text-white shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Preview PDF</h2>

              <p className="mb-6 text-sm">Preview PDF?</p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setshowPDFViewPrompt(false);
                  }}
                  className="rounded-full bg-gray-300 px-4 py-1.5 text-sm font-medium text-black"
                >
                  No
                </button>

                <button
                  onClick={() => {
                    setshowPDFViewPrompt(false);
                    handlePrint2(attachments);
                  }}
                  className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)]"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showAttachmentView && editableAd && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
              {/* HEADER (fixed) */}
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  Additional Attachments
                </h2>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Dynamic content based on publisher */}
                {publisherName === "wijeya_newspapers" && (
                  <>
                    <label className="font-semibold mb-2">Classification</label>
                    <input
                      type="text"
                      placeholder="Classification"
                      value={attachments.classification}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          classification: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">
                      No of Insertions
                    </label>
                    <input
                      type="text"
                      placeholder="Number of Insertions"
                      value={attachments.noInsertions}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          noInsertions: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.customizeType}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            customizeType: e.target.checked,
                            isCarsOthers: e.target.checked
                              ? attachments.isCarsOthers
                              : null,
                          })
                        }
                      />
                      Cars or Other Vehicle Type?
                    </label>

                    {attachments.customizeType && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="isCarsOthers"
                            checked={attachments.isCarsOthers === "c"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                isCarsOthers: "c",
                              })
                            }
                          />
                          Cars
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="isCarsOthers"
                            checked={attachments.isCarsOthers === "o"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                isCarsOthers: "o",
                              })
                            }
                          />
                          Other
                        </label>
                      </div>
                    )}

                    <label className="font-semibold mb-2">Size (Casual)</label>
                    <input
                      type="text"
                      placeholder="Size (Casual)"
                      value={attachments.size}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          size: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">
                      Special Position
                    </label>
                    <input
                      type="text"
                      placeholder="Special Position"
                      value={attachments.specialPosition}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          specialPosition: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">Colour</label>
                    <input
                      type="text"
                      placeholder="Color"
                      value={attachments.color}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          color: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">Foot Notes</label>
                    <textarea
                      placeholder="Enter notes..."
                      value={attachments.adminNotes}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          adminNotes: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </>
                )}
                {publisherName === "ceylon_newspapers" && (
                  <>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.customizeType}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            customizeType: e.target.checked,
                            classifiedType: e.target.checked
                              ? attachments.classifiedType
                              : null,
                          })
                        }
                      />
                      Customize Type?
                    </label>

                    {attachments.customizeType && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="classifiedType"
                            checked={attachments.classifiedType === "photo"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                classifiedType: "photo",
                              })
                            }
                          />
                          Photo Classified
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="classifiedType"
                            checked={attachments.classifiedType === "normal"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                classifiedType: "normal",
                              })
                            }
                          />
                          Normal Classified
                        </label>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.customizeColor}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            customizeColor: e.target.checked,
                            colorType: e.target.checked
                              ? attachments.colorType
                              : null, // 👈 reset when unchecked
                          })
                        }
                      />
                      Customize Color?
                    </label>

                    {attachments.customizeColor && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="colorType"
                            checked={attachments.colorType === "full"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                colorType: "full",
                              })
                            }
                          />
                          Full Color
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="colorType"
                            checked={attachments.colorType === "bw"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                colorType: "bw",
                              })
                            }
                          />
                          Black & White
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="colorType"
                            checked={attachments.colorType === "bw1"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                colorType: "bw1",
                              })
                            }
                          />
                          Black & White + 1 Color
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="colorType"
                            checked={attachments.colorType === "bw2"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                colorType: "bw2",
                              })
                            }
                          />
                          Black & White + 2 Colors
                        </label>
                      </div>
                    )}

                    <label className="font-semibold mb-2">
                      No of Insertions
                    </label>
                    <input
                      type="text"
                      placeholder="Number of Insertions"
                      value={attachments.noInsertions}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          noInsertions: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                    <label className="font-semibold mb-2">Footer Notes</label>
                    <input
                      type="text"
                      placeholder="Footer Notes"
                      value={attachments.adminNotes}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          adminNotes: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </>
                )}
                {publisherName === "upali_newspapers" && (
                  <>
                    <label className="font-semibold mb-2">
                      COLUMN C.M. (සෙ.මී. ප්‍රමාණය)
                    </label>
                    <input
                      type="text"
                      placeholder="Number of Insertions"
                      value={attachments.size}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          size: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                    <label className="font-semibold mb-2">COLOUR (වර්ණය)</label>
                    <input
                      type="text"
                      placeholder="Number of Insertions"
                      value={attachments.color}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          color: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">Footer notes</label>
                    <textarea
                      placeholder="Enter footer notes"
                      value={attachments.adminNotes}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          adminNotes: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    {/* <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.customizeSize}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            customizeSize: e.target.checked,
                            classifiedType: e.target.checked
                              ? attachments.classifiedType
                              : null, // 👈 reset when unchecked
                          })
                        }
                      />
                      Customize Type?
                    </label> */}
                  </>
                )}
                {publisherName === "associated_newspapers" && (
                  <>
                    {editableAd.ad_type !== "marriage" &&
                      editableAd.ad_type !== "name_notice" &&
                      editableAd.ad_type !== "casual" &&
                      editableAd.ad_type !== "photo_classified" && (
                        <>
                          <label className="font-semibold mb-2">
                            Classification
                          </label>
                          <input
                            type="text"
                            placeholder="Classification"
                            value={attachments.classification}
                            onChange={(e) =>
                              setAttachments({
                                ...attachments,
                                classification: e.target.value,
                              })
                            }
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                          <label className="font-semibold mb-2">
                            No of Insertions
                          </label>
                          <input
                            type="text"
                            placeholder="Number of Insertions"
                            value={attachments.noInsertions}
                            onChange={(e) =>
                              setAttachments({
                                ...attachments,
                                noInsertions: e.target.value,
                              })
                            }
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        </>
                      )}

                    {(editableAd.ad_type === "name_notice" ||
                      editableAd.ad_type === "marriage" ||
                      editableAd.ad_type === "casual" ||
                      editableAd.ad_type === "photo_classified") && (
                      <>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={attachments.isCO}
                            onChange={(e) =>
                              setAttachments({
                                ...attachments,
                                isCO: e.target.checked,
                              })
                            }
                          />
                          is CO Paper?
                        </label>
                        <input
                          type="text"
                          placeholder="Classification"
                          value={attachments.classification2}
                          onChange={(e) =>
                            setAttachments({
                              ...attachments,
                              classification2: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Page"
                          value={attachments.page}
                          onChange={(e) =>
                            setAttachments({
                              ...attachments,
                              page: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Position"
                          value={attachments.position}
                          onChange={(e) =>
                            setAttachments({
                              ...attachments,
                              position: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                      </>
                    )}
                    <label className="font-semibold mb-2">Footer notes</label>
                    <textarea
                      placeholder="Enter footer notes"
                      value={attachments.adminNotes}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          adminNotes: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </>
                )}
                {publisherName === "liberty_publishers" && (
                  <>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.customizeType}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            customizeType: e.target.checked,
                            isCarsOthers: e.target.checked
                              ? attachments.isCarsOthers
                              : null,
                          })
                        }
                      />
                      Cars or Other Vehicle Type?
                    </label>

                    {attachments.customizeType && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="isCarsOthers"
                            checked={attachments.isCarsOthers === "c"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                isCarsOthers: "c",
                              })
                            }
                          />
                          Cars
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="isCarsOthers"
                            checked={attachments.isCarsOthers === "o"}
                            onChange={() =>
                              setAttachments({
                                ...attachments,
                                isCarsOthers: "o",
                              })
                            }
                          />
                          Other
                        </label>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={attachments.hasPhoto}
                        onChange={(e) =>
                          setAttachments({
                            ...attachments,
                            hasPhoto: e.target.checked,
                          })
                        }
                      />
                      Has Photos
                    </label>

                    <label className="font-semibold mb-2">
                      Special Position
                    </label>
                    <input
                      type="text"
                      placeholder="Special Position"
                      value={attachments.specialPosition}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          specialPosition: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">Colour</label>
                    <input
                      type="text"
                      placeholder="Color"
                      value={attachments.color}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          color: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <label className="font-semibold mb-2">Foot Notes</label>
                    <textarea
                      placeholder="Enter notes..."
                      value={attachments.adminNotes}
                      onChange={(e) =>
                        setAttachments({
                          ...attachments,
                          adminNotes: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </>
                )}
                <label className="font-semibold mb-2">
                  Advertisement text{" "}
                  <span className="text-xs">
                    (This will be the text that will appear in the printing
                    form)
                  </span>{" "}
                </label>
                <textarea
                  value={attachments.changedText}
                  onChange={(e) =>
                    setAttachments({
                      ...attachments,
                      changedText: e.target.value,
                    })
                  }
                  className={`w-full h-56 rounded-xl border p-4 text-gray-800 resize-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none`}
                />
              </div>

              {/* FOOTER (fixed) */}
              <div className="border-t flex justify-end gap-3 p-4 bg-white">
                <button
                  onClick={() => setShowAttachmentView(false)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentView(false);
                    handlePrintRequest(attachments);
                  }}
                  className="px-4 py-2 text-sm bg-[var(--color-primary-dark)] text-white rounded-lg"
                >
                  Continue to Print
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
