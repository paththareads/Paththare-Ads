"use client";

import ModalBase from "./ModalBase";
import Image from "next/image";

interface NewspaperModal1Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NP1LankadeepaModal({
  isOpen,
  onClose,
}: NewspaperModal1Props) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-[#111d4a]">
        {/* Main heading */}
        <h2 className="text-3xl font-bold text-center text-[#008dd5] mb-6">
          Lankadeepa
        </h2>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ===== Column 1 ===== */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">
              Classified Ads
            </h3>
            <h4 className="text-lg font-semibold mt-4">General Classified</h4>
            <div className="flex justify-center">
              <Image
                src="/classified-ad-sample.png"
                alt="Classified Ads"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>

            {/* General Classified */}
            <div>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>First 15 words Rs. 300/=</li>
                <li>Additional word Rs. 15/=</li>
                <li>Background color (Tint) Rs. 250/=</li>
                <li>Maximum 65 words</li>
              </ul>
              {/* <div className="flex justify-center">
                <button className="mt-3 bg-[#008dd5] text-white px-5 py-2 rounded-md hover:brightness-110 transition">
                  Select
                </button>
              </div> */}
            </div>

            {/* Death Notice */}
            <div>
              <h4 className="text-lg font-semibold mt-6">Death Notice</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>First 15 words Rs. 120/=</li>
                <li>Additional word Rs. 10/=</li>
              </ul>
              <p className="text-xs text-gray-500 mt-1">
                (You may need to upload a copy of the death certificate)
              </p>
              {/* <div className="flex justify-center">
                <button className="mt-3 bg-[#008dd5] text-white px-5 py-2 rounded-md hover:brightness-110 transition">
                  Select
                </button>
              </div> */}
            </div>

            {/* Footnote */}
            <p className="text-xs text-gray-500 italic mt-4">
              Government tax included for all classified ads.
            </p>
          </div>

          {/* ===== Column 2 ===== */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">Casual Ads</h3>

            <div className="flex justify-center">
              <Image
                src="/casual-ad-sample.png"
                alt="Casual Ads"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>

            <div className="text-sm text-gray-700">
              <p className="mb-2">Width measured in columns</p>
              <p className="mb-4">1 column = 3.8 cm</p>

              {/* Table */}
              <table className="w-full text-sm border border-gray-300 mb-3">
                <thead className="bg-[#008dd5] text-white">
                  <tr>
                    <th className="py-2 px-3 text-left">Mechanical Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  <tr>
                    <td className="py-2 px-3">No of columns per page</td>
                    <td className="py-2 px-3 text-right">8</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Column Width</td>
                    <td className="py-2 px-3 text-right">3.8 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Column Height</td>
                    <td className="py-2 px-3 text-right">52 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Full Page (Column × cm)</td>
                    <td className="py-2 px-3 text-right">416</td>
                  </tr>
                </tbody>
              </table>

              {/* <div className="flex justify-center">
                <button className="mt-3 bg-[#008dd5] text-white px-5 py-2 rounded-md hover:brightness-110 transition">
                  Select
                </button>
              </div> */}

              <ul className="list-disc list-inside text-sm text-gray-700 mt-4 space-y-1">
                <li>Minimum height should be 3 cm.</li>
                <li>
                  Ads more than 1/3 black background incur an additional 25%
                  charge.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
