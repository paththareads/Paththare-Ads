"use client";

import { Prisma } from "@prisma/client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const DEFAULT_AD_TYPE = {
  typeKey: "classified",
  name: "",
  baseType: "",
  countFirstWords: 0,
  basePrice: 0,
  additionalWordPrice: 0,
  taxAmount: 0,
  colorOptions: [],
  tintColorPrice: 0,
  priorityPrice: 0,
  copaperPrice: 0,
  internetBWPrice: 0,
  internetFCPrice: 0,
  internetHighlightPrice: 0,
  isAllowCombined: false,
  maxWords: 1,
  categories: "",
  imgUrl: "",
  isUploadImage: false,
  extraNotes1: "",
  extraNotes2: "",
  csColBWPrice: 0,
  csColBWOneColorPrice: 0,
  csColBWTwoColorPrice: 0,
  csColFullColorPrice: 0,
  csPageBWPrice: 0,
  csPageBWOneColorPrice: 0,
  csPageBWTwoColorPrice: 0,
  csPageFullColorPrice: 0,
  sections: [],
};

const EMPTY_SECTION = {
  name: "",
  extraNotes: "",
  isAvailable: true,
  sizes: [],
};

const createEmptySection = () => ({
  name: "",
  extraNotes: "",
  isAvailable: true,
  isSingleColumn: false,
  sizes: [],

  supportsBoxAds: false,
  maxBoxes: null,
  boxPricing: [],
});

const EMPTY_SIZE = {
  sizeType: "",
  width: 0,
  height: 0,
  colorOption: "",
  price: 0,
  isSaved: false,
  isAvailable: true,
  error: "",
};

const AD_TYPE_OPTIONS = [
  "classified",
  "photo_classified",
  "casual",
  "death_notice",
  "marriage",
  "name_notice",
];

export default function AddEditModal({ item, onClose, onSaved }: any) {
  const [form, setForm] = useState(
    item || {
      name: "",
      type: "Daily",
      name_sinhala: "",
      noColPerPage: 0,
      colWidth: 0,
      colHeight: 0,
      minAdHeight: 0,
      tintAdditionalCharge: 0,
      newspaperimg: "", // kept but unused
      language: "",
      is_lang_combine_allowed: false,
      combine_eng_price: 0,
      combine_tam_price: 0,
      combine_eng_tam_price: 0,
      combine_sin_price: 0,
      combine_sin_eng_price: 0,
      combine_sin_tam_price: 0,
      allowed_weekdays: [],
      allowed_month_days: [],
      publisher_email: "",
      lm_image: "",
      lm_description: "",
      ad_time_limit: 0,
      day_before: "1",
    },
  );

  const [typeError, setTypeError] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const [adTypeOptions, setAdTypeOptions] = useState<string[]>([]);

  const [modalAlert, setModalAlert] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validate = () => {
    const newErrors: any = {};
    if (!form.name?.trim()) newErrors.name = "Newspaper name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [adTypes, setAdTypes] = useState<any[]>(() => {
    if (!item || !Array.isArray(item.ad_types)) return [];

    return item.ad_types.map((t: any) => ({
      typeKey: t.key,
      name: t.name,
      // baseType: t.base_type,
      baseType:
        (t.base_type || "").toLowerCase() === "casual"
          ? "casual"
          : "classified",
      countFirstWords: t.count_first_words,
      basePrice: t.base_price,
      priorityPrice: t.priority_price,
      taxAmount: t.tax_amount_2,
      additionalWordPrice: t.additional_word_price,
      tintColorPrice: t.tint_color_price,
      copaperPrice: t.co_paper_price,
      internetBWPrice: t.internet_bw_price,
      internetFCPrice: t.internet_fc_price,
      internetHighlightPrice: t.internet_highlight_price,
      isAllowCombined: t.is_allow_combined,
      maxWords: t.max_words,
      imgUrl: t.img_url || "",
      isUploadImage: t.is_upload_image,
      csColBWPrice: t.cs_col_bw_price,
      csColBWOneColorPrice: t.cs_col_bw_one_color_price,
      csColBWTwoColorPrice: t.cs_col_bw_two_color_price,
      csColFullColorPrice: t.cs_col_full_color_price,
      csPageBWPrice: t.cs_page_bw_price,
      csPageBWOneColorPrice: t.cs_page_bw_one_color_price,
      csPageBWTwoColorPrice: t.cs_page_bw_two_color_price,
      csPageFullColorPrice: t.cs_page_full_color_price,
      extraNotes1: t.extra_notes1 || "",
      extraNotes2: t.extra_notes2 || "",
      categories: "",
      colorOptions: [],
      sections: [],
    }));
  });

  const addNewAdType = () => {
    // Find first available type that isn't already selected
    const usedTypes = adTypes.map((t) => t.typeKey);
    const firstAvailableType =
      AD_TYPE_OPTIONS.find((opt) => !usedTypes.includes(opt)) ||
      AD_TYPE_OPTIONS[0];

    setAdTypes([
      ...adTypes,
      { ...DEFAULT_AD_TYPE, typeKey: firstAvailableType },
    ]);
  };

  const handleAddNewAdType = () => {
    const usedTypes = adTypes.map((t) => t.typeKey);
    const firstAvailableType = AD_TYPE_OPTIONS.find(
      (opt) => !usedTypes.includes(opt),
    );

    if (!firstAvailableType) {
      // Show inline alert instead of toast
      setModalAlert("All ad types have already been added for this newspaper!");
      return;
    }

    // Clear any previous alert
    setModalAlert(null);

    // Add new ad type
    setAdTypes([
      ...adTypes,
      { ...DEFAULT_AD_TYPE, typeKey: firstAvailableType },
    ]);
  };

  const updateAdType = (index: number, key: string, value: any) => {
    const updated = [...adTypes];
    updated[index][key] = value;
    setAdTypes(updated);
  };

  const addSection = (adTypeIndex: number) => {
    const updated = [...adTypes];

    if (!updated[adTypeIndex].sections) {
      updated[adTypeIndex].sections = [];
    }

    updated[adTypeIndex].sections.push(createEmptySection());
    setAdTypes(updated);
  };

  const addSize = (adTypeIndex: number, sectionIndex: number) => {
    const updated = [...adTypes];
    updated[adTypeIndex].sections[sectionIndex].sizes.push({ ...EMPTY_SIZE });
    setAdTypes(updated);
  };

  const updateSize = (
    adTypeIndex: number,
    sectionIndex: number,
    sizeIndex: number,
    key: string,
    value: any,
  ) => {
    const updated = [...adTypes];
    updated[adTypeIndex].sections[sectionIndex].sizes[sizeIndex][key] = value;
    setAdTypes(updated);
  };

  // ISO weekday numbers
  const WEEKDAYS = [
    { id: 1, label: "Mon", full: "Monday" },
    { id: 2, label: "Tue", full: "Tuesday" },
    { id: 3, label: "Wed", full: "Wednesday" },
    { id: 4, label: "Thu", full: "Thursday" },
    { id: 5, label: "Fri", full: "Friday" },
    { id: 6, label: "Sat", full: "Saturday" },
    { id: 7, label: "Sun", full: "Sunday" },
  ];

  const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  // const [allowed_weekdays, setallowed_weekdays] = useState<number[]>([]);

  /* --------------------------------------------------
     IMAGE UPLOAD (COMMENTED FOR NOW)
  -------------------------------------------------- */

  /*
  const handleNewspaperImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ext = file.name.split(".").pop();
    const fileName = `${form.type
      .replace(/\s+/g, "")
      .toLowerCase()}${randomNum}.${ext}`;

    const formData = new FormData();
    formData.append("file", new File([file], fileName));

    try {
      const res = await fetch("/api/uploadNewspaperImage", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.fileName) setForm({ ...form, newspaperimg: data.fileName });
    } catch (err) {
      console.error(err);
    }
  };
  */
  async function uploadImageToCloudinary(
    file: File,
    onProgress?: (percent: number) => void,
  ) {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload error"));

      xhr.send(formData);
    });
  }

  /* ---------------- SAVE ---------------- */
  const save = async () => {
    if (!validate()) return;

    if (adTypes.length === 0) {
      setTypeError(true);
      toast.error("At least one ad type must be added");
      return;
    }

    setTypeError(false);
    setIsSaving(true);

    const payload = {
      id: item?.id || form.name.replace(/\s+/g, "_").toUpperCase(),
      name: form.name,
      name_sinhala: form.name_sinhala,
      type: form.type,
      no_col_per_page: Number(form.noColPerPage),
      col_width: Number(form.colWidth),
      col_height: Number(form.colHeight),
      min_ad_height: Number(form.minAdHeight),
      tint_additional_charge: Number(form.tintAdditionalCharge),
      newspaper_img: null, // image upload disabled
      language: form.language,
      is_lang_combine_allowed: Boolean(form.is_lang_combine_allowed),
      combine_eng_price: Number(form.combine_eng_price),
      combine_tam_price: Number(form.combine_tam_price),
      combine_eng_tam_price: Number(form.combine_eng_tam_price),
      combine_sin_price: Number(form.combine_sin_price),
      combine_sin_eng_price: Number(form.combine_sin_eng_price),
      combine_sin_tam_price: Number(form.combine_sin_tam_price),
      allowed_month_days: form.allowed_month_days,
      allowed_weekdays: form.allowed_weekdays,
      publisher_email: form.publisher_email,
      lm_image: form.lm_image,
      lm_description: form.lm_description,
      ad_time_limit: form.ad_time_limit,
      day_before: form.day_before,
      ad_types: adTypes.map((t) => ({
        key: t.typeKey,
        name: t.name,
        base_type: t.baseType,
        count_first_words: Number(t.countFirstWords),
        base_price: Number(t.basePrice),
        additional_word_price: Number(t.additionalWordPrice),
        tint_color_price: Number(t.tintColorPrice),
        co_paper_price: Number(t.copaperPrice),
        internet_bw_price: Number(t.internetBWPrice),
        internet_fc_price: Number(t.internetFCPrice),
        internet_highlight_price: Number(t.internetHighlightPrice),
        is_allow_combined: Boolean(t.isAllowCombined),
        max_words: Number(t.maxWords),
        img_url: t.imgUrl || null,
        priority_price: Number(t.priorityPrice),
        tax_amount_2: Number(t.taxAmount),
        is_upload_image: Boolean(t.isUploadImage),
        cs_col_bw_price: Number(t.csColBWPrice),
        cs_col_bw_one_color_price: Number(t.csColBWOneColorPrice),
        cs_col_bw_two_color_price: Number(t.csColBWTwoColorPrice),
        cs_col_full_color_price: Number(t.csColFullColorPrice),
        cs_page_bw_price: Number(t.csPageBWPrice),
        cs_page_bw_one_color_price: Number(t.csPageBWOneColorPrice),
        cs_page_bw_two_color_price: Number(t.csPageBWTwoColorPrice),
        cs_page_full_color_price: Number(t.csPageFullColorPrice),
        extra_notes1: t.extraNotes1 || null,
        extra_notes2: t.extraNotes2 || null,
        sections: t.sections.map((s: any) => ({
          name: s.name,
          extra_notes: s.extraNotes,
          is_available: s.isAvailable,
          is_single_column: s.isSingleColumn,
          supports_box_ads: Boolean(s.supportsBoxAds),
          max_boxes: s.maxBoxes ? Number(s.maxBoxes) : null,

          ad_section_box_pricing: s.supportsBoxAds
            ? s.boxPricing.map((bp: any) => ({
                box_number: Number(bp.boxNumber),
                price: Number(bp.price),
                extra_note_1: bp.extraNote1 || null,
                extra_note_2: bp.extraNote2 || null,
              }))
            : [],
          sizes: s.sizes.map((z: any) => ({
            size_type: z.sizeType,
            width: z.width,
            height: z.height,
            color_option: z.colorOption,
            price: z.price,
            is_available: z.isAvailable,
          })),
        })),
      })),
    };

    try {
      const res = await fetch(
        item?.id ? `/api/newspapers/${item.id}` : "/api/newspapers",
        {
          method: item?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save newspaper");
      }

      toast.success(
        item?.id
          ? "Newspaper updated successfully"
          : "Newspaper created successfully",
      );
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!item?.id) return;

    const loadForEdit = async () => {
      try {
        const res = await fetch(`/api/newspapers/${item.id}`);
        if (!res.ok) throw new Error("Failed to load newspaper");

        const data = await res.json();

        // 1️⃣ Populate newspaper form
        setForm({
          name: data.name,
          name_sinhala: data.name_sinhala,
          type: data.type,
          noColPerPage: data.no_col_per_page,
          colWidth: data.col_width,
          colHeight: data.col_height,
          minAdHeight: data.min_ad_height,
          tintAdditionalCharge: data.tint_additional_charge,
          newspaperimg: data.newspaper_img || "",
          language: data.language,
          is_lang_combine_allowed: data.is_lang_combine_allowed,
          combine_eng_price: data.combine_eng_price,
          combine_tam_price: data.combine_tam_price,
          combine_eng_tam_price: data.combine_eng_tam_price,
          combine_sin_price: data.combine_sin_price,
          combine_sin_eng_price: data.combine_sin_eng_price,
          combine_sin_tam_price: data.combine_sin_tam_price,
          allowed_month_days: data.allowed_month_days,
          allowed_weekdays: data.allowed_weekdays,
          publisher_email: data.publisher_email,
          lm_image: data.lm_image,
          lm_description: data.lm_description,
          ad_time_limit: data.ad_time_limit,
          day_before: data.day_before,
        });

        // 2️⃣ Populate ad types with sections + sizes
        if (Array.isArray(data.ad_types)) {
          setAdTypes(
            data.ad_types.map((t: any) => ({
              typeKey: t.key,
              name: t.name,
              baseType: t.base_type,
              countFirstWords: t.count_first_words,
              basePrice: t.base_price,
              additionalWordPrice: t.additional_word_price,
              tintColorPrice: t.tint_color_price,
              copaperPrice: t.co_paper_price,
              internetBWPrice: t.internet_bw_price,
              internetFCPrice: t.internet_fc_price,
              internetHighlightPrice: t.internet_highlight_price,
              priorityPrice: t.priority_price ?? 0,
              taxAmount: t.tax_amount_2 ?? 0.0,
              isAllowCombined: t.is_allow_combined,
              maxWords: t.max_words,
              imgUrl: t.img_url || "",
              isUploadImage: t.is_upload_image,
              csColBWPrice: t.cs_col_bw_price,
              csColBWOneColorPrice: t.cs_col_bw_one_color_price,
              csColBWTwoColorPrice: t.cs_col_bw_two_color_price,
              csColFullColorPrice: t.cs_col_full_color_price,
              csPageBWPrice: t.cs_page_bw_price,
              csPageBWOneColorPrice: t.cs_page_bw_one_color_price,
              csPageBWTwoColorPrice: t.cs_page_bw_two_color_price,
              csPageFullColorPrice: t.cs_page_full_color_price,
              extraNotes1: t.extra_notes1 || "",
              extraNotes2: t.extra_notes2 || "",
              categories: "",
              colorOptions: [],
              sections: Array.isArray(t.ad_sections)
                ? t.ad_sections.map((sec: any) => ({
                    name: sec.name,
                    extraNotes: sec.extra_notes || "",
                    isAvailable: sec.is_available,
                    isSingleColumn: sec.is_single_column,
                    supportsBoxAds: Boolean(sec.supports_box_ads),
                    maxBoxes: sec.max_boxes ?? null,

                    boxPricing: Array.isArray(sec.ad_section_box_pricing)
                      ? sec.ad_section_box_pricing.map((bp: any) => ({
                          boxNumber: bp.box_number_dec,
                          price: bp.price,
                          extraNote1: bp.extra_note_1 || "",
                          extraNote2: bp.extra_note_2 || "",
                        }))
                      : [],
                    sizes: Array.isArray(sec.ad_section_sizes)
                      ? sec.ad_section_sizes.map((sz: any) => ({
                          sizeType: sz.size_type,
                          width: sz.width,
                          height: sz.height,
                          colorOption: sz.color_option,
                          price: sz.price,
                          isSaved: true, // mark existing sizes as saved
                          isAvailable: sz.is_available,
                        }))
                      : [],
                  }))
                : [],
            })),
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load newspaper data");
      }
    };

    loadForEdit();
  }, [item?.id]);

  useEffect(() => {
    if (item) return; // do NOT override on edit

    setForm((prev: { type: string }) => {
      if (prev.type === "Daily")
        return { ...prev, allowed_weekdays: [1, 2, 3, 4, 5, 6, 7] };

      if (prev.type === "Sunday") return { ...prev, allowed_weekdays: [7] };

      if (prev.type === "Weekly") return { ...prev, allowed_weekdays: [] };

      return prev;
    });
  }, [form.type, item]);

  const updateAdTypeSafe = (index: number, updater: (prev: any) => any) => {
    setAdTypes((prev) => {
      const next = [...prev];
      next[index] = updater(next[index]);
      return next;
    });
  };

  useEffect(() => {
    async function fetchAdTypes() {
      try {
        const res = await fetch("/api/ad-types?limit=100");
        const json = await res.json();

        const codes = json.data
          .map((item: any) => item.ad_type_name_code)
          .filter(Boolean); // safety

        setAdTypeOptions(codes);
      } catch (err) {
        console.error("Failed to load ad type options", err);
      }
    }

    fetchAdTypes();
  }, []);

  const combinedLanguageInputs =
    form.language === "SI"
      ? [
          ["English Paper Price", "combine_eng_price"],
          ["Tamil Paper Price", "combine_tam_price"],
          ["English & Tamil Both Price", "combine_eng_tam_price"],
        ]
      : form.language === "EN"
        ? [
            ["Sinhala Paper Price", "combine_sin_price"],
            ["Tamil Paper Price", "combine_tam_price"],
            ["Sinhala & Tamil Paper Price", "combine_sin_tam_price"],
          ]
        : [
            ["Sinhala Paper Price", "combine_sin_price"],
            ["English Paper Price", "combine_eng_price"],
            ["Sinhala & English Paper Price", "combine_sin_eng_price"],
          ];

  function parseStyledText(text: string) {
    const elements: any[] = [];
    let buffer = "";
    let mode: "normal" | "bold" | "italic" = "normal";

    for (let i = 0; i < text.length; i++) {
      // Bold start
      if (text[i] === "\\" && text[i + 1] === "b") {
        if (buffer) elements.push({ text: buffer, mode });
        buffer = "";
        mode = "bold";
        i++;
        continue;
      }

      // Italic start
      if (text[i] === "\\" && text[i + 1] === "i") {
        if (buffer) elements.push({ text: buffer, mode });
        buffer = "";
        mode = "italic";
        i++;
        continue;
      }

      // End styling (\\)
      if (text[i] === "\\" && text[i + 1] === "\\") {
        if (buffer) elements.push({ text: buffer, mode });
        buffer = "";
        mode = "normal";
        i++;
        continue;
      }

      // Line break (\n)
      if (text[i] === "\\" && text[i + 1] === "n") {
        if (buffer) elements.push({ text: buffer, mode });
        elements.push({ type: "br" });
        buffer = "";
        i++;
        continue;
      }

      buffer += text[i];
    }

    if (buffer) elements.push({ text: buffer, mode });

    return elements;
  }
  // components/NewspaperSkeleton.tsx
  function NewspaperSkeleton() {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Newspaper Name */}
        <div className="h-6 w-3/5 bg-gray-300 rounded"></div>
        {/* Sinhala Name */}
        <div className="h-6 w-2/5 bg-gray-300 rounded"></div>
        {/* Type / Columns */}
        <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-300 rounded-lg p-4 flex flex-col items-center"
            >
              {/* Ad image placeholder */}
              <div className="w-[120px] h-[120px] bg-gray-300 rounded mb-2"></div>
              {/* Ad name */}
              <div className="h-4 w-2/3 bg-gray-300 rounded mb-1"></div>
              {/* Extra notes */}
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-4 md:w-2/3 mx-auto md:mt-8">
          <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-6 w-1/3 bg-gray-300 rounded mt-4"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <>
      {!adTypes ? (
        <NewspaperSkeleton />
      ) : (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-6 md:p-10">
          <div className="w-full max-w-[1200px] space-y-8 rounded-2xl bg-white p-6 md:p-8 shadow-2xl">
            {/* Header */}
            <div className="border-b pb-4 flex items-start justify-between gap-4">
              {/* Title + subtitle */}
              <div>
                <h2 className="text-2xl font-semibold text-[var(--color-primary-dark)]">
                  {item ? "Edit Newspaper" : "Add Newspaper"}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-highlight)]">
                  Configure newspaper properties and advertisement types
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-200 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Newspaper Details */}
            <div className="rounded-2xl border bg-[var(--color-orange-accent)]/10 p-5">
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-primary-dark)]">
                Newspaper Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Newspaper Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                      errors.name
                        ? "border-red-500 animate-shake"
                        : "border-gray-300"
                    }`}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setErrors({ ...errors, name: undefined });
                    }}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Sinhala Name */}
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-[var(--color-text)]">
                    <span>Newspaper Name (Sinhala)</span>

                    <span className="text-sm border-1 rounded py-.05 px-4 border-[var(--color-primary-accent)]">
                      <a
                        href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click here to use Sinhala typing tool"
                        className="text-blue-800 hover:text-blue-600 whitespace-nowrap"
                      >
                        සිං
                      </a>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={form.name_sinhala}
                    onChange={(e) =>
                      setForm({ ...form, name_sinhala: e.target.value })
                    }
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block font-medium text-[var(--color-text)]">
                    Type{"  "}
                    <span
                      className="text-sm text-primary"
                      title="Cannot be changed after saved!"
                    >
                      ⓘ
                    </span>
                  </label>
                  <select
                    disabled={!!item}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option>Daily</option>
                    <option>Sunday</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                {form.type != "Monthly" && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Publishing Days
                    </label>

                    <div className="grid grid-cols-7 gap-2">
                      {WEEKDAYS.map((day) => {
                        const isSelected = form.allowed_weekdays.includes(
                          day.id,
                        ); // ✅ use form state

                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() =>
                              setForm((prev: any) => ({
                                ...prev,
                                allowed_weekdays: isSelected
                                  ? prev.allowed_weekdays.filter(
                                      (d: any) => d !== day.id,
                                    )
                                  : [...prev.allowed_weekdays, day.id].sort(),
                              }))
                            }
                            className={`h-8 rounded-lg border text-sm font-medium transition-all flex flex-col items-center justify-center ${isSelected ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary)]" : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary-accent)]"}`}
                          >
                            <span>{day.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-xs text-[var(--color-text-highlight)]">
                      Only future dates matching these days will be selectable
                    </p>
                  </div>
                )}
                {form.type === "Monthly" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Publishing Dates (Monthly)
                    </label>

                    <div className="grid grid-cols-7 gap-2">
                      {MONTH_DAYS.map((day) => {
                        const isSelected =
                          form.allowed_month_days.includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setForm((prev: any) => ({
                                ...prev,
                                allowed_month_days: isSelected
                                  ? prev.allowed_month_days.filter(
                                      (d: number) => d !== day,
                                    )
                                  : [...prev.allowed_month_days, day].sort(
                                      (a, b) => a - b,
                                    ),
                              }))
                            }
                            className={`h-8 rounded-lg border text-sm font-medium transition-all
              ${
                isSelected
                  ? "bg-[var(--color-primary-dark)] text-white"
                  : "bg-white border-gray-300"
              }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      If a selected date doesn’t exist in a month (e.g. 31st in
                      February), it will be skipped automatically.
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {/* Metrics */}
                {[
                  ["Columns per Page", "noColPerPage"],
                  ["Column Width (cm)", "colWidth"],
                  ["Column Height (cm)", "colHeight"],
                  ["Minimum Ad Height (cm)", "minAdHeight"],
                  ["Tint Additional Charge", "tintAdditionalCharge"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={key === "tintAdditionalCharge" ? 50 : 1}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      value={(form as any)[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* LEFT: Language Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text)]">
                    Newspaper Language
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "SI", label: "Sinhala" },
                      { key: "EN", label: "English" },
                      { key: "TA", label: "Tamil" },
                    ].map((lang) => {
                      const isSelected = form.language === lang.key;

                      return (
                        <button
                          key={lang.key}
                          type="button"
                          onClick={() =>
                            setForm((prev: any) => ({
                              ...prev,
                              language: lang.key,
                            }))
                          }
                          className={`h-9 rounded-lg border text-sm font-medium transition-all ${isSelected ? "bg-[var(--color-primary-dark)] text-white" : "bg-white border-gray-300 hover:border-[var(--color-primary)]"}`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Select the primary publishing language for this newspaper.
                  </p>
                </div>

                {/* RIGHT: Allow Combined Languages */}
                <div className="mt-6 md:mt-0">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={form.is_lang_combine_allowed}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is_lang_combine_allowed: e.target.checked,
                          ...(e.target.checked
                            ? {}
                            : {
                                combine_eng_price: 0,
                                combine_tam_price: 0,
                                combine_eng_tam_price: 0,
                              }),
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
                    />
                    Allow Combined Languages
                  </label>

                  <p className="mt-2 text-xs text-gray-500">
                    Enable pricing for combined-language advertisements.
                  </p>
                </div>
              </div>

              {form.is_lang_combine_allowed && (
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {combinedLanguageInputs.map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-[var(--color-text)]">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        value={(form as any)[key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div className="mt-8 col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Publisher Email
                  </label>
                  <input
                    type="text"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300`}
                    value={form.publisher_email}
                    onChange={(e) => {
                      setForm({ ...form, publisher_email: e.target.value });
                    }}
                  />
                </div>
                <div className="mt-8 col-span-1">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Days Before
                  </label>
                  <select
                    value={form.day_before || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        day_before: String(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"
                  >
                    <option value="">Select days</option>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                {/* {form.type === "Weekly" && (
                  <div className="mt-8 col-span-1">
                    <label className="block text-sm font-medium text-[var(--color-text)]">
                      Day Before
                    </label>
                    <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"></select>
                  </div>
                )}
                {form.type === "Monthly" && (
                  <div className="mt-8 col-span-1">
                    <label className="block text-sm font-medium text-[var(--color-text)]">
                      Date Before
                    </label>
                    <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"></select>
                  </div>
                )} */}
                <div className="mt-8 col-span-1">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Time Before
                  </label>

                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"
                    value={form.ad_time_limit || 22}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ad_time_limit: parseInt(e.target.value, 10),
                      })
                    }
                  >
                    <option value="" disabled>
                      Select Hour
                    </option>

                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  Learn More Image
                </label>

                {/* Image Upload */}
                <div
                  className="mt-2 flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;

                    if (file.size > 15 * 1024 * 1024) {
                      alert("Image must be less than 15MB");
                      return;
                    }

                    try {
                      setUploading(true);
                      setUploadProgress(0);

                      const res = await uploadImageToCloudinary(
                        file,
                        (percent) => {
                          setUploadProgress(percent);
                        },
                      );

                      setForm({
                        ...form,
                        lm_image: res.secure_url,
                      });
                    } catch {
                      alert("Image upload failed");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  onClick={() =>
                    document.getElementById("hiddenFileInput")?.click()
                  }
                >
                  Drag & Drop image here or click to upload
                </div>

                {/* Hidden fallback input */}
                <input
                  id="hiddenFileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.size > 15 * 1024 * 1024) {
                      alert("Image must be less than 15MB");
                      return;
                    }

                    try {
                      setUploading(true);
                      setUploadProgress(0);

                      const res = await uploadImageToCloudinary(
                        file,
                        (percent) => {
                          setUploadProgress(percent);
                        },
                      );

                      setForm({
                        ...form,
                        lm_image: res.secure_url,
                      });
                    } catch {
                      alert("Image upload failed");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />

                {/* Upload Progress */}
                {uploading && (
                  <p className="mt-2 text-xs text-gray-500">
                    Uploading... {uploadProgress}%
                  </p>
                )}

                {/* Preview */}
                {form.lm_image && (
                  <img
                    src={form.lm_image}
                    alt="Preview"
                    className="mt-3 h-32 rounded-lg border object-cover"
                  />
                )}

                {/* Text Area */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Learn More Description
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none border-gray-300"
                    value={form.lm_description || ""}
                    onChange={(e) => {
                      setForm({ ...form, lm_description: e.target.value });
                    }}
                  />

                  {/* Tip */}
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: Use <span className="font-mono">\b</span> for bold,{" "}
                    <span className="font-mono">\i</span> for italic. Use{" "}
                    <span className="font-mono">\\</span> to end each styling.
                    Use <span className="font-mono">\n</span> for line break.
                  </p>
                </div>

                {form.lm_description && (
                  <div className="mt-4 p-3 text-sm bg-gray-50">
                    <div className="mb-4">
                      <p className="font-semibold">Preview: </p>
                    </div>
                    {parseStyledText(form.lm_description).map((part, index) => {
                      if (part.type === "br") {
                        return <br key={index} />;
                      }

                      if (part.mode === "bold") {
                        return (
                          <span key={index} className="font-semibold">
                            {part.text}
                          </span>
                        );
                      }

                      if (part.mode === "italic") {
                        return (
                          <span key={index} className="italic">
                            {part.text}
                          </span>
                        );
                      }

                      return <span key={index}>{part.text}</span>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Type Error */}
            {typeError && (
              <p className="text-center text-sm font-medium text-red-600">
                At least one type should be added!
              </p>
            )}

            {/* Types of Ads */}
            <div className="rounded-2xl border bg-gray-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                  Types of Ads
                </h3>
                <button
                  onClick={handleAddNewAdType}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
                >
                  Add New Type
                </button>
              </div>

              {adTypes.length === 0 && (
                <p className="text-sm text-gray-500">No ad types added yet.</p>
              )}

              {adTypes.map((t, index) => {
                const DEFAULT_PRICE_FIELDS = [
                  ["Base Price", "basePrice", "number", "Cost of first words"],
                  [
                    "Additional Word Price",
                    "additionalWordPrice",
                    "number",
                    "Price for each additional word",
                  ],
                  [
                    "Tint Color Price",
                    "tintColorPrice",
                    "number",
                    "Cost for tint",
                  ],
                  ["C/O Paper Price", "copaperPrice", "number", "Cost for C/O"],
                  [
                    "Internet B/W Price",
                    "internetBWPrice",
                    "number",
                    "Cost for Internet BW",
                  ],
                  [
                    "Internet F/C Price",
                    "internetFCPrice",
                    "number",
                    "Cost for Internet F/C",
                  ],
                  [
                    "Internet Highlight Price",
                    "internetHighlightPrice",
                    "number",
                    "Cost for Internet Highlight",
                  ],
                  [
                    "Tax Amount (Vat %)",
                    "taxAmount",
                    "number",
                    "Cost for tint",
                  ],
                ];

                const CASUAL_PRICE_FIELDS = [
                  [
                    "Tax Amount (Vat %)",
                    "taxAmount",
                    "number",
                    "Cost for tint",
                  ],
                ];

                const priceFields =
                  t.typeKey === "casual"
                    ? CASUAL_PRICE_FIELDS
                    : DEFAULT_PRICE_FIELDS;

                return (
                  <div
                    key={index}
                    className="mb-5 rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-[var(--color-primary-dark)]">
                      Ad Type #{index + 1}
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 my-4">
                      {/* Type Selector */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)]">
                          Select Type Key
                        </label>
                        <select
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.typeKey}
                          onChange={(e) =>
                            updateAdType(index, "typeKey", e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select ad type
                          </option>

                          {adTypeOptions.map((opt) => {
                            // Disable if already selected in another row
                            const isDisabled = adTypes.some(
                              (other, otherIndex) =>
                                otherIndex !== index && other.typeKey === opt,
                            );

                            return (
                              <option
                                key={opt}
                                value={opt}
                                disabled={isDisabled}
                                title={isDisabled ? "Already selected" : ""}
                              >
                                {opt.replace(/_/g, " ")}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                          Base Type
                        </label>

                        <div className="flex gap-6">
                          {["classified", "casual"].map((option) => {
                            const isChecked = t.baseType === option;

                            return (
                              <label
                                key={option}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`baseType-${index}`}
                                  value={option}
                                  checked={isChecked}
                                  onChange={() =>
                                    updateAdType(index, "baseType", option)
                                  }
                                  className="accent-[var(--color-primary)]"
                                />

                                {option.charAt(0).toUpperCase() +
                                  option.slice(1)}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {/* Static Fields */}
                      {[
                        [
                          "Display Name",
                          "name",
                          "text",
                          "The name displayed to the user",
                        ],
                        // [
                        //   "Base Type (Optional)",
                        //   "baseType",
                        //   "text",
                        //   "classified or casual",
                        // ],
                        [
                          "Max Words",
                          "maxWords",
                          "number",
                          "Maximum words allowed",
                        ],
                        ...(form.type === "Sunday" &&
                        (t.typeKey === "classified" || t.typeKey === "marriage")
                          ? [
                              [
                                "Priority Price",
                                "priorityPrice",
                                "number",
                                "Priority Price",
                              ],
                            ]
                          : []),
                        ...(t.typeKey !== "casual"
                          ? [
                              [
                                "First Word Count",
                                "countFirstWords",
                                "number",
                                "No of words before user is charged for additional words",
                              ],
                            ]
                          : []),
                        // ["Tax", "taxAmount", "number"],
                      ].map(([label, key, type, placeholder]) => {
                        const isMaxWords = key === "maxWords";
                        const isFirstWordCount = key === "countFirstWords";

                        // Dynamic warning
                        const warning =
                          isFirstWordCount && t.countFirstWords > t.maxWords
                            ? `First Word Count cannot exceed Max Words (${t.maxWords})`
                            : "";
                        const maxFirst = 0;
                        return (
                          <div key={key as string}>
                            <label className="block text-sm font-medium text-[var(--color-text)]">
                              {label}
                            </label>

                            <input
                              type={type as string}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                                warning ? "border-red-500" : "border-gray-300"
                              }`}
                              value={(t as any)[key] ?? ""}
                              onChange={(e) => {
                                let value: any =
                                  type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value;

                                // If updating Max Words, update normally
                                if (isMaxWords) {
                                  updateAdType(index, key, value);

                                  // Ensure First Word Count doesn't exceed new Max Words
                                  if (t.countFirstWords > value) {
                                    updateAdType(
                                      index,
                                      "countFirstWords",
                                      value,
                                    );
                                  }
                                  return;
                                }

                                // Prevent First Word Count from exceeding Max Words
                                if (isFirstWordCount) {
                                  if (value > t.maxWords) {
                                    value = t.maxWords;
                                  }
                                }

                                updateAdType(index, key, value);
                              }}
                              {...(type === "number"
                                ? {
                                    step: 1,
                                    min: 0,
                                    max: isFirstWordCount
                                      ? t.maxWords
                                      : undefined,
                                  }
                                : { placeholder: placeholder as string })}
                            />

                            {/* Warning message */}
                            {warning && (
                              <p className="mt-1 text-xs text-red-500 font-medium">
                                {warning}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      {/* CONDITIONAL PRICE FIELDS */}
                      {priceFields.map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-[var(--color-text)]">
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={(t as any)[key] ?? ""}
                            onChange={(e) =>
                              updateAdType(index, key, Number(e.target.value))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 my-4">
                      {/* Toggles */}
                      <div className="flex items-center gap-2 md:col-span-4">
                        <div id="reqImg" className="flex items-center gap-1">
                          <input
                            className="h-5 w-5 accent-[var(--color-primary)]"
                            type="checkbox"
                            checked={t.isUploadImage}
                            onChange={(e) =>
                              updateAdType(
                                index,
                                "isUploadImage",
                                e.target.checked,
                              )
                            }
                          />
                          <span className="text-sm">Require Image Upload</span>
                        </div>
                      </div>

                      {/* <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={t.isAllowCombined}
                          onChange={(e) =>
                            updateAdType(
                              index,
                              "isAllowCombined",
                              e.target.checked
                            )
                          }
                        />
                        <span className="text-sm">Allow Combined</span>
                      </div> */}

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">
                          Extra Notes 1
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.extraNotes1 ?? ""}
                          onChange={(e) =>
                            updateAdType(index, "extraNotes1", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">
                          Extra Notes 2
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.extraNotes2 ?? ""}
                          onChange={(e) =>
                            updateAdType(index, "extraNotes2", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {t.typeKey === "casual" && (
                      <>
                        {/* AD SIZES TABLE */}
                        <div className="mt-6 space-y-6">
                          <div className="w-full flex justify-center">
                            <button
                              type="button"
                              onClick={() => addSection(index)}
                              className="rounded-md bg-primary-dark px-4 py-2 text-sm text-gray-100"
                            >
                              Add New Section
                            </button>
                          </div>

                          {t.sections?.map((section: any, sIndex: number) => (
                            <div key={sIndex} className="rounded-lg border p-4">
                              {/* SECTION HEADER */}
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-5 mt-4 mb-8">
                                <input
                                  type="text"
                                  placeholder="Section name (Main, Thaksalawa...)"
                                  className="md:col-span-1 mt-1 ml-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-center"
                                  value={section.name}
                                  onChange={(e) => {
                                    const updated = [...adTypes];
                                    updated[index].sections[sIndex].name =
                                      e.target.value;
                                    setAdTypes(updated);
                                  }}
                                />

                                <input
                                  type="text"
                                  placeholder="Extra notes"
                                  className="md:col-span-2 mt-1 ml-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-center"
                                  value={section.extraNotes}
                                  onChange={(e) => {
                                    const updated = [...adTypes];
                                    updated[index].sections[sIndex].extraNotes =
                                      e.target.value;
                                    setAdTypes(updated);
                                  }}
                                />

                                <div className="md:col-span-1 flex justify-end items-center gap-2">
                                  <label className=" text-right">
                                    Single Column
                                  </label>
                                  <input
                                    type="checkbox"
                                    checked={section.isSingleColumn ?? false}
                                    onChange={(e) => {
                                      const updated = [...adTypes];
                                      updated[index].sections[
                                        sIndex
                                      ].isSingleColumn = e.target.checked;
                                      setAdTypes(updated);
                                    }}
                                    className="h-5 w-5 accent-[var(--color-primary)]"
                                  />
                                </div>

                                <div className="md:col-span-1 flex justify-end items-center gap-2">
                                  <label className=" text-right">Active</label>
                                  <input
                                    type="checkbox"
                                    checked={section.isAvailable ?? true}
                                    onChange={(e) => {
                                      const updated = [...adTypes];
                                      updated[index].sections[
                                        sIndex
                                      ].isAvailable = e.target.checked;
                                      setAdTypes(updated);
                                    }}
                                    className="h-5 w-5 accent-[var(--color-primary)]"
                                  />
                                </div>
                              </div>

                              {/* ADD SIZE */}
                              {/* SIZES TABLE */}
                              <div className="mt-3 overflow-x-auto mt-4">
                                <table className="w-full border text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border p-2">Size Type</th>
                                      <th className="border p-2">
                                        Width (column)
                                      </th>
                                      <th className="border p-2">
                                        Height (cm)
                                      </th>
                                      <th className="border p-2">Color</th>
                                      <th className="border p-2">Price</th>
                                      <th className="border p-2">✔</th>
                                      <th className="border p-2">
                                        Active
                                      </th>{" "}
                                      {/* New column */}
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {section.sizes.map(
                                      (sz: any, zIndex: number) => (
                                        <>
                                          <tr
                                            key={zIndex}
                                            className={
                                              !sz.isAvailable
                                                ? "opacity-50"
                                                : ""
                                            }
                                          >
                                            <td className="border p-2">
                                              <select
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                                value={sz.sizeType}
                                                onChange={(e) =>
                                                  updateSize(
                                                    index,
                                                    sIndex,
                                                    zIndex,
                                                    "sizeType",
                                                    e.target.value,
                                                  )
                                                }
                                                disabled={!sz.isAvailable} // disable if inactive
                                              >
                                                <option>- Select Size -</option>
                                                <option>full_page</option>
                                                <option>half_page</option>
                                                <option>1/4_page</option>
                                                <option>solus_hr</option>
                                                <option>solus_vr</option>
                                                <option>strip_hr</option>
                                                <option>strip_vr</option>
                                                <option>custom</option>
                                              </select>
                                            </td>

                                            <td className="border p-2">
                                              <input
                                                type="number"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-right"
                                                value={sz.width}
                                                onChange={(e) =>
                                                  updateSize(
                                                    index,
                                                    sIndex,
                                                    zIndex,
                                                    "width",
                                                    Number(e.target.value),
                                                  )
                                                }
                                                disabled={!sz.isAvailable}
                                              />
                                            </td>

                                            <td className="border p-2">
                                              <input
                                                type="number"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-right"
                                                value={sz.height}
                                                onChange={(e) =>
                                                  updateSize(
                                                    index,
                                                    sIndex,
                                                    zIndex,
                                                    "height",
                                                    Number(e.target.value),
                                                  )
                                                }
                                                disabled={!sz.isAvailable}
                                              />
                                            </td>

                                            <td className="border p-2">
                                              <select
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                                value={sz.colorOption}
                                                onChange={(e) =>
                                                  updateSize(
                                                    index,
                                                    sIndex,
                                                    zIndex,
                                                    "colorOption",
                                                    e.target.value,
                                                  )
                                                }
                                                disabled={!sz.isAvailable}
                                              >
                                                <option>
                                                  - Select Color -
                                                </option>
                                                <option>bw</option>
                                                <option>bw1</option>
                                                <option>bw2</option>
                                                <option>fc</option>
                                              </select>
                                            </td>

                                            <td className="border p-2">
                                              <input
                                                type="number"
                                                step={1000}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-right"
                                                value={sz.price}
                                                onChange={(e) =>
                                                  updateSize(
                                                    index,
                                                    sIndex,
                                                    zIndex,
                                                    "price",
                                                    Number(e.target.value),
                                                  )
                                                }
                                                disabled={!sz.isAvailable}
                                              />
                                            </td>

                                            <td className="border p-2 text-center">
                                              <input
                                                type="checkbox"
                                                checked={sz.isSaved}
                                                onChange={(e) => {
                                                  const checked =
                                                    e.target.checked;
                                                  const updated = [...adTypes];
                                                  const row =
                                                    updated[index].sections[
                                                      sIndex
                                                    ].sizes[zIndex];

                                                  if (checked) {
                                                    // ✅ validation rules
                                                    if (
                                                      !row.sizeType ||
                                                      !row.colorOption ||
                                                      row.price <= 0
                                                    ) {
                                                      row.error =
                                                        "Please select size and color before saving.";
                                                      row.isSaved = false;
                                                    } else {
                                                      row.error = "";
                                                      row.isSaved = true;
                                                    }
                                                  } else {
                                                    row.isSaved = false;
                                                    row.error = "";
                                                  }

                                                  setAdTypes(updated);
                                                }}
                                                disabled={!sz.isAvailable}
                                              />
                                            </td>

                                            {/* Active / Inactive toggle */}
                                            <td className="border p-2 text-center">
                                              <input
                                                type="checkbox"
                                                checked={sz.isAvailable ?? true}
                                                onChange={(e) => {
                                                  const updated = [...adTypes];
                                                  updated[index].sections[
                                                    sIndex
                                                  ].sizes[zIndex].isAvailable =
                                                    e.target.checked;
                                                  setAdTypes(updated);
                                                }}
                                                className="h-5 w-5 accent-[var(--color-primary)]"
                                              />
                                            </td>
                                          </tr>
                                          {sz.error && (
                                            <tr>
                                              <td
                                                colSpan={7}
                                                className="border px-3 py-2 text-xs text-red-600 bg-red-50"
                                              >
                                                {sz.error}
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              <div className="w-full flex justify-center mt-4">
                                <button
                                  type="button"
                                  onClick={() => addSize(index, sIndex)}
                                  className="mt-4 text-sm rounded-md border-primary border-1 px-4 py-2 text-primary-dark! hover:text-primary! !bg-transparent"
                                >
                                  Add New Size
                                </button>
                              </div>

                              {/* BOXES TABLE */}
                              <div className="mt-8 rounded-lg border border-gray-400 bg-gray-50 p-4">
                                <label className="flex items-center gap-3 my-4">
                                  <input
                                    type="checkbox"
                                    className="h-6 w-6 accent-[var(--color-primary)]"
                                    checked={section.supportsBoxAds || false}
                                    onChange={(e) => {
                                      const updated = [...adTypes];
                                      updated[index].sections[
                                        sIndex
                                      ].supportsBoxAds = e.target.checked;

                                      if (!e.target.checked) {
                                        updated[index].sections[
                                          sIndex
                                        ].boxPricing = [];
                                        updated[index].sections[
                                          sIndex
                                        ].maxBoxes = null;
                                      }

                                      setAdTypes(updated);
                                    }}
                                  />
                                  <span className="text-sm font-medium">
                                    Enable Box Ads for this section
                                  </span>
                                </label>

                                {section.supportsBoxAds && (
                                  <div className="mt-4 space-y-4">
                                    {/* Max boxes */}
                                    <label className="text-sm font-medium text-[var(--color-text)]">
                                      No of Boxes
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      placeholder="Max no of boxes"
                                      className="mt-1 ml-2 w-full md:w-1/6 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-center"
                                      value={section.maxBoxes ?? ""}
                                      onChange={(e) => {
                                        const updated = [...adTypes];
                                        updated[index].sections[
                                          sIndex
                                        ].maxBoxes = e.target.value
                                          ? Number(e.target.value)
                                          : null;
                                        setAdTypes(updated);
                                      }}
                                    />

                                    {/* BOX PRICING TABLE */}
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full border text-sm">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th className="border px-3 py-2 w-1/6">
                                              Box #
                                            </th>
                                            <th className="border px-3 py-2 w-1/6">
                                              Price
                                            </th>
                                            <th className="border px-3 py-2">
                                              Extra note 1
                                            </th>
                                            <th className="border px-3 py-2">
                                              Extra note 2
                                            </th>
                                            <th className="border px-3 py-2 w-1/12"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {section.boxPricing?.map(
                                            (row: any, rIndex: number) => (
                                              <tr key={rIndex}>
                                                <td className="border px-2 py-1">
                                                  <input
                                                    type="number"
                                                    min={1}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-right"
                                                    value={row.boxNumber}
                                                    onChange={(e) => {
                                                      const updated = [
                                                        ...adTypes,
                                                      ];
                                                      updated[index].sections[
                                                        sIndex
                                                      ].boxPricing[
                                                        rIndex
                                                      ].boxNumber = Number(
                                                        e.target.value,
                                                      );
                                                      setAdTypes(updated);
                                                    }}
                                                  />
                                                </td>

                                                <td className="border px-2 py-1">
                                                  <input
                                                    type="number"
                                                    step={500}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none text-right"
                                                    value={row.price}
                                                    onChange={(e) => {
                                                      const updated = [
                                                        ...adTypes,
                                                      ];
                                                      updated[index].sections[
                                                        sIndex
                                                      ].boxPricing[
                                                        rIndex
                                                      ].price = Number(
                                                        e.target.value,
                                                      );
                                                      setAdTypes(updated);
                                                    }}
                                                  />
                                                </td>

                                                <td className="border px-2 py-1">
                                                  <input
                                                    type="text"
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                                    value={row.extraNote1 || ""}
                                                    onChange={(e) => {
                                                      const updated = [
                                                        ...adTypes,
                                                      ];
                                                      updated[index].sections[
                                                        sIndex
                                                      ].boxPricing[
                                                        rIndex
                                                      ].extraNote1 =
                                                        e.target.value;
                                                      setAdTypes(updated);
                                                    }}
                                                  />
                                                </td>

                                                <td className="border px-2 py-1">
                                                  <input
                                                    type="text"
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                                    value={row.extraNote2 || ""}
                                                    onChange={(e) => {
                                                      const updated = [
                                                        ...adTypes,
                                                      ];
                                                      updated[index].sections[
                                                        sIndex
                                                      ].boxPricing[
                                                        rIndex
                                                      ].extraNote2 =
                                                        e.target.value;
                                                      setAdTypes(updated);
                                                    }}
                                                  />
                                                </td>

                                                <td className="border px-2 py-1 text-center">
                                                  <button
                                                    className="text-white bg-red-900 hover:underline w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center"
                                                    onClick={() => {
                                                      const updated = [
                                                        ...adTypes,
                                                      ];
                                                      updated[index].sections[
                                                        sIndex
                                                      ].boxPricing.splice(
                                                        rIndex,
                                                        1,
                                                      );
                                                      setAdTypes(updated);
                                                    }}
                                                  >
                                                    REMOVE
                                                  </button>
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="w-full flex justify-center">
                                      <button
                                        className="mt-2 mb-8 text-sm rounded-md border-primary border-1 px-4 py-2 text-primary-dark! hover:text-primary! !bg-transparent"
                                        onClick={() => {
                                          const updated = [...adTypes];
                                          updated[index].sections[
                                            sIndex
                                          ].boxPricing.push({
                                            boxNumber: 1,
                                            price: 0,
                                            extraNote1: "",
                                            extraNote2: "",
                                          });
                                          setAdTypes(updated);
                                        }}
                                      >
                                        Add New Box
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {adTypes.length > 0 && (
                <div className="mb-4 flex justify-center items-center">
                  <button
                    onClick={handleAddNewAdType}
                    className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
                  >
                    Add Next Type
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-[var(--color-primary-dark)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary)]"
              >
                Save Newspaper
              </button>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-lg bg-white px-6 py-5 shadow-xl flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]" />

            {/* Text */}
            <p className="text-sm font-medium text-gray-700">
              Saving newspaper, please wait...
            </p>
          </div>
        </div>
      )}
      {modalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-lg bg-white px-6 py-5 shadow-xl flex flex-col items-center gap-4 max-w-sm w-full">
            {/* Optional Icon */}
            <div className="h-10 w-10 text-red-500 flex items-center justify-center">
              ⚠️
            </div>

            {/* Text */}
            <p className="text-sm font-medium text-gray-700 text-center">
              {modalAlert}
            </p>

            {/* OK Button */}
            <button
              onClick={() => setModalAlert(null)}
              className="mt-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
