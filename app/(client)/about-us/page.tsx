// app/about-us/page.tsx
"use client";

export default function AboutUsPage() {
  return (
    <div className="font-raleway bg-white min-h-screen flex flex-col py-12">
      {/* Main Content Section */}
      <main className="flex-1 flex flex-col px-6 md:px-12 py-12 space-y-12">
        <section className="max-w-5xl mx-auto flex flex-col space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-primary-dark">
            About Paththare Ads
          </h1>

          <p className="text-gray-700 text-lg leading-relaxed">
            Paththare Ads is a dedicated online newspaper advertising platform
            created to simplify access to Sri Lankan print media for both local
            and overseas advertisers. The platform is designed to support
            individuals and organizations seeking a dependable digital solution
            to connect with Sri Lanka’s leading newspapers.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed">
            Through a structured and professionally managed process, Paththare
            Ads facilitates the placement of personal, corporate, and commercial
            advertisements with a strong focus on transparency, accuracy, and
            operational efficiency. Acting as a trusted intermediary between
            advertisers and newspaper publishers, the platform ensures timely
            coordination, proper ad placement, and consistent publication
            standards.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed">
            Paththare Ads operates under Media Link (Pvt) Ltd, an established
            media advertising agency founded in 2009. With over a decade of
            expertise in newspaper, television, and radio (ATL) advertising, the
            company also provides BTL advertising services, including handout
            and leaflet printing, poster production, banners, and other
            promotional and branding materials.
          </p>

          {/* Mission & Vision */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary-accent">
              Our Mission
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              To provide a secure, transparent, and professionally managed
              digital platform that simplifies newspaper advertising while
              delivering dependable service and consistent value to individuals
              and businesses worldwide seeking access to Sri Lankan print media.
            </p>

            <h2 className="text-2xl font-semibold text-primary-accent">
              Our Vision
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              To be the leading and most trusted digital gateway for newspaper
              advertising in Sri Lanka.
            </p>
          </div>

          {/* Group Portfolio */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary-accent">
              Media Link Group Portfolio
            </h2>

            <ul className="list-disc list-inside space-y-3 text-gray-700 text-lg">
              <li>
                <strong>Litmus Bookshop:</strong> A trusted physical bookstore
                offering high-quality school and office stationery for both
                retail and wholesale customers.
              </li>
              <li>
                <strong>BookBooks.lk:</strong> A comprehensive online
                marketplace for school supplies serving retail and wholesale
                segments.
              </li>
              <li>
                <strong>Atlas Distributors:</strong> Authorized dealers and
                wholesalers of Atlas books, school supplies, and office
                stationery.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
