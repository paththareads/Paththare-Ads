"use client";

import Link from "next/link";

export default function HowToPostAdPage() {
  const statusColorHandler = (status_: string) => {
    switch (status_) {
      case "Approved":
        return "bg-green-600 text-white";
      case "Declined":
        return "bg-gray-600 text-white";
      case "Resubmitted":
        return "bg-blue-600 text-white";
      case "Revision":
        return "bg-fuchsia-800 text-white";
      case "PaymentPending":
        return "bg-amber-600 text-white";
      case "Pending":
        return "bg-red-700  text-white";
      case "Print":
        return "bg-violet-950 text-white";
      case "UpdateImage":
        return "bg-amber-900 text-white";
      case "PriceChange":
        return "bg-yellow-500 text-white";
      default:
        return "bg-black-900 text-white";
    }
  };
  const steps = [
    {
      title: "Select & Design",
      desc: "Choose your newspaper Type Category. Type Ad content or upload your Art work.",
    },
    {
      title: "Secure Payment",
      desc: "Pay securely using your credit/Debit card or Bank Transfer. We use industry-standard encryption.",
    },
    {
      title: "Get Published",
      desc: "Sit back and relax. We handle the submission process and ensure your ad appears in the next print.",
    },
  ];

  return (
    <main className="flex-1 flex flex-col px-6 md:px-12 py-24 space-y-12">
      <section className="max-w-6xl mx-auto flex flex-col space-y-10">
        {/* Heading */}
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-dark">
            How to Post Your Ad
          </h1>

          <p className="max-w-5xl text-gray-700 text-lg leading-relaxed">
            Follow this{" "}
            <span className="font-semibold italic text-primary-dark">
              Simple 3 – Step Process
            </span>{" "}
            to create, submit, and publish your ad with Paththare Ads.
          </p>

          <p className="max-w-2xl text-baseline text-gray-500">
            Reserve your advertisement with us, and our team will professionally
            format it and manage the entire submission process directly with the
            publisher on your behalf.
          </p>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div
                key={i}
                className="group relative rounded-2xl bg-white p-12 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                {/* STEP NUMBER */}
                <div
                  className="absolute -top-6 left-6 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
                  style={{ background: "var(--color-primary-accent)" }}
                >
                  {i + 1}
                </div>

                {/* CONTENT */}
                <div className="pt-2 space-y-4 text-center">
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {step.title}
                  </h3>

                  <p className="text-baseline leading-relaxed text-gray-600">
                    {step.desc}
                  </p>
                </div>

                {/* BOTTOM ACCENT LINE */}
                <div
                  className="absolute bottom-0 left-0 h-1 w-0 rounded-b-2xl transition-all duration-300 group-hover:w-full"
                  style={{ background: "var(--color-orange-accent)" }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-6">
          <Link
            href="/post-ad"
            className="rounded-md bg-primary-dark px-12 py-4 text-white text-xl font-medium transition hover:brightness-110"
          >
            Post Your Ad
          </Link>
        </div>
      </section>

      {/* Advertisement Status Section */}
      <section className="max-w-6xl mx-auto flex flex-col space-y-6 mt-16">
        <header className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-dark">
            Advertisement Status Overview
          </h2>
          <p className="text-gray-700 text-md md:text-lg max-w-2xl mx-auto">
            Track the progress of your ad at every stage. Each status is
            color-coded for quick reference.
          </p>
        </header>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
          {[
            {
              status: "Pending",
              desc: "You have submitted your ad and it is awaiting admin review.",
            },
            {
              status: "Revision",
              desc: "Admin has requested changes to your ad content before approval.",
            },
            {
              status: "Resubmitted",
              desc: "You have updated and resubmitted your ad after revisions.",
            },
            {
              status: "Approved",
              desc: "Your ad has been approved by admin and is ready for your payment.",
            },
            {
              status: "Declined",
              desc: "Admin has declined your ad due to content or formatting issues.",
            },
            {
              status: "UpdateImage",
              desc: "Admin requests you to update the image associated with your ad.",
            },
            {
              status: "PriceChange",
              desc: "Admin has notified you of a price change for your ad placement.",
            },
            {
              status: "PaymentPending",
              desc: "Your ad is awaiting payment confirmation before publishing.",
            },
            {
              status: "Print",
              desc: "Your ad has been approved for print and sent to the newspaper.",
            },
            {
              status: "AdProcessed",
              desc: "Your ad has been approved for print and sent to the newspaper.",
            },
          ].map((item) => (
            <div
              key={item.status}
              className="flex flex-col p-4 bg-gray-50 rounded-lg shadow-md transition hover:shadow-lg"
            >
              <div className="flex justify-center">
                <span
                  className={`inline-block px-4 py-1 rounded-full text-white font-semibold text-sm ${statusColorHandler(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-gray-900 mt-2 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Table for larger screens */}
        <div className="hidden lg:block overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full bg-gray-50 divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                {
                  status: "Pending",
                  desc: "You have submitted your ad and it is awaiting admin review.",
                },
                {
                  status: "Revision",
                  desc: "Admin has requested changes to your ad content before approval.",
                },
                {
                  status: "Resubmitted",
                  desc: "You have updated and resubmitted your ad after revisions.",
                },
                {
                  status: "Approved",
                  desc: "Your ad has been approved by admin and is ready for your payment.",
                },
                {
                  status: "Declined",
                  desc: "Admin has declined your ad due to content or formatting issues.",
                },
                {
                  status: "UpdateImage",
                  desc: "Admin requests you to update the image associated with your ad.",
                },
                {
                  status: "PriceChange",
                  desc: "Admin has notified you of a price change for your ad placement.",
                },
                {
                  status: "PaymentPending",
                  desc: "Your ad is awaiting payment confirmation before publishing.",
                },
                {
                  status: "Print",
                  desc: "a.k.a AdProcessed: Ad is for print and sent to the newspaper.",
                },
              ].map((item) => (
                <tr
                  key={item.status}
                  className="hover:bg-gray-100 transition-colors"
                >
                  {/* Status column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <span
                        className={`inline-block px-4 py-1 rounded-full font-semibold text-sm ${statusColorHandler(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>

                  {/* Description column */}
                  <td className="px-6 py-4 text-gray-900">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
