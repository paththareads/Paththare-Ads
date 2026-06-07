"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import NP1LankadeepaModal from "./components/modals/NP1LankadeepaModal";
import { ChevronUp } from "lucide-react";

interface PromoAd {
  id: number;
  ad_name?: string;
  ad_image?: string;
  ad_description?: string;
  is_active?: boolean;
  is_clickable?: boolean;
}

export default function HomePage() {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [promos, setPromos] = useState<PromoAd[]>([]);
  //new slider
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [carouselReady, setCarouselReady] = useState(false);

  useEffect(() => {
    async function loadPromos() {
      const res = await fetch("/api/promo");
      const json = await res.json();

      const activePromos = json.data.filter(
        (p: PromoAd) => p.is_active && p.ad_image,
      );

      setPromos(activePromos);
    }

    loadPromos();
  }, []);

  useEffect(() => {
    if (promos.length > 0 && imagesLoaded >= promos.length) {
      setCarouselReady(true);
    }
  }, [imagesLoaded, promos.length]);

  const secondsPerSlide = 4; // adjust speed here

  const animationDuration =
    promos.length > 0 ? promos.length * secondsPerSlide : 20;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (promos.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [promos, isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? promos.length - 1 : prev - 1));
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="flex flex-1 flex-col gap-16 py-4">
      {/* ================= HERO / INTRO SECTION ================= */}
      <section
        className="relative flex min-h-[90vh] w-full items-center bg-white bg-no-repeat bg-cover"
        // style={{ backgroundImage: "url('/banner-4-maroon.png')" }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:px-6">
          {/* LEFT SIDE */}
          <div className="flex w-full md:w-[40%] flex-col gap-6 text-white">
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl text-[var(--color-text)]">
              Reserve your Newspaper Ad in{" "}
              <span className="text-[var(--color-primary)]">Minutes</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              The easiest way to design and publish classified and casual ads in
              Sri Lankan Newspapers. Whether it’s for your business or a
              personal sale, get your message in front of millions, all from the
              palm of your hand. <strong>Fast, simple,</strong> and{" "}
              <strong>effective</strong>.
            </p>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              <strong>Paththare Ads </strong>
              <span
                className="md:text-base"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                සමගින් ඔබගේ ඕනෑම දැන්වීමක් පහසුවෙන් නිර්මාණය කර පළකරවාගන්න.
              </span>
            </p>

            <div className="flex flex-col gap-4 sm:flex-row justify-center md:justify-start md:mt-4">
              <Link
                href="/post-ad"
                className="specialBtn inline-flex items-center justify-center rounded-md px-12 py-4 text-xl font-medium transition"
              >
                Post Ad Now
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE – VERTICAL AUTO CAROUSEL
          <div className="flex w-full md:w-[60%] justify-end xs:justify-center">
            <div className="carousel-container relative h-[520px] w-full max-w-xl overflow-hidden rounded-2xl shadow-xl">
              <div
                className="carousel-track flex flex-col"
                style={{ animationDuration: `${animationDuration}s` }}
              >
                {[...promos, ...promos].map((promo, index) => (
                  <div key={index} className="p-2">
                    <div className="aspect-video overflow-hidden rounded-xl">
                      <img
                        src={promo.ad_image}
                        alt={promo.ad_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

          {/* RIGHT SIDE – PREMIUM CAROUSEL */}
          <div className="flex w-full md:w-[60%] justify-center">
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {!carouselReady && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]" />
                </div>
              )}
              {/* SLIDES */}
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {promos.map((promo) => (
                  <div key={promo.id} className="min-w-full">
                    {promo.is_clickable ? (
                      <a href="#" className="block">
                        <img
                          src={promo.ad_image}
                          alt={promo.ad_name}
                          onLoad={() => setImagesLoaded((prev) => prev + 1)}
                          className={`h-[250px] md:h-[510px] w-full object-contain md:object-cover transition-opacity duration-500 ${
                            carouselReady ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </a>
                    ) : (
                      <img
                        src={promo.ad_image}
                        alt={promo.ad_name}
                        onLoad={() => setImagesLoaded((prev) => prev + 1)}
                        className={`h-[250px] md:h-[510px] w-full object-contain md:object-cover transition-opacity duration-500 ${
                          carouselReady ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* PREVIOUS */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur hover:bg-black/60"
              >
                ‹
              </button>

              {/* NEXT */}
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur hover:bg-black/60"
              >
                ›
              </button>

              {/* DOTS */}
              <div className="absolute bottom-4 flex w-full justify-center gap-2">
                {promos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      currentIndex === index ? "bg-white w-5" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Animation Styles */}
        <style jsx>{`
          .carousel-track {
            animation-name: scrollVertical;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          @keyframes scrollVertical {
            0% {
              transform: translateY(0%);
            }
            100% {
              transform: translateY(-50%);
            }
          }

          .carousel-container:hover .carousel-track {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ================= MODAL ================= */}
      <NP1LankadeepaModal
        isOpen={activeModal === 0}
        onClose={() => setActiveModal(null)}
      />

      {/* ================= BACK TO TOP ================= */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#1E2021] p-3 text-[#fdca90] shadow-lg transition hover:bg-[#2a2c2d]"
        >
          <ChevronUp size={22} />
        </button>
      )}
    </main>
  );
}
