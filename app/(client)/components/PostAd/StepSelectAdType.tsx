"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdGridCanvas from "../AdGridCanvas";
import { ChevronUp } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface StepSelectAdTypeProps {
  formData: any;
  updateFormData: (data: any) => void;
}

interface AdSectionBoxPricing {
  id: number;
  adSectionId: number;
  boxNumber: number; // integer box count
  boxNumberDec: number; // decimal (0.5, 1, 1.5, etc.)
  price: number; // Decimal from DB → number in frontend
  extraNote1?: string | null;
  extraNote2?: string | null;
}

interface SectionSize {
  id: number;
  sizeType: string;
  width: number;
  height: number;
  colorOption: string;
  price: number;
  isAvailable: boolean;
}

interface AdSection {
  id: number;
  name: string;
  extraNotes?: string;
  isAvailable: boolean;
  isSingleColumn: boolean;
  sizes: SectionSize[];
  boxPricing?: AdSectionBoxPricing[];
}

interface AdType {
  id: number;
  newspaper_id: string;
  key: string;
  name: string;
  base_type: string;
  count_first_words: number;
  base_price: number;
  additional_word_price: number;
  priority_price: number;
  co_paper_price: number;
  internet_bw_price: number;
  internet_fc_price: number;
  internet_highlight_price: number;
  tax_amount_2: number;
  tint_color_price: number;
  is_allow_combined: boolean;
  max_words: number;
  img_url?: string;
  uploadedImages: string[];
  is_upload_image: boolean;
  cs_col_bw_price: number;
  cs_col_bw_one_color_price: number;
  cs_col_bw_two_color_price: number;
  cs_col_full_color_price: number;
  cs_page_bw_price: number;
  cs_page_bw_one_color_price: number;
  cs_page_bw_two_color_price: number;
  cs_page_full_color_price: number;
  extra_notes1?: string;
  extra_notes2?: string;
  categories: {
    category: string;
    subCategories: { name: string; classification_number: number }[];
  }[];
  sections: AdSection[];
}

const vehicleBrands = [
  "Toyota",
  "Nissan",
  "Suzuki",
  "Honda",
  "Mitsubishi",
  "Mazda",
  "Daihatsu",
  "Isuzu",
  "Subaru",

  "Hyundai",
  "Kia",
  "SsangYong",

  "Tata",
  "Mahindra",
  "Ashok Leyland",

  "Perodua",
  "Proton",

  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
  "Porsche",
  "Land Rover",
  "Jaguar",
  "Mini",
  "Volvo",

  "Peugeot",
  "Renault",

  "MG",
  "Chery",
  "BYD",
  "Great Wall",
  "Haval",

  "Tesla",

  "Micro",
  "DFSK",

  "Chinese",
  "Other",
];

export default function StepSelectAdType({
  formData,
  updateFormData,
}: StepSelectAdTypeProps) {
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState<AdType | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  const [selectedMainAdType, setselectedMainAdType] = useState<
    "classified" | "casual" | null
  >(null);

  const [wordCount, setWordCount] = useState<number>(
    formData.adText?.split(" ").filter(Boolean).length || 0,
  );
  const [priceBreakdown, setPriceBreakdown] = useState<
    { label: string; amount: number }[]
  >([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  // const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<
    { name: string; classification_number: number | null }[]
  >([]);
  const secondaryTypesSection = useRef<HTMLDivElement | null>(null);

  const [selectedSize, setselectedSize] = useState<string>(""); // user selected size full, custom...
  const [selectedColor, setselectedColor] = useState<number>(0); // stores value for colors for casual ads
  const [selectedColumns, setselectedColumns] = useState<number>(0); // user selected no of columns
  const [selectedAdHeight, setselectedAdHeight] = useState<number>(
    formData.selectedNewspaper.min_ad_height,
  );
  const [selectedDistrict, setselectedDistrict] = useState<string>("");
  const [selectedProvince, setselectedProvince] = useState<string>("");
  const [showScrollMessage, setShowScrollMessage] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

  const [noOfColumnsPerPage, setNoOfColumnsPerPage] = useState<number>(
    formData.selectedNewspaper.no_col_per_page,
  );
  const [minAdHeight, setminAdHeight] = useState<number>(
    formData.selectedNewspaper.min_ad_height,
  );
  const [maxColHeight, setmaxColHeight] = useState<number>(
    formData.selectedNewspaper.col_height,
  );
  const [tintAdditionalCharge, settintAdditionalCharge] = useState<number>(
    formData.selectedNewspaper.tint_additional_charge,
  );
  const [newspaperDays, setnewspaperDays] = useState<string[]>([]);
  const [selectedBoxPrice, setselectedBoxPrice] = useState<number>(0);

  const selectedNewspaperId = formData.selectedNewspaper?.id;
  const allowed_weekdays = formData.selectedNewspaper?.allowed_weekdays ?? [];
  const allowed_month_days =
    formData.selectedNewspaper?.allowed_month_days ?? [];
  // console.log("days here: ", allowed_weekdays);
  // console.log("days here: ", allowed_month_days);
  const [langVisible, setlangVisible] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (selectedMainAdType && secondaryTypesSection.current) {
      secondaryTypesSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedMainAdType]);

  const MAX_FILES = 4;
  const MAX_SIZE = 3 * 1024 * 1024; // 3MB

  // JS: Sunday=0 → ISO: Sunday=7
  const getIsoWeekday = (date: Date) =>
    date.getDay() === 0 ? 7 : date.getDay();

  const isAllowedDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false; // never allow past dates

    if (formData.selectedNewspaper?.type === "Monthly") {
      // allowed_month_days is an array like [1, 15, 28]
      return allowed_month_days.includes(date.getDate());
    }

    // For Daily / Sunday / Weekly → use allowed_weekdays
    return allowed_weekdays.includes(getIsoWeekday(date));
  };

  const now = new Date();

  const ad_time_limit = formData.selectedNewspaper?.ad_time_limit ?? 22;
  const day_before = Number(formData.selectedNewspaper?.day_before) ?? 1;

  // if current time passed cutoff → add 1 extra day
  const extraDay = now.getHours() >= ad_time_limit ? 1 : 0;

  const images =
    formData.selectedNewspaper?.lm_images?.length > 0
      ? formData.selectedNewspaper.lm_images
      : formData.selectedNewspaper?.lm_image
        ? [formData.selectedNewspaper.lm_image]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);

  // final minDate
  const minDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + day_before + extraDay,
  );

  const formatDateLocal = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch ad types for selected newspaper
  useEffect(() => {
    if (!selectedNewspaperId) return;
    setLoading(true);
    updateFormData({ currentStep: 2 });
    fetch(`/api/ad-types/${selectedNewspaperId}`)
      .then((res) => res.json())
      .then((data: AdType[]) => setAdTypes(data))
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, [selectedNewspaperId]);

  const handleAdTypeSelect = (adType: AdType) => {
    console.log("formData all ", formData);
    setnewspaperDays(["tuesday", "thursday"]);
    // console.log(formData);
    setSelectedAdType(adType);
    updateFormData({
      adType: adType.key,
      adTypeObject: adType,
      adText: "",
      backgroundColor: false,
      combinedAd: false,
      hasOwnArtwork: false,
      needArtwork: false,
      uploadedImage: null,
      uploadedImages: [],
      sectionId: 0,
      noOfColumns: 1,
      adHeight: formData.selectedNewspaper.min_ad_height,
      userLangCombineSelected: false,
      userLangCombineSelected_Tam: false,
      userLangCombineSelected_Eng: false,
      userLangCombineSelected_Sin: false,
      userLangCombineSelected_Sin_Eng: false,
      userLangCombineSelected_Sin_Tam: false,
      userLangCombineSelected_Eng_Tam: false,
      isPlacementEnabled: false,
      userCOPaper: false,
      userIntBW: false,
      userIntFC: false,
      userIntHighlight: false,
      specialNotes: "",
      classifiedCategory: "",
      photoCategory: "",
      subCategory: "",
    });
    setWordCount(0);
    setSelectedCategory("");
    setSelectedSubCategory("");
    console.log(
      "final",
      noOfColumnsPerPage,
      minAdHeight,
      selectedAdHeight,
      maxColHeight,
    );

    console.log("look here: ", formData.adTypeObject.count_first_words);
    console.log("look again: ", formData);
  };

  const selectedSectionData = selectedAdType?.sections?.find(
    (s) => s.id === selectedSection,
  );

  const sizeTypeOptions = Array.from(
    new Map(
      (selectedSectionData?.sizes || []).map((sz) => [
        sz.sizeType,
        {
          key: sz.sizeType,
          label: sz.sizeType.replace(/_/g, " "),
        },
      ]),
    ).values(),
  );

  const boxOptions = Array.from(
    new Map(
      (selectedSectionData?.boxPricing || []).map((bp) => [
        bp.boxNumberDec,
        {
          key: bp.boxNumberDec,
          label:
            bp.boxNumberDec % 1 === 0
              ? `${bp.boxNumberDec} Box`
              : `${bp.boxNumberDec} Box`,
          price: Number(bp.price),
        },
      ]),
    ).values(),
  ).sort((a, b) => a.key - b.key);

  const COLOR_LABEL_MAP: Record<string, { label: string; subLabel: string }> = {
    bw: {
      label: "Black & White",
      subLabel: "(කළු සහ සුදු)",
    },
    bw1: {
      label: "Black + 1 Color",
      subLabel: "(කළු + වර්ණ 1ක්)",
    },
    bw2: {
      label: "Black + 2 Colors",
      subLabel: "(කළු + වර්ණ 2ක්)",
    },
    fc: {
      label: "Full Color",
      subLabel: "(සම්පූර්ණයෙන් වර්ණ කර)",
    },
  };

  const colorOptions = Array.from(
    new Map(
      (selectedSectionData?.sizes || [])
        .filter((sz) => sz.isAvailable && sz.sizeType === selectedSize)
        .map((sz) => [
          sz.colorOption,
          {
            key: sz.colorOption,
            label: COLOR_LABEL_MAP[sz.colorOption]?.label ?? sz.colorOption,
            subLabel: COLOR_LABEL_MAP[sz.colorOption]?.subLabel ?? "",
            price: sz.price,
          },
        ]),
    ).values(),
  );

  // Word count & price calculation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedAdType) return;

    let inputText = e.target.value;

    // Enforce leading "0 " for priority ads
    if (formData.priorityPrice && !inputText.startsWith("0 ")) {
      inputText = "0 " + inputText.replace(/^0+\s*/, "");
    }

    const words = inputText.trim().split(/\s+/).filter(Boolean);

    const maxWords = formData.priorityPrice
      ? selectedAdType.max_words + 1
      : selectedAdType.max_words;

    // If exceeding limit AND user is adding text → block it
    if (words.length > maxWords) {
      return; // <- this is the key fix
    }

    setWordCount(words.length);
    updateFormData({ adText: inputText });
  };

  // price matrix - hook
  useEffect(() => {
    if (!selectedAdType) return;

    let total = 0;
    const breakdown = [];

    // CASUAL AD PRICING
    if (selectedAdType.key === "casual") {
      let basePrice = 0;

      // FULL PAGE → color only
      // if (formData.adSizeType === "full") {
      //   basePrice = 0;
      //   basePrice = selectedColor;
      // }

      // CUSTOM SIZE → columns × height × color
      if (formData.adSizeType === "custom") {
        basePrice = 0;
        basePrice =
          (formData.noOfColumns || 1) * //line 1
          (formData.adHeight || minAdHeight) * //line 2
          (selectedColor || 0);
      }

      if (formData.adSizeType !== "custom") {
        basePrice = 0;
        basePrice = selectedColor;
      }

      breakdown.push({ label: "Base Price", amount: basePrice });
      total += basePrice;
    } else {
      breakdown.push({
        label: "Base Price",
        amount: selectedAdType.base_price,
      });
      total += selectedAdType.base_price;
    }

    if (formData.boxType > 0) {
      breakdown.push({
        label: "Box Price",
        amount: selectedBoxPrice,
      });
      total += selectedBoxPrice;
    }

    const extraWords = Math.max(
      0,
      wordCount - selectedAdType.count_first_words,
    );
    if (extraWords > 0) {
      const extraPrice = extraWords * selectedAdType.additional_word_price;
      breakdown.push({
        label: `Extra Words (${extraWords} × ${selectedAdType.additional_word_price})`,
        amount: extraPrice,
      });
      total += extraPrice;
    }

    if (formData.backgroundColor) {
      breakdown.push({
        label: "Background Color",
        amount: selectedAdType.tint_color_price,
      });
      total += selectedAdType.tint_color_price;
    }

    if (formData.combinedAd) {
      breakdown.push({ label: "Post in Website", amount: 100 });
      total += 100;
    }

    if (formData.priorityPrice) {
      breakdown.push({
        label: "Priority Ad",
        amount: selectedAdType.priority_price,
      });
      total += selectedAdType.priority_price;
    }
    if (formData.userLangCombineSelected) {
      if (formData.userLangCombineSelected_Eng) {
        breakdown.push({
          label: "Include in English paper",
          amount: formData.selectedNewspaper.combine_eng_price,
        });
        total += formData.selectedNewspaper.combine_eng_price;
      }

      if (formData.userLangCombineSelected_Tam) {
        breakdown.push({
          label: "Include in Tamil paper",
          amount: formData.selectedNewspaper.combine_tam_price,
        });
        total += formData.selectedNewspaper.combine_tam_price;
      }

      if (formData.userLangCombineSelected_Sin) {
        breakdown.push({
          label: "Include in Sinhala paper",
          amount: formData.selectedNewspaper.combine_sin_price,
        });
        total += formData.selectedNewspaper.combine_sin_price;
      }

      if (formData.userLangCombineSelected_Sin_Tam) {
        breakdown.push({
          label: "Include in Both Sinhala & Tamil papers",
          amount: formData.selectedNewspaper.combine_sin_tam_price,
        });
        total += formData.selectedNewspaper.combine_sin_tam_price;
      }

      if (formData.userLangCombineSelected_Eng_Tam) {
        breakdown.push({
          label: "Include in both English & Tamil papers",
          amount: formData.selectedNewspaper.combine_eng_tam_price,
        });
        total += formData.selectedNewspaper.combine_eng_tam_price;
      }

      if (formData.userLangCombineSelected_Sin_Eng) {
        breakdown.push({
          label: "Include in both Sinhala & English papers",
          amount: formData.selectedNewspaper.combine_sin_eng_price,
        });
        total += formData.selectedNewspaper.combine_sin_eng_price;
      }
    }

    if (formData.userCOPaper) {
      breakdown.push({
        label: "C/O Paper",
        amount: selectedAdType.co_paper_price,
      });
      total += selectedAdType.co_paper_price;
    }

    if (formData.userIntBW) {
      breakdown.push({
        label: "Internet B&W",
        amount: selectedAdType.internet_bw_price,
      });
      total += selectedAdType.internet_bw_price;
    }

    if (formData.userIntFC) {
      breakdown.push({
        label: "Inernet Full Color",
        amount: selectedAdType.internet_fc_price,
      });
      total += selectedAdType.internet_fc_price;
    }

    if (formData.userIntHighlight) {
      breakdown.push({
        label: "Internet Highlight",
        amount: selectedAdType.internet_highlight_price,
      });
      total += selectedAdType.internet_highlight_price;
    }

    if (formData.priorityPrice) {
      if (!formData.adText?.startsWith("0")) {
        updateFormData({
          adText: `0${formData.adText || ""}`,
        });
      }
    } else {
      if (formData.adText?.startsWith("0")) {
        updateFormData({
          adText: formData.adText.slice(1),
        });
      }
    }
    if (selectedAdType.tax_amount_2 > 0) {
      let calculatedtax = (total * selectedAdType.tax_amount_2) / 100.0;
      breakdown.push({
        label: "Taxes",
        amount: calculatedtax,
      });
      total += calculatedtax;
    }

    setPriceBreakdown(breakdown);
    setTotalPrice(total);
    updateFormData({ totalPrice: total });
  }, [
    wordCount,

    formData.adSizeType,
    formData.noOfColumns,
    formData.adHeight,
    selectedColor,
    selectedBoxPrice,

    formData.backgroundColor,
    formData.combinedAd,
    formData.priorityPrice,
    formData.userLangCombineSelected,
    formData.userLangCombineSelected_Eng,
    formData.userLangCombineSelected_Tam,
    formData.userLangCombineSelected_Sin,
    formData.userLangCombineSelected_Sin_Tam,
    formData.userLangCombineSelected_Eng_Tam,
    formData.userLangCombineSelected_Sin_Eng,
    formData.userCOPaper,
    formData.userIntBW,
    formData.userIntFC,
    formData.userIntHighlight,
    selectedAdType,
  ]);

  useEffect(() => {
    if (!formData.userLangCombineSelected) {
      updateFormData({
        userLangCombineSelected_Eng: false,
        userLangCombineSelected_Tam: false,
        userLangCombineSelected_Sin: false,
        userLangCombineSelected_Sin_Tam: false,
        userLangCombineSelected_Sin_Eng: false,
        userLangCombineSelected_Eng_Tam: false,
      });
    }
  }, [formData.userLangCombineSelected]);

  useEffect(() => {
    if (!selectedCategory) {
      setSubCategoryOptions([]);
      return;
    }

    fetch(
      `/api/subcategories?categoryName=${encodeURIComponent(selectedCategory)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.subcategories) setSubCategoryOptions(data.subcategories);
        else setSubCategoryOptions([]);
      })
      .catch(() => setSubCategoryOptions([]));
  }, [selectedCategory]);

  // const today = new Date().toISOString().split("T")[0];

  function AdTypeSkeleton() {
    return (
      <div className="border rounded-lg p-4 flex flex-col items-center animate-pulse">
        <div className="w-28 h-28 bg-gray-300 rounded mb-3" />
        <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  const adTypeImages: Record<string, string> = {
    classified: "/classified.png",
    photo_classified: "/photo_classified.png",
    casual: "/casual.png",
    death_notice: "/death_notice.png",
    marriage: "/marriage.png",
  };

  const getAdTypeImage = (adKey: string) => {
    return adTypeImages[adKey] || "/default_ad_icon.png";
  };

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

  useEffect(() => {
    if (selectedAdType?.key !== "casual") return;

    if (formData.adSizeType === "custom") {
      updateFormData({
        noOfColumns: formData.noOfColumns ?? 1,
        adHeight: formData.adHeight ?? minAdHeight,
      });
    }
  }, [formData.adSizeType, selectedAdType, minAdHeight]);

  const filteredAdTypes = Array.isArray(adTypes)
    ? adTypes.filter((ad) => {
        if (!selectedMainAdType) return false;

        if (selectedMainAdType === "classified") {
          return ad.key !== "casual";
        }

        if (selectedMainAdType === "casual") {
          return ad.key === "casual";
        }

        return true;
      })
    : [];

  const languageOptions =
    formData.selectedNewspaper.language === "SI"
      ? [
          [
            "userLangCombineSelected_Eng",
            "Place Ad in English Paper",
            formData.selectedNewspaper.combine_eng_price,
          ],
          [
            "userLangCombineSelected_Tam",
            "Place Ad in Tamil Paper",
            formData.selectedNewspaper.combine_tam_price,
          ],
          [
            "userLangCombineSelected_Eng_Tam",
            "Place Ad in English & Tamil Papers",
            formData.selectedNewspaper.combine_eng_tam_price,
          ],
        ]
      : formData.selectedNewspaper.language === "EN"
        ? [
            [
              "userLangCombineSelected_Tam",
              "Place Ad in Tamil Paper",
              formData.selectedNewspaper.combine_tam_price,
            ],
            [
              "userLangCombineSelected_Sin",
              "Place Ad in Sinhala Paper",
              formData.selectedNewspaper.combine_sin_price,
            ],
            [
              "userLangCombineSelected_Sin_Tam",
              "Place Ad in Sinhala & Tamil Papers",
              formData.selectedNewspaper.combine_sin_tam_price,
            ],
          ]
        : [
            [
              "userLangCombineSelected_Eng",
              "Place Ad in English Paper",
              formData.selectedNewspaper.combine_eng_price,
            ],
            [
              "userLangCombineSelected_Sin",
              "Place Ad in Sinhala Paper",
              formData.selectedNewspaper.combine_sin_price,
            ],
            [
              "userLangCombineSelected_Sin_Eng",
              "Place Ad in Sinhala & English Papers",
              formData.selectedNewspaper.combine_sin_eng_price,
            ],
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
  return (
    <div className="space-y-6">
      <div className="bg-primary text-white px-6 py-3 rounded-lg shadow-md text-center">
        <h5 className="text-sm">Selected Newspaper</h5>
        <h5
          className="text-xl font-semibold"
          style={{
            fontFamily: "var(--font-sinhala), sans-serif",
          }}
        >
          {formData.selectedNewspaper.name_sinhala
            ? formData.selectedNewspaper.name_sinhala
            : formData.selectedNewspaper.name}
        </h5>
      </div>
      {/* <div className="flex justify-center mt-6 mb-12"></div> */}
      <h2 className="text-2xl font-bold text-center mb-2">Select Ad Type</h2>
      <h2
        style={{
          fontFamily: "var(--font-sinhala), sans-serif",
        }}
        className="text-center"
      >
        <span>(දැන්වීම් වර්ගය තෝරන්න)</span>
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {[
          {
            key: "classified",
            name: "Classified",
            description:
              "Classified ads, Brides & Grooms, Death Notices, Name Changes and other formal announcements.",
          },
          {
            key: "casual",
            name: "Casual",
            description:
              "Colorful ads, thank you notes, greetings, announcements, and short personal messages.",
          },
        ].map((item) => (
          <div
            key={item.key}
            className={`border border-primary rounded-lg p-4 my-8 flex flex-col items-center cursor-pointer transition text-primary-dark
      ${
        selectedMainAdType === item.key
          ? "ring-4 ring-primary-dark"
          : "hover:ring-2 hover:ring-primary-dark"
      }`}
            onClick={() => {
              setselectedMainAdType(item.key as "classified" | "casual");
              setSelectedAdType(null);
              // setShowScrollMessage(true);
              // setTimeout(() => setShowScrollMessage(false), 5000);
            }}
          >
            <div className="w-[120px] h-[30px] flex items-center justify-center mb-2 rounded-md text-lg font-semibold">
              {item.name}
            </div>

            <p className="text-sm text-center text-gray-600 mt-2">
              {item.description}
            </p>
          </div>
        ))}
      </div>
      <div ref={secondaryTypesSection} className="w-full h-[1]"></div>
      {selectedMainAdType && (
        <div ref={secondaryTypesSection} className="w-full h-[75]"></div>
      )}

      {selectedMainAdType && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <AdTypeSkeleton key={i} />
              ))
            : filteredAdTypes.map((ad) => (
                <div
                  key={ad.key}
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition ${
                    selectedAdType?.key === ad.key
                      ? "ring-2 ring-primary-accent"
                      : "hover:ring-2 hover:ring-primary-accent"
                  }`}
                  onClick={() => handleAdTypeSelect(ad)}
                >
                  <div className="w-[120px] h-[120px] flex items-center justify-center mb-2 overflow-hidden">
                    <Image
                      src={getAdTypeImage(ad.key)}
                      alt={ad.name}
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>

                  <h3 className="font-semibold text-center">{ad.name}</h3>

                  {ad.extra_notes1 && (
                    <p className="text-sm text-gray-500 text-center">
                      {ad.extra_notes1}
                    </p>
                  )}
                  {ad.extra_notes2 && (
                    <p className="text-sm text-gray-500 text-center">
                      {ad.extra_notes2}
                    </p>
                  )}
                </div>
              ))}
        </div>
      )}

      <div className="space-y-4 md:w-full mx-auto md:mt-8 md:flex-column overflow-visible">
        {/* Fields for non-Casual Ads */}
        {selectedAdType && selectedAdType?.key !== "casual" && (
          <div className="md:w-full">
            {/* Publish Date */}
            <div className="w-full">
              <label className="block font-medium mb-1">
                Publish Date{" "}
                <span
                  className="text-sm"
                  style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                >
                  (දැන්වීම පළ කරන දිනය)
                </span>
                <span className="text-red-500">*</span>
              </label>

              {/* publish date for non casual */}
              <DatePicker
                selected={
                  formData.publishDate
                    ? new Date(formData.publishDate + "T00:00:00")
                    : null
                }
                onChange={(date: Date | null) => {
                  updateFormData({ publishDate: formatDateLocal(date!) });
                }}
                dateFormat="yyyy-MM-dd"
                minDate={minDate}
                filterDate={isAllowedDate}
                placeholderText={
                  formData.selectedNewspaper?.type === "Monthly"
                    ? "Select allowed monthly date"
                    : "Select publish date"
                }
                renderCustomHeader={({
                  date,
                  decreaseMonth,
                  increaseMonth,
                }) => (
                  <div className="flex justify-between items-center px-2">
                    <button
                      type="button"
                      onClick={decreaseMonth}
                      className="text-[var(--color-primary-dark)]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                        fill="#160f29"
                      >
                        <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z" />
                      </svg>
                    </button>
                    <span className="font-medium">
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={increaseMonth}
                      className="text-[var(--color-primary-dark)]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                        fill="#160f29"
                      >
                        <path d="M9.3 18.7a1 1 0 0 1 0-1.4L14.6 12 9.3 6.7a1 1 0 1 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0z" />
                      </svg>
                    </button>
                  </div>
                )}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
              />
            </div>
            {/* Category Dropdown */}
            {(selectedAdType.key === "classified" ||
              selectedAdType.key === "photo_classified" ||
              selectedAdType.key === "marriage") && (
              //Category
              <div className="w-full md:w-1/2">
                <label className="block font-medium mb-1 md:mt-8">
                  Category{" "}
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-sinhala), sans-serif",
                    }}
                  >
                    (වර්ගීකරණය)
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedCategory(value);
                    setSelectedSubCategory("");

                    let mappedCategory = value;
                    let mappedSubCategory: string | null = null;

                    if (selectedAdType.key === "marriage") {
                      switch (value) {
                        case "Brides":
                          mappedCategory = "500";
                          mappedSubCategory = "500";
                          break;
                        case "Bridegrooms":
                          mappedCategory = "501";
                          mappedSubCategory = "501";
                          break;
                        case "Brides and Grooms":
                          mappedCategory = "502";
                          mappedSubCategory = "502";
                          break;
                        default:
                          mappedCategory = "";
                          mappedSubCategory = null;
                      }
                    }

                    updateFormData({
                      classifiedCategory: mappedCategory,
                      subCategory: mappedSubCategory,
                    });
                  }}
                  className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="">Select Category</option>

                  {selectedAdType.key === "classified" && (
                    <>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Health & Beauty">Health & Beauty</option>
                      <option value="Automobile">Automobile</option>
                      <option value="Personal">Personal</option>
                      <option value="Employment">Employment</option>
                      <option value="General">General</option>
                      <option value="Trade">Trade</option>
                    </>
                  )}
                  {selectedAdType.key === "marriage" && (
                    <>
                      <option value="Brides">Brides</option>
                      <option value="Bridegrooms">Bridegrooms</option>
                      <option value="Brides and Grooms">
                        Brides/Bridegrooms
                      </option>
                    </>
                  )}
                  {selectedAdType.key === "photo_classified" && (
                    <>
                      <option value="Machinery">Machinery</option>
                      <option value="Vehicles">Vehicles</option>
                    </>
                  )}
                </select>
              </div>
            )}
            {selectedCategory === "Automobile" && (
              <div className="md:mt-8 w-full md:w-1/2">
                <label className="block font-medium mb-1">
                  Vehicle Brand{" "}
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                  >
                    (වාහන වර්ගය)
                  </span>{" "}
                </label>
                <select
                  value={formData.vehicle_brand ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    updateFormData({ vehicle_brand: value });
                    // console.log(formData);
                  }}
                  className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="">Select Vehicle Brand</option>

                  {vehicleBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Subcategory Dropdown */}
            {selectedAdType.key !== "marriage" &&
              selectedAdType.key !== "photo_classified" &&
              selectedCategory && (
                <div className="md:mt-8 w-full md:w-1/2">
                  <label className="block font-medium mb-1">
                    Sub Category{" "}
                    <span
                      className="text-sm"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      (දැන්වීම් ස්වභාවය)
                    </span>{" "}
                  </label>
                  <select
                    value={formData.subCategory ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? Number(e.target.value)
                        : null;

                      updateFormData({ subCategory: String(value) });
                      setSelectedSubCategory(String(value));
                    }}
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                  >
                    <option value="">Select Subcategory</option>

                    {subCategoryOptions.map((sub) => (
                      <option
                        key={sub.classification_number ?? sub.name}
                        value={sub.classification_number ?? ""}
                      >
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            {/* district for classified */}
            {selectedAdType.key !== "marriage" &&
              selectedAdType.key !== "photo_classified" &&
              selectedAdType.key !== "death_notice" &&
              selectedCategory === "Real Estate" && (
                <div className="w-full md:w-1/2">
                  <label className="block font-medium mb-1 md:mt-8">
                    District{" "}
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-sinhala), sans-serif",
                      }}
                    >
                      (දිස්ත්‍රික්කය)
                    </span>{" "}
                    {/* <span className="text-red-500">*</span> */}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setselectedDistrict(e.target.value);
                      updateFormData({ district: e.target.value });
                      // setSelectedSubCategory("");
                    }}
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                  >
                    <option value="">Select District</option>

                    <option value="Ampara">Ampara</option>
                    <option value="Anuradhapura">Anuradhapura</option>
                    <option value="Badulla">Badulla</option>
                    <option value="Batticaloa">Batticaloa</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Galle">Galle</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Hambantota">Hambantota</option>
                    <option value="Jaffna">Jaffna</option>
                    <option value="Kalutara">Kalutara</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Kegalle">Kegalle</option>
                    <option value="Kilinochchi">Kilinochchi</option>
                    <option value="Kurunegala">Kurunegala</option>
                    <option value="Mannar">Mannar</option>
                    <option value="Matale">Matale</option>
                    <option value="Matara">Matara</option>
                    <option value="Monaragala">Monaragala</option>
                    <option value="Mullaitivu">Mullaitivu</option>
                    <option value="Nuwara Eliya">Nuwara Eliya</option>
                    <option value="Polonnaruwa">Polonnaruwa</option>
                    <option value="Puttalam">Puttalam</option>
                    <option value="Ratnapura">Ratnapura</option>
                    <option value="Trincomalee">Trincomalee</option>
                    <option value="Vavuniya">Vavuniya</option>
                  </select>
                </div>
              )}
            {/* district for classified */}
            {selectedAdType.key === "marriage" && (
              <div className="w-full md:w-1/2">
                <label className="block font-medium mb-1 md:mt-8">
                  Province{" "}
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-sinhala), sans-serif",
                    }}
                  >
                    (පළාත)
                  </span>{" "}
                  {/* <span className="text-red-500">*</span> */}
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setselectedProvince(e.target.value);
                    updateFormData({ province: e.target.value });
                    // setSelectedSubCategory("");
                  }}
                  className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="">Select Province</option>
                  <option value="central">Central</option>
                  <option value="eastern">Eastern</option>
                  <option value="north_central">North Central</option>
                  <option value="northern">Northern</option>
                  <option value="north_western">North Western</option>
                  <option value="other">Other</option>
                  <option value="overseas">Overseas</option>
                  <option value="sabaragamuwa">Sabaragamuwa</option>
                  <option value="southern">Southern</option>
                  <option value="uva">Uva</option>
                  <option value="western">Western</option>
                </select>
              </div>
            )}
            {/* Advertisement Text */}
            <div className="relative md:mt-8">
              <label className="block font-medium mb-1">
                Advertisement Text{" "}
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                >
                  (දැන්වීම් විස්තරය)
                </span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="absolute top-0 right-0 text-sm text-gray-500">
                {wordCount}/{selectedAdType.max_words} words
              </div>
              <textarea
                rows={5}
                placeholder="Type your advertisement here"
                value={formData.adText || ""}
                onChange={handleTextChange}
                required
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-primary-accent resize-none"
              />
              <p className="text-sm">
                To type in Sinhala, go to a{" "}
                <a
                  href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-800 hover:text-blue-600"
                >
                  Sinhala typing tool
                </a>
                , type your advertisement, then copy and paste it here.{" "}
              </p>
              <p className="text-sm">
                <span
                  className="text-xs"
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                >
                  (සිංහලෙන් ටයිප් කිරීමට,{" "}
                  <a
                    href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 hover:text-blue-600"
                  >
                    සිංහල ටයිපින්{" "}
                  </a>
                  මෙවලමට පිවිස ඔබේ දැන්වීම ටයිප් කර, පිටපත් කර මෙහි ඇතුළත්
                  කරන්න.)
                </span>{" "}
              </p>
            </div>
            {/* Image uploads for types other than casual */}
            {selectedAdType?.is_upload_image && (
              <div className="md:mt-8">
                <label className="block mb-2 font-medium">
                  Upload Image{" "}
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                  >
                    (ඡායාරූප ඇතුලත් කරන්න)
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>
                {/* // supportive doc input other than casual  */}
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;

                    // Enforce max count
                    const remainingSlots =
                      MAX_FILES - (formData.uploadedImages?.length ?? 0);

                    if (remainingSlots <= 0) {
                      setAlertMessage("You can upload a maximum of 4 images.");
                      return;
                    }

                    const selectedFiles = files.slice(0, remainingSlots);

                    for (const file of selectedFiles) {
                      const isPdf =
                        file.type === "application/pdf" ||
                        file.name.toLowerCase().endsWith(".pdf");

                      if (!isPdf) {
                        setAlertMessage(`${file.name} is not a PDF file.`);
                        e.target.value = "";
                        return;
                      }
                    }

                    // Size validation
                    const oversized = selectedFiles.find(
                      (file) => file.size > MAX_SIZE,
                    );
                    if (oversized) {
                      setAlertMessage("Each image must be under 3 MB");
                      return;
                    }

                    try {
                      updateFormData({ uploading: true });

                      const uploadedUrls: string[] = [];

                      for (const file of selectedFiles) {
                        const data = await uploadImageToCloudinary(file);
                        uploadedUrls.push(data.secure_url);
                      }

                      updateFormData({
                        uploadedImages: [
                          ...(formData.uploadedImages ?? []),
                          ...uploadedUrls,
                        ],
                        uploading: false,
                      });
                    } catch (error) {
                      console.error(error);
                      updateFormData({ uploading: false });
                      alert("One or more images failed to upload.");
                    } finally {
                      // allow re-selecting same file again
                      e.target.value = "";
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-accent file:text-white file:cursor-pointer hover:file:bg-primary-accent/90 transition"
                />

                {/* Optional status text (non-breaking, visual only) */}
                {formData.uploading && (
                  <p className="text-sm text-gray-500 mt-2">
                    Uploading images…
                  </p>
                )}
                {formData.uploadedImages?.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-8 gap-4">
                    {formData.uploadedImages.map(
                      (url: string, index: number) => (
                        <div key={url} className="relative group">
                          {/* <img
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          /> */}
                          <div className="flex flex-column">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-4 my-4 text-center shadow-2xs"
                              style={{
                                backgroundImage:
                                  "url('/uploaded-png-back-3.png')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                              }}
                            >
                              <span className="text-white">
                                Uploaded File {index + 1}
                              </span>
                            </a>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.uploadedImages.filter(
                                (_: any, i: any) => i !== index,
                              );
                              updateFormData({ uploadedImages: updated });
                            }}
                            className="absolute top-2 right-2  bg-black/70 text-white text-xs  rounded-full px-2 py-1  opacity-0 group-hover:opacity-100  transition"
                          >
                            ✕
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  {formData.uploadedImages.length} / 4 images uploaded. Please
                  note that images must be PDF format.
                </p>

                {selectedAdType.extra_notes1 && (
                  <p className="text-xs text-gray-500">
                    <span
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      {selectedAdType.extra_notes1}
                    </span>{" "}
                    <span className="text-red-500">**</span>
                  </p>
                )}
              </div>
            )}
            {/* Priority checkbox */}
            {formData.selectedNewspaper.type?.toLowerCase() === "sunday" &&
              selectedAdType.priority_price !== 0 && (
                <div className="flex flex-col md:flex-row gap-4 md:mt-8">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.priorityPrice}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        let updatedText = formData.adText || "";

                        if (isChecked) {
                          // Add "0 " if not already there
                          if (!updatedText.startsWith("0 ")) {
                            updatedText =
                              "0 " + updatedText.replace(/^0+\s*/, "");
                          }
                        } else {
                          // Remove leading "0 " when unchecked
                          updatedText = updatedText.replace(/^0\s*/, "");
                        }

                        updateFormData({
                          priorityPrice: isChecked,
                          adText: updatedText,
                        });
                      }}
                    />
                    <span>
                      Priority{" "}
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-sinhala), sans-serif",
                        }}
                      >
                        (ප්‍රමුඛ දැන්වීමකි)
                      </span>{" "}
                      {/* (LKR {selectedAdType.priority_price}) */}
                    </span>
                  </label>
                </div>
              )}
            {/* Placement & Digital Publications Options - CO Paper, INT BW, INT FC, INT HL */}

            {selectedMainAdType &&
              (selectedAdType.co_paper_price !== 0 ||
                selectedAdType.internet_bw_price !== 0 ||
                selectedAdType.internet_fc_price !== 0 ||
                selectedAdType.internet_highlight_price !== 0) && (
                <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm relative">
                  <h3 className="mb-1 font-normal text-[var(--color-primary-dark)] text-center">
                    Placement & Digital Publications Options
                  </h3>
                  <h3
                    className="mb-2 font-normal text-[var(--color-primary-dark)] text-center text-sm"
                    style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                  >
                    (ස්ථානගත කිරීම සහ ඩිජිටල් ප්‍රකාශන සටහන්)
                  </h3>
                  {/* Header + Toggle */}
                  <div className="flex items-center justify-between">
                    {/* Enable / Disable Toggle */}
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-sm text-gray-600">Enable</span>

                      {/* Hidden checkbox controls state */}
                      <input
                        type="checkbox"
                        checked={formData.isPlacementEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          updateFormData({
                            isPlacementEnabled: enabled,
                            userIntFC: false,
                            userIntBW: false,
                            userCOPaper: false,
                            userIntHighlight: false,
                          });
                        }}
                        className="sr-only" // visually hidden but accessible
                      />

                      {/* Custom switch */}
                      <span
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${formData.isPlacementEnabled ? "bg-[var(--color-primary-dark)]" : "bg-gray-300"}`}
                      >
                        {/* The knob */}
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isPlacementEnabled ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </span>
                    </label>
                  </div>

                  {/* Main Section: Disable if toggle is off */}
                  <div
                    className={`grid grid-cols-2 gap-4 w-full py-4 transition-opacity ${
                      !formData.isPlacementEnabled
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {/* ================= PART 1 ================= */}
                    <div className="col-span-2 md:col-span-1 flex flex-col">
                      <p className="mb-2 text-sm text-center text-gray-600">
                        Select <strong>one</strong> internet publication option
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Internet Full Color */}
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData({
                              userIntFC: true,
                              userIntBW: false,
                            })
                          }
                          className={`h-full rounded-xl border p-4 text-left transition-all
            ${
              formData.userIntFC
                ? "bg-[var(--color-primary-dark)] border-[var(--color-primary-dark)] text-white"
                : "border-gray-300 hover:border-[var(--color-primary)]"
            }`}
                        >
                          <p className="font-medium">Internet Full Color</p>
                          <p
                            className={`text-xs mt-1 ${
                              formData.userIntFC
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            Display ad in full colour on digital platforms
                          </p>
                        </button>

                        {/* Internet Black & White */}
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData({
                              userIntBW: true,
                              userIntFC: false,
                            })
                          }
                          className={`h-full rounded-xl border p-4 text-left transition-all
            ${
              formData.userIntBW
                ? "bg-[var(--color-primary-dark)] border-[var(--color-primary-dark)] text-white"
                : "border-gray-300 hover:border-[var(--color-primary)]"
            }`}
                        >
                          <p className="font-medium">Internet Black & White</p>
                          <p
                            className={`text-xs mt-1 ${
                              formData.userIntBW
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            Grayscale digital advertisement placement
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* ================= PART 2 ================= */}
                    <div className="col-span-2 md:col-span-1 flex flex-col">
                      <p className="mb-2 text-sm text-center text-gray-600">
                        Select additional placement & highlight options
                        (optional)
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {/* CO Paper */}
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData({
                              userCOPaper: !formData.userCOPaper,
                            })
                          }
                          className={`h-full rounded-xl border p-4 text-left transition-all
            ${
              formData.userCOPaper
                ? "bg-[var(--color-primary-dark)] border-[var(--color-primary-dark)] text-white"
                : "border-gray-300 hover:border-[var(--color-primary)]"
            }`}
                        >
                          <p className="font-medium">CO Paper</p>
                          <p
                            className={`text-xs mt-1 ${
                              formData.userCOPaper
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            Placement decided by the newspaper
                          </p>
                        </button>

                        {/* Internet Highlight */}
                        <button
                          type="button"
                          disabled={!formData.userIntBW && !formData.userIntFC}
                          onClick={() =>
                            updateFormData({
                              userIntHighlight: !formData.userIntHighlight,
                            })
                          }
                          className={`h-full rounded-xl border p-4 text-left transition-all
            ${
              !formData.userIntBW && !formData.userIntFC
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : formData.userIntHighlight
                  ? "bg-[var(--color-primary-dark)] border-[var(--color-primary-dark)] text-white"
                  : "border-gray-300 hover:border-[var(--color-primary)]"
            }`}
                        >
                          <p className="font-medium">Internet Highlight</p>
                          <p
                            className={`text-xs mt-1 ${
                              formData.userIntHighlight
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            Featured placement to attract more views
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {/* Background tint price */}
            {selectedAdType.tint_color_price > 0 && (
              <div className="flex flex-col md:flex-row gap-4 md:mt-8">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.backgroundColor}
                    onChange={(e) =>
                      updateFormData({ backgroundColor: e.target.checked })
                    }
                  />
                  <span>
                    Background Color{" "}
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-sinhala), sans-serif",
                      }}
                    >
                      (පසුබිම වර්ණගන්වන්න)
                    </span>{" "}
                    {/* (LKR {selectedAdType.tint_color_price}) */}
                  </span>
                </label>
              </div>
            )}

            {/* Language Combination Checkbox */}
            {(selectedAdType.key === "classified" ||
              selectedAdType.key === "marriage") &&
              formData.selectedNewspaper?.is_lang_combine_allowed &&
              (formData.selectedNewspaper.combine_sin_price !== 0 ||
                formData.selectedNewspaper.combine_eng_price !== 0 ||
                formData.selectedNewspaper.combine_tam_price !== 0 ||
                formData.selectedNewspaper.combine_sin_eng_price !== 0 ||
                formData.selectedNewspaper.combine_sin_tam_price !== 0 ||
                formData.selectedNewspaper.combine_eng_tam_price !== 0) && (
                <div className="my-4 mt-8">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.userLangCombineSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;

                        updateFormData({
                          userLangCombineSelected: checked,

                          // 🔥 reset all if turned OFF
                          ...(checked
                            ? {}
                            : {
                                userLangCombineSelected_Eng: false,
                                userLangCombineSelected_Tam: false,
                                userLangCombineSelected_Sin: false,
                                userLangCombineSelected_Sin_Tam: false,
                                userLangCombineSelected_Sin_Eng: false,
                                userLangCombineSelected_Eng_Tam: false,
                              }),
                        });
                      }}
                    />
                    <span>
                      Combine with other papers{" "}
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-sinhala), sans-serif",
                        }}
                      >
                        (වෙනත් භාෂාවලින්ද පළ කරන්න)
                      </span>{" "}
                    </span>
                  </label>
                </div>
              )}
            {/* English and Tamil Language checkboxes */}
            {(selectedAdType.key === "classified" ||
              selectedAdType.key === "marriage") &&
              formData.userLangCombineSelected && (
                <div className="my-8 grid md:grid-cols-3 lg:grid-cols-3 grid-cols-1">
                  {languageOptions
                    .filter(([, , price]) => price !== 0)
                    .map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="language-combination"
                          checked={(formData as any)[key]}
                          onChange={() =>
                            updateFormData({
                              userLangCombineSelected_Eng: false,
                              userLangCombineSelected_Tam: false,
                              userLangCombineSelected_Sin: false,
                              userLangCombineSelected_Sin_Tam: false,
                              userLangCombineSelected_Sin_Eng: false,
                              userLangCombineSelected_Eng_Tam: false,
                              [key]: true,
                            })
                          }
                        />
                        <span>
                          {label}
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-sinhala), sans-serif",
                            }}
                          ></span>{" "}
                        </span>
                      </label>
                    ))}
                </div>
              )}
            {/* Post in website? checkbox */}
            <div>
              {selectedAdType.is_allow_combined && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.combinedAd}
                    onChange={(e) =>
                      updateFormData({ combinedAd: e.target.checked })
                    }
                  />
                  <span>
                    Post in Website{" "}
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-sinhala), sans-serif",
                      }}
                    >
                      (වෙබ් අඩවියේ පළකරන්න)
                    </span>{" "}
                  </span>
                </label>
              )}
            </div>
            {/* Special Notes non-casual */}
            <div className=" md:mt-8">
              <label className="block font-medium mb-1">
                Special Notes{" "}
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                >
                  (විශේෂ සටහන්)
                </span>{" "}
              </label>
              <textarea
                rows={2}
                value={formData.specialNotes}
                placeholder="Specific Page, Position on a Page etc (නිශ්චිත පිටුව, පිටුවක පිහිටීම ආදිය)"
                onChange={(e) =>
                  updateFormData({ specialNotes: e.target.value })
                }
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent resize-none"
              />
            </div>
          </div>
        )}

        {/* Fields for Casual Types */}
        {selectedAdType && selectedAdType?.key === "casual" && (
          <div className="md:w-full">
            <h2 className="text-2xl font-bold text-center mb-2">
              Select Ad Section
            </h2>
            <h2
              style={{
                fontFamily: "var(--font-sinhala), sans-serif",
              }}
              className="text-center"
            >
              <span>(දැන්වීම පළ කරන කොටස තෝරන්න)</span>
            </h2>

            {/* Ad Section grid */}
            {selectedAdType?.sections?.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {selectedAdType.sections.map((section) => {
                    const isSelected = selectedSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        disabled={!section.isAvailable}
                        onClick={() => {
                          setSelectedSection(section.id);
                          updateFormData({ sectionId: section.id });
                        }}
                        className={` min-w-[45%] sm:min-w-[45%] md:min-w-[23%] lg:min-w-[23%] h-[110px]  rounded-xl border px-4 py-6 flex flex-col items-center justify-center text-center transition-colors transition-shadow duration-200 focus:outline-none ${
                          !section.isAvailable
                            ? `  bg-gray-50  border-gray-200  text-gray-400  cursor-not-allowed`
                            : isSelected
                              ? ` bg-white border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]`
                              : ` bg-white border-gray-300 hover:border-[var(--color-primary-accent)]`
                        }`}
                      >
                        <h4 className="font-bold text-[var(--color-primary-dark)]">
                          <span
                            className="text-sm ml-1"
                            style={{
                              fontFamily: "var(--font-sinhala), sans-serif",
                              fontWeight: "bold",
                            }}
                          >
                            {section.name}
                          </span>
                        </h4>

                        {section.extraNotes && (
                          <p className="mt-1 text-xs text-[var(--color-text-highlight)] text-center">
                            <span
                              className="text-sm ml-1"
                              style={{
                                fontFamily: "var(--font-sinhala), sans-serif",
                                fontSize: "10px",
                              }}
                            >
                              {section.extraNotes}
                            </span>
                          </p>
                        )}

                        {section.isSingleColumn && (
                          <p className="mt-1 text-xs text-[var(--color-text-highlight)] text-center">
                            <span
                              className="text-sm ml-1"
                              style={{
                                fontFamily: "var(--font-sinhala), sans-serif",
                                fontSize: "10px",
                              }}
                            >
                              it is single column
                            </span>
                          </p>
                        )}

                        {!section.isAvailable && (
                          <span className="mt-2 text-[10px] uppercase tracking-wide text-gray-500">
                            Unavailable
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSectionData && (
              <>
                {/* Publish Date - Casual */}
                <div className="w-full">
                  <label className="block font-medium mb-1">
                    Publish Date{" "}
                    <span
                      className="text-sm"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      (දැන්වීම පළ කරන දිනය)
                    </span>
                    <span className="text-red-500">*</span>
                  </label>
                  {/* publish date for casual */}
                  <DatePicker
                    selected={
                      formData.publishDate
                        ? new Date(formData.publishDate + "T00:00:00")
                        : null
                    }
                    onChange={(date: Date | null) => {
                      updateFormData({ publishDate: formatDateLocal(date!) });
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={minDate}
                    filterDate={isAllowedDate}
                    placeholderText={
                      formData.selectedNewspaper?.type === "Monthly"
                        ? "Select allowed monthly date"
                        : "Select publish date"
                    }
                    renderCustomHeader={({
                      date,
                      decreaseMonth,
                      increaseMonth,
                    }) => (
                      <div className="flex justify-between items-center px-2">
                        <button
                          type="button"
                          onClick={decreaseMonth}
                          className="text-[var(--color-primary-dark)]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-6 h-6"
                            fill="#160f29"
                          >
                            <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z" />
                          </svg>
                        </button>
                        <span className="font-medium">
                          {date.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={increaseMonth}
                          className="text-[var(--color-primary-dark)]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-6 h-6"
                            fill="#160f29"
                          >
                            <path d="M9.3 18.7a1 1 0 0 1 0-1.4L14.6 12 9.3 6.7a1 1 0 1 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-accent)]"
                  />
                </div>

                {/* Has own Artwork? checkbox */}
                <div className="md:mt-8">
                  <label className="block mb-2 font-medium">
                    I have my own artwork
                    <span
                      className="text-sm ml-1"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      (මගේම කලාකෘතියක් ඇත)
                    </span>
                  </label>

                  <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
                    {/* Yes Button */}
                    <button
                      type="button"
                      onClick={() => updateFormData({ hasOwnArtwork: true })}
                      className={`px-4 py-2 text-sm font-semibold transition ${
                        formData.hasOwnArtwork
                          ? "bg-[var(--color-primary-accent)] text-white"
                          : "bg-white text-[var(--color-primary-dark)] hover:bg-primary-accent/20"
                      }`}
                    >
                      Yes
                    </button>

                    {/* No Button */}
                    <button
                      type="button"
                      onClick={() => updateFormData({ hasOwnArtwork: false })}
                      className={`px-4 py-2 text-sm font-semibold transition ${
                        formData.hasOwnArtwork === false
                          ? "bg-[var(--color-primary-accent)] text-white"
                          : "bg-white text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-accent)]/20"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Advetisement Text & Need Artwork? Checkbox - Casual - Only when user doesn't have artwork */}
                {!formData.hasOwnArtwork && (
                  <>
                    {/* Advertisement Text */}
                    <div className="relative md:mt-8">
                      <label className="block font-medium mb-1">
                        Advertisement Text{" "}
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: "var(--font-sinhala), sans-serif",
                          }}
                        >
                          (දැන්වීම් විස්තරය)
                        </span>{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        rows={5}
                        placeholder="Type your advertisement here"
                        value={formData.adText || ""}
                        onChange={(e) => {
                          const itsa = e.target.value;
                          updateFormData({ adText: itsa });
                        }}
                        required
                        className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-primary-accent resize-none"
                      />
                      <p className="text-sm">
                        To type in Sinhala, go to a{" "}
                        <a
                          href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-800 hover:text-blue-600"
                        >
                          Sinhala typing tool
                        </a>
                        , type your advertisement, then copy and paste it
                        here.{" "}
                      </p>
                      <p className="text-sm">
                        <span
                          className="text-xs"
                          style={{
                            fontFamily: "var(--font-sinhala), sans-serif",
                          }}
                        >
                          (සිංහලෙන් ටයිප් කිරීමට,{" "}
                          <a
                            href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-800 hover:text-blue-600"
                          >
                            සිංහල ටයිපින්{" "}
                          </a>
                          මෙවලමට පිවිස ඔබේ දැන්වීම ටයිප් කර, පිටපත් කර මෙහි
                          ඇතුළත් කරන්න.)
                        </span>{" "}
                      </p>
                    </div>

                    {/* Need Artwork? Checkbox */}
                    <div className="md:mt-8">
                      <label className="block mb-2 font-medium">
                        Do you need an artwork designed?
                        <span
                          className="text-sm ml-1"
                          style={{
                            fontFamily: "var(--font-sinhala), sans-serif",
                          }}
                        >
                          (ඔබට කලාකෘතියක් නිර්මාණය කරගැනීමට අවශ්‍යද?)
                        </span>
                      </label>

                      <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
                        {/* Yes Button */}
                        <button
                          type="button"
                          onClick={() => updateFormData({ needArtwork: true })}
                          className={`px-4 py-2 text-sm font-semibold transition ${
                            formData.needArtwork
                              ? "bg-[var(--color-primary-accent)] text-white"
                              : "bg-white text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-accent)]/20"
                          }`}
                        >
                          Yes
                        </button>

                        {/* No Button */}
                        <button
                          type="button"
                          onClick={() => updateFormData({ needArtwork: false })}
                          className={`px-4 py-2 text-sm font-semibold transition ${
                            formData.needArtwork === false
                              ? "bg-[var(--color-primary-accent)] text-white"
                              : "bg-white text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-accent)]/20"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {formData.needArtwork && (
                      <>
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (!files.length) return;

                            // Enforce max count
                            const remainingSlots =
                              MAX_FILES -
                              (formData.uploadedImages?.length ?? 0);

                            if (remainingSlots <= 0) {
                              alert("You can upload a maximum of 4 images.");
                              return;
                            }

                            const selectedFiles = files.slice(
                              0,
                              remainingSlots,
                            );

                            // Size validation
                            const oversized = selectedFiles.find(
                              (file) => file.size > MAX_SIZE,
                            );
                            if (oversized) {
                              alert("Each image must be under 3 MB.");
                              return;
                            }

                            try {
                              updateFormData({ uploading: true });

                              const uploadedUrls: string[] = [];

                              for (const file of selectedFiles) {
                                const data =
                                  await uploadImageToCloudinary(file);
                                uploadedUrls.push(data.secure_url);
                              }

                              updateFormData({
                                uploadedImages: [
                                  ...(formData.uploadedImages ?? []),
                                  ...uploadedUrls,
                                ],
                                uploading: false,
                              });
                            } catch (error) {
                              console.error(error);
                              updateFormData({ uploading: false });
                              alert("One or more images failed to upload.");
                            } finally {
                              // allow re-selecting same file again
                              e.target.value = "";
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-accent file:text-white file:cursor-pointer hover:file:bg-primary-accent/90 transition"
                        />

                        {/* Optional status text (non-breaking, visual only) */}
                        {formData.uploading && (
                          <p className="text-sm text-gray-500 mt-2">
                            Uploading images…
                          </p>
                        )}
                        {formData.uploadedImages?.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.uploadedImages.map(
                              (url: string, index: number) => (
                                <div key={url} className="relative group">
                                  <img
                                    src={url}
                                    alt={`Uploaded ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border"
                                  />

                                  {/* Remove button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated =
                                        formData.uploadedImages.filter(
                                          (_: any, i: any) => i !== index,
                                        );
                                      updateFormData({
                                        uploadedImages: updated,
                                      });
                                    }}
                                    className="absolute top-2 right-2  bg-black/70 text-white text-xs rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        <p className="text-sm text-gray-500 mt-2">
                          {formData.uploadedImages.length} / 8 images uploaded
                        </p>
                      </>
                    )}
                  </>
                )}

                {/* Upload input field for user's artwork - Casual */}
                {formData.hasOwnArtwork && (
                  <div className="md:mt-8">
                    <label className="block mb-2 font-medium">
                      Upload Image{" "}
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-sinhala), sans-serif",
                        }}
                      >
                        (ඡායාරූප ඇතුලත් කරන්න)
                      </span>{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (!files.length) return;

                        // Enforce max count
                        const remainingSlots =
                          MAX_FILES - (formData.uploadedImages?.length ?? 0);

                        if (remainingSlots <= 0) {
                          alert("You can upload a maximum of 4 images.");
                          return;
                        }

                        const selectedFiles = files.slice(0, remainingSlots);

                        // Size validation
                        const oversized = selectedFiles.find(
                          (file) => file.size > MAX_SIZE,
                        );
                        if (oversized) {
                          alert("Each image must be under 3 MB.");
                          return;
                        }

                        try {
                          updateFormData({ uploading: true });

                          const uploadedUrls: string[] = [];

                          for (const file of selectedFiles) {
                            const data = await uploadImageToCloudinary(file);
                            uploadedUrls.push(data.secure_url);
                          }

                          updateFormData({
                            uploadedImages: [
                              ...(formData.uploadedImages ?? []),
                              ...uploadedUrls,
                            ],
                            uploading: false,
                          });
                        } catch (error) {
                          console.error(error);
                          updateFormData({ uploading: false });
                          alert("One or more images failed to upload.");
                        } finally {
                          // allow re-selecting same file again
                          e.target.value = "";
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-accent file:text-white file:cursor-pointer hover:file:bg-primary-accent/90 transition"
                    />

                    {selectedAdType.extra_notes1 && (
                      <p className="text-xs text-gray-500">
                        {selectedAdType.extra_notes1}
                        <span className="text-red-500">**</span>
                      </p>
                    )}

                    {/* Optional status text (non-breaking, visual only) */}
                    {formData.uploading && (
                      <p className="text-sm text-gray-500 mt-2">
                        Uploading images…
                      </p>
                    )}
                    {formData.uploadedImages?.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.uploadedImages.map(
                          (url: string, index: number) => (
                            <div key={url} className="relative group">
                              <img
                                src={url}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated =
                                    formData.uploadedImages.filter(
                                      (_: any, i: any) => i !== index,
                                    );
                                  updateFormData({ uploadedImages: updated });
                                }}
                                className="absolute top-2 right-2  bg-black/70 text-white text-xs rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                ✕
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      {formData.uploadedImages.length} / 8 images uploaded
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Advertisement Size Selector */}
            {selectedSectionData && (
              <>
                <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
                  <h3 className="mb-1 font-normal text-center text-[var(--color-primary-dark)]">
                    Advertisement Size
                  </h3>
                  <h3
                    className="mb-2 font-normal text-[var(--color-primary-dark)] text-center text-sm"
                    style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                  >
                    (දැන්වීමේ ප්‍රමාණය)
                  </h3>
                  <div className="flex flex-col m-auto justify-center text-center mb-8">
                    <p className="text-sm">
                      <button
                        onClick={() => setIsOpen(true)}
                        className="text-blue-800 hover:text-blue-600"
                      >
                        Learn more
                      </button>
                      &nbsp;about cost calculation for casual ads.
                    </p>
                  </div>

                  {sizeTypeOptions.length > 0 && (
                    <>
                      <div className="flex flex-col md:flex-row gap-4 mt-4">
                        {sizeTypeOptions.map((option) => (
                          <label
                            key={option.key}
                            className={`cursor-pointer flex flex-col items-center justify-center w-full md:w-1/2 border rounded-lg p-5 text-center transition
        ${
          formData.adSizeType === option.key
            ? "bg-[var(--color-primary-dark)] text-white border-primary"
            : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary-accent)]"
        }`}
                          >
                            <input
                              type="radio"
                              name="adSizeType"
                              value={option.key}
                              className="hidden"
                              checked={formData.adSizeType === option.key}
                              onChange={() => {
                                updateFormData({
                                  adSizeType: option.key,
                                  colorOption: "",
                                  boxType: 0, // 👈 reset box selection
                                });
                                setselectedSize(option.key);
                                setselectedColor(0);
                              }}
                            />

                            <span className="font-semibold text-sm capitalize">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  {boxOptions.length > 0 && (
                    <>
                      {sizeTypeOptions.length > 0 && boxOptions.length > 0 && (
                        <div className="relative my-8 flex items-center">
                          <div className="flex-grow border-t border-gray-300" />
                          <span className="mx-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            OR
                          </span>
                          <div className="flex-grow border-t border-gray-300" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {boxOptions.map((option) => (
                          <label
                            key={option.key}
                            className={`cursor-pointer flex flex-col items-center justify-center h-24 border rounded-xl text-center transition
        ${
          formData.boxType === option.key
            ? "bg-[var(--color-primary-dark)] text-white border-primary"
            : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary-accent)]"
        }`}
                          >
                            <input
                              type="radio"
                              name="boxType"
                              value={option.key}
                              className="hidden"
                              checked={formData.boxType === option.key}
                              onChange={() => {
                                updateFormData({
                                  boxType: option.key,
                                  adSizeType: "", // 👈 reset size selection
                                  colorOption: "",
                                });
                                setselectedSize("");
                                setselectedColor(0);
                                setselectedBoxPrice(option.price);
                              }}
                            />

                            <span className="font-semibold text-sm">
                              {option.label}
                            </span>

                            <span className="text-xs opacity-80">
                              Rs. {option.price.toLocaleString()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {formData.adSizeType == "custom" && (
                  <>
                    <div className="w-full flex flex-col justify-center items-center">
                      {/* No of Columns */}
                      <div
                        id="no1"
                        className=" flex flex-col justify-center items-center md:w-1/2 mt-8"
                      >
                        <label className="block font-medium mb-2">
                          No. of Columns{" "}
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-sinhala), sans-serif",
                            }}
                          >
                            (තීරු ගණන)
                          </span>{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        {!selectedSectionData.isSingleColumn && (
                          <div className="flex flex-wrap gap-2 my-2">
                            {Array.from(
                              { length: noOfColumnsPerPage },
                              (_, i) => i + 1,
                            ).map((num) => (
                              <label key={num} className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="noOfColumns"
                                  value={num}
                                  checked={formData.noOfColumns === num}
                                  onChange={() => {
                                    updateFormData({ noOfColumns: num });
                                    setselectedColumns(num);
                                  }}
                                  className="hidden"
                                />
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                                    formData.noOfColumns === num
                                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                      : "border-gray-300 bg-white text-gray-700 hover:border-[var(--color-primary)]"
                                  }`}
                                >
                                  {num}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

                        {selectedSectionData.isSingleColumn && (
                          <>
                            <div className="flex flex-wrap gap-2 my-2">
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="noOfColumns"
                                  value={1}
                                  checked={formData.noOfColumns === 1}
                                  onChange={() => {
                                    updateFormData({ noOfColumns: 1 });
                                    setselectedColumns(1);
                                  }}
                                  className="hidden"
                                />
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                                    formData.noOfColumns === 1
                                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                      : "border-gray-300 bg-white text-gray-700 hover:border-[var(--color-primary)]"
                                  }`}
                                >
                                  {1}
                                </div>
                              </label>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Ad Height */}
                      <div
                        id="no2"
                        className="flex flex-col justify-center items-center md:w-1/2 mt-8"
                      >
                        <label className="block font-medium mb-2">
                          Ad Height (cm){" "}
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-sinhala), sans-serif",
                            }}
                          >
                            (උස සෙ.මී.)
                          </span>
                        </label>

                        <div className="flex items-center gap-4">
                          {/* <input
                          type="range"
                          min={minAdHeight}
                          max={maxColHeight}
                          value={formData.adHeight}
                          onChange={(e) => {
                            console.log("selecetd size ", selectedSize);
                            updateFormData({
                              adHeight: Number(e.target.value),
                            });
                          }}
                          className="flex-1 accent-[var(--color-primary)] cursor-pointer"
                        />

                        <label className="block font-medium mb-2">
                          {formData.adHeight} (cm){" "}
                        </label> */}

                          <div className="flex items-center gap-4 my-2">
                            {/* Minus button */}
                            <button
                              type="button"
                              onClick={() => {
                                updateFormData({
                                  adHeight: Math.max(
                                    minAdHeight,
                                    formData.adHeight - 1,
                                  ),
                                });
                              }}
                              disabled={formData.adHeight <= minAdHeight}
                              className="h-10 w-10 rounded-md border border-gray-300 text-lg font-bold
               hover:border-[var(--color-primary)]
               disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              −
                            </button>

                            {/* Value display */}
                            <div className="min-w-[80px] text-center font-semibold">
                              {formData.adHeight} cm
                            </div>

                            {/* Plus button */}
                            <button
                              type="button"
                              onClick={() => {
                                updateFormData({
                                  adHeight: Math.min(
                                    maxColHeight,
                                    formData.adHeight + 1,
                                  ),
                                });
                              }}
                              disabled={formData.adHeight >= maxColHeight}
                              className="h-10 w-10 rounded-md border border-gray-300 text-lg font-bold
               hover:border-[var(--color-primary)]
               disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          {/* <div className="mt-1 text-xs text-gray-500">
                          Min: {minAdHeight} cm &nbsp;|&nbsp; Max:{" "}
                          {maxColHeight} cm
                        </div> */}

                          {/* <input
                        type="number"
                        min={minAdHeight}
                        max={maxColHeight}
                        value={
                          formData.adSizeType === "custom"
                            ? formData.selectedNewspaper.min_ad_height
                            : 0
                        }
                        onChange={(e) =>
                          updateFormData({
                            adHeight: Number(e.target.value),
                          })
                        }
                        className="w-20 h-10 rounded-md border border-gray-300 text-center text-sm font-semibold focus:border-[var(--color-primary)] focus:outline-none"
                      /> */}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Min: {minAdHeight} cm &nbsp;|&nbsp; Max:{" "}
                          {maxColHeight} cm
                        </div>
                      </div>
                    </div>
                    {/* <div className="flex w-1/4"></div> */}
                  </>
                )}

                {/* Ad Color Selector */}
                {formData.adSizeType !== "" && (
                  <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
                    <h3 className="mb-1 font-normal text-[var(--color-primary-dark)] text-center">
                      Advertisement Color Options
                    </h3>
                    <h3
                      className="mb-8 font-normal text-[var(--color-primary-dark)] text-center text-sm"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      (දැන්වීමේ වර්ණ)
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4">
                      {colorOptions.map((option) => {
                        const isCustom = selectedSize === "custom";

                        return (
                          <label
                            key={option.key}
                            className={`cursor-pointer flex flex-col items-center justify-center sm:w-full md:w-1/4
          border rounded-lg p-3 text-center transition
          ${
            formData.colorOption === option.key
              ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary)]"
              : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary-accent)]"
          }
        `}
                          >
                            <input
                              type="radio"
                              name="colorOption"
                              value={option.key}
                              className="hidden"
                              checked={formData.colorOption === option.key}
                              onChange={() => {
                                updateFormData({
                                  colorOption: option.key,
                                });
                                setselectedColor(option.price);
                              }}
                            />

                            <span className="font-semibold text-sm">
                              {option.label}
                            </span>

                            {option.subLabel && (
                              <span
                                className="text-xs mt-1"
                                style={{
                                  fontFamily: "var(--font-sinhala), sans-serif",
                                }}
                              >
                                {option.subLabel}
                              </span>
                            )}

                            <span
                              className="text-xs mt-1 text-[var(--color-text-dark-highlight)]"
                              style={{
                                fontFamily: "var(--font-sinhala), sans-serif",
                              }}
                            >
                              {option.price} LKR
                              {isCustom ? " per Column" : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Dropdown - Casual */}
                {formData.boxType > 0 && (
                  <>
                    <div>
                      <label className="block font-medium mb-1 md:mt-8">
                        Category{" "}
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: "var(--font-sinhala), sans-serif",
                          }}
                        >
                          (වර්ගීකරණය)
                        </span>{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          updateFormData({
                            classifiedCategory: e.target.value,
                          });
                          setSelectedSubCategory("");
                        }}
                        className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                      >
                        <option value="">Select Category</option>
                        {/* {selectedAdType.categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))} */}
                        <option value="Real Estate">Real Estate</option>
                        <option value="Health & Beauty">Health & Beauty</option>
                        <option value="Automobile">Automobile</option>
                        <option value="Personal">Personal</option>
                        <option value="Employment">Employment</option>
                        <option value="General">General</option>
                        <option value="Trade">Trade</option>
                      </select>
                    </div>

                    {/* Subcategory Dropdown - Casual */}
                    {selectedCategory && (
                      <div className="md:mt-8">
                        <label className="block font-medium mb-1">
                          Sub Category{" "}
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-sinhala), sans-serif",
                            }}
                          >
                            (දැන්වීම් ස්වභාවය)
                          </span>{" "}
                        </label>
                        <select
                          value={formData.subCategory ?? ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : null;

                            updateFormData({ subCategory: String(value) });
                            setSelectedSubCategory(String(value));
                          }}
                          className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                        >
                          <option value="">Select Subcategory</option>

                          {subCategoryOptions.map((sub) => (
                            <option
                              key={sub.classification_number ?? sub.name}
                              value={sub.classification_number ?? ""}
                            >
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Special Notes casual */}
                <div className=" md:mt-8">
                  <label className="block font-medium mb-1">
                    Special Notes{" "}
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-sinhala), sans-serif",
                      }}
                    >
                      (විශේෂ සටහන්)
                    </span>{" "}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.specialNotes}
                    placeholder="Specific Page, Position on a Page etc (නිශ්චිත පිටුව, පිටුවක පිහිටීම ආදිය)"
                    onChange={(e) =>
                      updateFormData({ specialNotes: e.target.value })
                    }
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent resize-none"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {selectedAdType && (
          <div className="sticky bottom-0 w-full flex justify-center z-40">
            <div className="w-full md:w-1/2">
              {/* Expandable Panel */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isExpanded ? "max-h-[40vh]" : "max-h-0"
                }`}
              >
                <div className="bg-primary/50 shadow-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary-dark)]">
                    Price Breakdown
                  </h3>

                  <ul className="divide-y divide-gray-200">
                    {priceBreakdown.map((item, i) => (
                      <li
                        key={i}
                        className="flex justify-between py-2 text-sm text-[var(--color-text)]"
                      >
                        <span>{item.label}</span>
                        <span className="font-medium">
                          LKR {item.amount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="bg-[var(--color-primary)] text-white px-5 py-3 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-sm opacity-80">Total</span>
                  <div className="text-lg font-bold">
                    LKR {totalPrice.toLocaleString()}
                  </div>
                </div>

                {/* Arrow Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="bg-[var(--color-orange-accent)] text-[var(--color-primary-dark)] w-10 h-10 flex items-center justify-center rounded-full"
                >
                  <span
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▲
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* {selectedAdType && (
          <div className="md:w-1/3">
            <div className="bg-blue-100 p-5 rounded-xl shadow-sm sm:max-w-md w-full mx-auto">
              <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary-dark)]">
                Price
              </h3>

              <ul className="divide-y divide-gray-200">
                {priceBreakdown.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between py-2 text-sm text-[var(--color-text)]"
                  >
                    <span>{item.label}</span>
                    <span className="font-medium">
                      LKR {item.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
                <span className="text-base font-semibold text-[var(--color-primary-dark)]">
                  Total
                </span>
                <span className="text-base font-bold text-[var(--color-primary)]">
                  LKR {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {showScrollMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 border border-b-blue-950 bg-white text-primary-dark px-4 py-3 rounded-lg shadow-lg animate-bounce text-center">
          Scroll down to continue ↓
          <br />
          <span
            className="text-sm"
            style={{
              fontFamily: "var(--font-sinhala), sans-serif",
            }}
          >
            (පහලට යන්න)
          </span>
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 min-w-[300px]">
          <div
            className="relative
              w-full
              md:min-w-[768px]
              max-w-2xl
              bg-white
              rounded-xl
              shadow-2xl
              overflow-hidden
              border
              border-[var(--color-primary-dark)]
              animate-fadeIn"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-[var(--color-primary)] font-bold text-2xl transition-colors"
            >
              &times;
            </button>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-primary-dark)] text-center">
                Casual Advertisement Tips
              </h2>

              {!formData.selectedNewspaper?.lm_description && (
                <p className="text-center text-gray-400 text-sm">
                  No information available.
                </p>
              )}

              {/* Dynamic Description */}
              {formData.selectedNewspaper?.lm_description && (
                <div className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {parseStyledText(
                    formData.selectedNewspaper.lm_description,
                  ).map((part, index) => {
                    if (part.type === "br") return <br key={index} />;

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

              {/* Dynamic Image
              {formData.selectedNewspaper?.lm_image && (
                <div className="flex justify-center">
                  <img
                    src={formData.selectedNewspaper.lm_image}
                    alt="Learn more"
                    className="max-w-full h-auto rounded-lg border border-[var(--color-primary-accent)] shadow-sm"
                  />
                </div>
              )} */}

              {/* {images.length > 0 && (
                <div className="w-full">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    onSlideChange={(swiper) =>
                      setActiveIndex(swiper.activeIndex)
                    }
                  >
                    {images.map((imageUrl: string, index: number) => (
                      <SwiperSlide key={index}>
                        <div className="mt-3 flex justify-center gap-2">
                          {images.map((url: string, index: number) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              className={`h-16 w-16 cursor-pointer rounded border object-cover ${
                                activeIndex === index
                                  ? "border-[var(--color-primary-accent)]"
                                  : "border-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )} */}

              {images.length > 0 && (
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  // autoplay={{
                  //   delay: 10000,
                  //   disableOnInteraction: false,
                  // }}
                  slidesPerView={1}
                  spaceBetween={10}
                >
                  {images.map((imageUrl: string, index: number) => (
                    <SwiperSlide key={index}>
                      <img
                        src={imageUrl}
                        alt={`Learn More ${index + 1}`}
                        className="mx-auto max-h-[500px] rounded-lg border border-[var(--color-primary-accent)] shadow-sm"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
