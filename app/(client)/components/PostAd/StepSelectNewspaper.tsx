"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface StepSelectNewspaperProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  setIsNextEnabled?: (enabled: boolean) => void;
}

export default function StepSelectNewspaper({
  formData,
  updateFormData,
  nextStep,
  setIsNextEnabled,
}: StepSelectNewspaperProps) {
  const [activeTab, setActiveTab] = useState<
    "daily" | "sunday" | "weekly" | "monthly"
  >("daily");
  const tabs = [
    { key: "daily", en: "Daily", si: "දිනපතා පුවත්පත්" },
    { key: "sunday", en: "Sunday", si: "ඉරිදා පුවත්පත්" },
    { key: "weekly", en: "Weekly", si: "සතිපතා පුවත්පත්" },
    { key: "monthly", en: "Monthly", si: "මාසික පුවත්පත්" },
  ] as const;

  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setShowLeft(scrollLeft > 5);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  // ✅ Fetch newspapers from DB via API
  useEffect(() => {
    const fetchNewspapers = async () => {
      setLoading(true);
      const res = await fetch("/api/newspapers");
      const data = await res.json();
      setNewspapers(data);
      setLoading(false);
    };

    fetchNewspapers();
  }, []);

  // Filter newspapers by tab
  const filteredNewspapers = newspapers.filter((paper: any) => {
    const type = paper.type?.toLowerCase();
    return activeTab === "daily"
      ? type === "daily"
      : activeTab === "sunday"
        ? type === "sunday"
        : activeTab === "weekly"
          ? type === "weekly"
          : type === "monthly";
  });

  const handleSelectNewspaper = (paper: any) => {
    // console.log("select newspaper output", paper);
    // console.log(
    //   "select newspaper language output",
    //   paper.is_lang_combine_allowed,
    // );
    updateFormData({
      selectedNewspaper: {
        id: paper.id,
        name: paper.name,
        type: paper.type,
        name_sinhala: paper.name_sinhala,
        no_col_per_page: paper.no_col_per_page,
        col_height: paper.col_height,
        min_ad_height: paper.min_ad_height,
        tint_additional_charge: paper.tint_additional_charge,
        language: paper.language,
        newspaper_serial_no: paper.newspaper_serial_no,
        is_lang_combine_allowed: paper.is_lang_combine_allowed,
        combine_eng_price: paper.combine_eng_price,
        combine_tam_price: paper.combine_tam_price,
        combine_sin_price: paper.combine_sin_price,
        combine_sin_eng_price: paper.combine_sin_eng_price,
        combine_sin_tam_price: paper.combine_sin_tam_price,
        combine_eng_tam_price: paper.combine_eng_tam_price,
        allowed_weekdays: paper.allowed_weekdays,
        allowed_month_days: paper.allowed_month_days,
        lm_image: paper.lm_image,
        lm_description: paper.lm_description,
        ad_time_limit: paper.ad_time_limit,
        day_before: paper.day_before,
        date_before: paper.date_before,
      },
    });
    console.log("select newspaper form data output", formData);

    // setIsNextEnabled?.(true);
    nextStep();
  };

  // Restore state on back / refresh
  // useEffect(() => {
  //   if (formData.selectedNewspaper?.id) {
  //     setIsNextEnabled?.(true);
  //   }
  // }, [formData.selectedNewspaper, setIsNextEnabled]);

  useEffect(() => {
    if (formData.selectedNewspaper?.id && formData.currentStep === 1) {
      nextStep();
    }
  }, [formData.selectedNewspaper]);

  useEffect(() => {
    handleScroll();
  }, []);

  return (
    <section className="flex flex-col gap-6">
      {/* ================= HEADING ================= */}
      <header className="px-4 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Select a newspaper to get started
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sinhala), sans-serif",
          }}
          className="mt-1 text-gray-700"
        >
          (ඔබේ දැන්වීම පළ කිරීම ආරම්භ කිරීමට පුවත්පතක් තෝරන්න)
        </p>
      </header>

      {/* ================= TABS ================= */}

      {/* stack tabs */}
      {/* <div className="my-4 flex flex-wrap justify-center gap-3"> */}

      {/* scrolling tabs */}
      <div className="relative my-4">
        {showLeft && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 flex items-center justify-start bg-gradient-to-r from-white to-transparent z-10">
            <span className="text-primary text-2xl ml-1">‹</span>
          </div>
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            flex gap-3
            overflow-x-auto
            scroll-smooth
            snap-x snap-mandatory
            px-3
            md:justify-center
            md:overflow-visible
          "
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
              snap-center
              min-w-[110px]
              sm:min-w-[140px]
              px-4 py-3
              rounded-xl
              font-medium
              text-center
              transition
              break-words
              leading-tight
              ${
                activeTab === tab.key
                  ? "bg-primary-accent text-white shadow-md scale-[1.02]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
            >
              <div className="text-sm truncate">{tab.en}</div>

              <div
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                className={`mt-1 text-xs sm:text-sm break-words ${
                  activeTab === tab.key ? "text-white/90" : "text-gray-600"
                }`}
              >
                {tab.si}
              </div>
            </button>
          ))}
        </div>
        {showRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 flex items-center justify-end bg-gradient-to-l from-white to-transparent z-10">
            <span className="text-primary text-2xl mr-1">›</span>
          </div>
        )}
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="relative flex aspect-[3/2] items-center justify-center 
                  overflow-hidden rounded-lg bg-[var(--color-orange-accent)] animate-pulse shadow-sm"
            />
          ))
        ) : filteredNewspapers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10">
            <p className="text-center text-sm md:text-base text-gray-500 font-medium">
              No newspapers available
            </p>
            <p
              style={{
                fontFamily: "var(--font-sinhala), sans-serif",
              }}
              className="mt-1 text-gray-700 text-sm"
            >
              (පුවත්පත් නොමැත)
            </p>
          </div>
        ) : (
          filteredNewspapers.map((paper: any) => {
            const isSelected = formData.selectedNewspaper?.id === paper.id;

            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => handleSelectNewspaper(paper)}
                aria-pressed={isSelected}
                className={`relative flex aspect-[3/2] items-center justify-center 
    overflow-hidden rounded-xl border-2 border-gray-300
    shadow-md transition-all duration-300
    hover:scale-105 hover:shadow-xl
    focus:outline-none focus:ring-4 focus:ring-primary-accent
    ${isSelected ? "ring-4 ring-primary-accent" : ""}
  `}
              >
                <div
                  className={`flex items-center justify-center w-full h-full p-6 text-center
      rounded-lg font-semibold text-gray-800 text-lg md:text-2xl lg:text-2xl uppercase tracking-wide select-none transition-all duration-300`}
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                    background:
                      "radial-gradient(circle at center, #ffffff 50%, var(--color-primary) 100%)",
                  }}
                >
                  <h3>{paper.name_sinhala || paper.name}</h3>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
