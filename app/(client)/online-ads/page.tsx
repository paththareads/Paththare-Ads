"use client";

import Link from "next/link";

export default function OnlineAdsComingSoonPage() {
  return (
    <main className="flex-1 flex flex-col px-6 md:px-12 py-24 space-y-12">
      <section className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-10">
        {/* Heading */}
        <header className="flex flex-col items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-dark">
            Online Ads Space
          </h1>

          <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
            A dedicated space for businesses and individuals to promote their
            services online is coming soon to Paththare Ads.
          </p>

          <p className="text-sm text-gray-500 max-w-2xl">
            <span
              style={{
                fontFamily: "var(--font-sinhala), sans-serif",
              }}
            >
              ව්‍යාපාර සහ පුද්ගලයින්ට ඔන්ලයින් දැන්වීම් ප්‍රචාරණය සඳහා වෙන්වූ
              විශේෂ වේදිකාව ඉදිරියේදී ඔබට ලබා දෙනු ඇත.
            </span>
          </p>
        </header>

        {/* Visual Card */}
        <div className="w-full bg-gray-50 rounded-xl shadow-md p-10 flex flex-col items-center gap-6">
          <div className="text-6xl">🚀</div>

          <h2 className="text-2xl font-semibold text-primary-accent">
            Something Exciting is Coming
          </h2>

          <p className="text-gray-600 max-w-xl leading-relaxed">
            We are currently building a powerful online advertising platform
            where you will be able to showcase banner ads, promotions, and
            featured listings directly to thousands of viewers.
          </p>

          <div className="text-sm text-gray-500">
            Stay tuned — this feature is under development.
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/post-ad"
            className="rounded-md bg-primary px-8 py-3 text-white font-medium transition hover:brightness-110"
          >
            Post a Newspaper Ad
          </Link>

          <Link
            href="/contact-us"
            className="rounded-md border border-gray-300 px-8 py-3 text-gray-700 font-medium transition hover:bg-gray-100"
          >
            Contact Us
          </Link>
        </div>

        {/* Optional Notify Section */}
        <div className="pt-8 text-sm text-gray-500">
          Want to be notified when this launches?
          <span className="font-medium text-primary-accent">
            {" "}
            Follow our updates.
          </span>
        </div>
      </section>
    </main>
  );
}
