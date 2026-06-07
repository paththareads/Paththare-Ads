"use client";

import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";

interface StepAdvertiserDetailsProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmitForReview?: () => void; //
}

export default function StepAdvertiserDetails({
  formData,
  updateFormData,
  onSubmitForReview,
}: StepAdvertiserDetailsProps) {
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [countryDialCode, setCountryDialCode] = useState(
    formData.countryCode || "+94",
  );
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  const phoneLengths: Record<string, number> = {
    "+94": 9, // Sri Lanka
    "+1": 10, // USA
    "+44": 10, // UK
    "+61": 9, // Australia
    "+65": 8, // Singapore
    "+81": 10, // Japan
    "+91": 10, // India
    "+971": 9, // UAE
  };

  const handlePhoneChange = (value: string, country: any) => {
    const dialCode = "+" + country.dialCode;
    setCountryDialCode(dialCode);
    handleChange("countryCode", dialCode);
    handleChange("advertiserPhone", value);

    const expectedLength = phoneLengths[dialCode] || 9;
    const digitsOnly = value.replace(/\D/g, "").replace(country.dialCode, "");

    setIsPhoneValid(digitsOnly.length === expectedLength);
  };

  const handleSubmit = (e: React.FormEvent) => {
    onSubmitForReview?.();
  };

  return (
    <>
      <div className="bg-primary text-white px-6 py-3 mb-8 rounded-lg shadow-md text-center">
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Advertiser Details
          <br />
          <span
            className="text-sm md:text-sm font-bold text-center"
            style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
          >
            දැන්වීම්කරුගේ විස්තර
          </span>
        </h2>

        <div className="flex flex-col gap-6 md:w-2/3 mx-auto">
          {/* Name */}
          <div>
            <label className="block mb-2 font-medium">
              Name{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම්කරුගේ නම) *
              </span>
            </label>
            <input
              type="text"
              value={formData.advertiserName || ""}
              onChange={(e) => handleChange("advertiserName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block mb-2 font-medium">
              Address{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම්කරුගේ ලිපිනය) *
              </span>
            </label>
            <input
              type="text"
              value={formData.advertiserAddress || ""}
              onChange={(e) =>
                handleChange("advertiserAddress", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
              placeholder="Your permanent address"
            />
          </div>

          {/* Postal Address */}
          {/* <div>
            <label className="block mb-2 font-medium">
              Postal Address (If same, keep blank)
            </label>
            <input
              type="text"
              value={formData.advertiserPostalAddress || ""}
              onChange={(e) =>
                handleChange("advertiserPostalAddress", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
              placeholder="Postal address (optional)"
            />
          </div> */}

          {/* Phone */}
          <div>
            <label className="block mb-2 font-medium">
              Phone No.{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම්කරුගේ දුරකතන අංකය) *
              </span>
            </label>
            <PhoneInput
              country={"lk"}
              value={formData.advertiserPhone || ""}
              onChange={handlePhoneChange}
              inputClass={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary-accent ${
                isPhoneValid ? "border-gray-300" : "border-red-500"
              }`}
              buttonStyle={{
                border: "none",
                backgroundColor: "transparent",
              }}
              dropdownClass="rounded-lg"
              inputProps={{
                name: "phone",
                required: true,
              }}
            />
            {!isPhoneValid ? (
              <p className="text-sm text-red-500 mt-1">
                Please enter a valid {countryDialCode} phone number.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Example: {countryDialCode} 712 345 678
              </p>
            )}
          </div>

          {/* NIC */}
          <div>
            <label className="block mb-2 font-medium">
              NIC{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම්කරුගේ ජාතික හැඳුනුම්පත් අංකය) *
              </span>
            </label>
            <input
              type="text"
              maxLength={12}
              value={formData.advertiserNIC || ""}
              onChange={(e) => handleChange("advertiserNIC", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
              placeholder="National ID number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 font-medium">
              Email Address{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම්කරුගේ ඊමේල් ලිපිනය)
              </span>
              {" (Optional)"}
            </label>
            <input
              type="email"
              value={formData.advertiserEmail || ""}
              onChange={(e) => handleChange("advertiserEmail", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
              placeholder="example@email.com"
            />
          </div>
          {/* <div>
            <label className="block mb-2 font-medium">Email Address *</label>
            <input
              type="email"
              value={formData.advertiserEmail || "pushpitha.info@gmail.com"}
              readOnly
              className="w-full border border-gray-300 rounded-lg p-3 
               focus:ring-2 focus:ring-primary-accent bg-gray-100 cursor-not-allowed"
            />
          </div> */}

          <div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  updateFormData({ tmagree: e.target.checked });
                  setAgreed(e.target.checked);
                }}
                required
                className="mt-1 accent-[var(--color-primary)]"
              />

              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[var(--color-primary)] underline hover:text-[var(--color-primary-dark)]"
                >
                  Terms and Conditions
                </button>
              </span>
            </label>
          </div>

          {/* ✅ Submit Button
        <div className="text-center mt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-primary-accent text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Submit for Review
          </button>
        </div> */}
        </div>
      </form>
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg md:max-w-2xl lg:max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-[var(--color-primary-dark)] animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-3 right-3 p-1 px-3 rounded text-gray-200 bg-gray-400 hover:text-black transition-colors"
            >
              X
            </button>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-center">
                Terms and Conditions
              </h2>
              <h4 className="text-xl font-semibold">Introduction</h4>
              <p>
                S.L. Media Link (Pvt) Ltd (herein after referred to as ML)
                including its subsidiaries and affiliates provides you, its
                services via their “paththareads.lk” website (herein after
                referred to as "Website") under the following conditions.
              </p>
              <p>
                Please read the following terms carefully. If you do not agree
                to the following Terms & Conditions, you may not enter or use
                this Website. If you continue to browse and use this Website you
                are agreeing to comply with and be bound by the following terms
                and conditions of use, which together with our privacy policy
                governs ML and its use by you in relation to this Website.
              </p>
              <h4 className="text-xl font-semibold">
                Information on the website
              </h4>
              <p>
                While every effort is made to update the information contained
                on this Website, neither ML nor any third party or data or
                content provider make any representations or warranties, whether
                express, implied in law or residual, as to the sequence,
                accuracy, completeness or reliability of information, opinions,
                any pricing information, data and/or content contained on the
                Website and shall not be bound in any manner by any information
                contained on the Website. ML reserves the right at any time to
                change or discontinue without notice, any aspect or feature of
                this Website. No information shall be construed as advice and
                information is offered for information purposes only and is not
                intended for trading purposes. You and your company rely on the
                information contained on this Website at your own risk. If you
                find an error or omission at this site, please let us know.
              </p>
              <h4 className="text-xl font-semibold">
                Public Forums and User Submissions
              </h4>
              <p>
                ML is not responsible for any material submitted to the public
                areas by you (which include Classifieds Ads, bulletin boards,
                hosted pages, chat rooms, or any other public area found on the
                Website. Any material (whether submitted by you or any other
                user) is not endorsed, reviewed or approved by ML. ML reserves
                the right to remove any material submitted or posted by you in
                the public areas, without notice to you, if it becomes aware and
                determines, in its sole and absolute discretion that you are or
                there is the likelihood that you may, including but not limited
                to
              </p>
              <ul className="list-disc list-inside space-y-3">
                <li className="pl-6 -indent-6">
                  defame, abuse, harass, stalk, threaten or otherwise violate
                  the rights of other users or any third parties;
                </li>

                <li className="pl-6 -indent-6">
                  publish, post, distribute or disseminate any defamatory,
                  obscene, indecent or unlawful material or information;
                </li>

                <li className="pl-6 -indent-6">
                  post or upload files that contain viruses, corrupted files or
                  any other similar software or programs that may damage the
                  operation of ML and/or a third party computer system and/or
                  network;
                </li>

                <li className="pl-6 -indent-6">
                  violate any copyright, trade mark, other applicable laws in
                  Sri Lanka or international or intellectual property rights of
                  ML or any other third party;
                </li>

                <li className="pl-6 -indent-6">
                  submit content containing marketing or promotional material
                  which is intended to solicit business.
                </li>
              </ul>

              <h4 className="text-xl font-semibold">Membership</h4>
              <p>
                ML Website is not available to users under the age of 18,
                outside the demographic target, or to any members previously
                banned by ML.
              </p>
              <p>
                By using the ML Website, you acknowledge that you are of legal
                age to form a binding contract and are not a person barred from
                receiving services under the laws of Sri Lanka or other
                applicable jurisdiction. You agree to provide true and accurate
                information about yourself when requested by the ML Website. If
                you provide any information that is untrue, inaccurate, or
                incomplete, ML has the right to suspend or terminate your ad and
                refuse future use of its services
              </p>
              <h4 className="text-xl font-semibold">
                Cancellation Due To Errors
              </h4>
              <p>
                ML has the right to cancel an order at any time due to
                unacceptable content or typographical error in content or
                unforeseen errors that results in the product(s) on the site
                being listed inaccurately (having the wrong price or
                descriptions etc.). In the event a cancellation occurs and
                payment for the order has been received, ML shall issue a full
                refund for the product / service in the amount in question.
                Additionally, you can cancel your order during the processing
                phase. Once your order is complete and your receipt has been
                delivered and paid for, you can no longer cancel the order.
              </p>
              <h4 className="text-xl font-semibold">Specific Use</h4>
              <p>
                You further agree not to use the Website to send or post any
                message or material that is unlawful, harassing, defamatory,
                abusive, indecent, threatening, harmful, vulgar, obscene,
                sexually orientated, racially offensive, profane, pornographic
                or violates any applicable law and you hereby indemnify ML
                against any loss, liability, damage or expense of whatever
                nature which ML or any third party may suffer which is caused by
                or attributable to, whether directly or indirectly, your use of
                the Website to send or post any such message or material.
              </p>
              <h4 className="text-xl font-semibold">Warranties</h4>
              <p>
                ML makes no warranties, representations, statements or
                guarantees (whether express, implied in law or residual)
                regarding the Website, the information contained on the Website,
                you or your personal information or material and information
                transmitted over our system.
              </p>
              <h4 className="text-xl font-semibold">Disclaimer of Liability</h4>
              <p>
                ML shall not be responsible for and disclaims all liability for
                any loss, liability, damage (whether direct, indirect or
                consequential), personal injury or expense of any nature
                whatsoever which may be suffered by you or any third party
                (including your company).
              </p>
              <h4 className="text-xl font-semibold">Indemnity</h4>
              <p>
                User agrees to indemnify and not hold ML (and its employees,
                directors, suppliers, subsidiaries, joint ventures, and legal
                partners) from any claim or demand. Including reasonable
                attorneys' fees, from and against all losses, expenses, damages
                and costs resulting from any violation of these terms and
                conditions or any activity related to Classified Ad Material and
                information to negligence or wrongful conduct.
              </p>
              <h4 className="text-xl font-semibold">Use of the Website</h4>
              <p>
                ML does not make any warranty or representation that information
                on the Website is appropriate for use in any jurisdiction
                (Democratic Socialist Republic of Sri Lanka). By accessing the
                Website, you warrant and represent to ML that you are legally
                entitled to do so and to make use of information made available
                via the Website.
              </p>
              <h4 className="text-xl font-semibold">General</h4>
              <p>
                <ul className="list-disc list-inside space-y-3">
                  <li className="pl-6 -indent-6">
                    Entire Agreement: These Website terms and conditions
                    constitute the sole record of the agreement between you and
                    ML in relation to your use of the Website. Neither you nor
                    ML shall be bound by any expressed or implied
                    representation, warranty, or promise not recorded herein.
                    Unless otherwise specifically stated, these Website terms
                    and conditions supersede and replace all prior commitments,
                    undertakings or representations, whether written or oral,
                    between you and ML in respect of your use of the Website.
                  </li>
                  <li className="pl-6 -indent-6">
                    Alteration: ML may at any time modify any relevant terms and
                    conditions, policies or notices. You acknowledge that by
                    visiting the Website from time to time, you shall become
                    bound to the current version of the relevant terms and
                    conditions (the "current version") and, unless stated in the
                    current version, all previous versions shall be superseded
                    by the current version. You shall be responsible for
                    reviewing the current version each time you visit the
                    Website.
                  </li>
                  <li className="pl-6 -indent-6">
                    Conflict: Where any conflict or contradiction appears
                    between the provisions of these Website terms and conditions
                    and any other relevant terms and conditions, policies or
                    notices, the other relevant terms and conditions, policies
                    or notices which relate specifically to a particular section
                    or module of the Website shall prevail in respect of your
                    use of the relevant section or module of the Website.
                  </li>
                  <li className="pl-6 -indent-6">
                    Waiver: No indulgence or extension of time which either you
                    or ML may grant to the other will constitute a waiver of or,
                    whether by law or otherwise, limit any of the existing or
                    future rights of the grantor in terms hereof, save in the
                    event or to the extent that the grantor has signed a written
                    document expressly waiving or limiting such rights.
                  </li>
                  <li className="pl-6 -indent-6">
                    Cession: ML shall be entitled to cede, assign and delegate
                    all or any of its rights and obligations in terms of any
                    relevant terms and conditions, policies and notices to any
                    third party
                  </li>
                  <li className="pl-6 -indent-6">
                    Severability: All provisions of any relevant terms and
                    conditions, policies and notices are, notwithstanding the
                    manner in which they have been grouped together or linked
                    grammatically, severable from each other. Any provision of
                    any relevant terms and conditions, policies and notices,
                    which is or becomes unenforceable in any jurisdiction,
                    whether due to void, invalidity, illegality, unlawfulness or
                    for any reason whatever, shall, in such jurisdiction only
                    and only to the extent that it is so unenforceable, be
                    treated as pro non-script and the remaining provisions of
                    any relevant terms and conditions, policies and notices
                    shall remain in full force and effect.
                  </li>
                  <li className="pl-6 -indent-6">
                    Applicable laws: Any relevant terms and conditions, policies
                    and notices shall be governed by and construed in accordance
                    with the laws of Sri Lanka without giving effect to any
                    principles of conflict of law. You hereby consent to the
                    exclusive jurisdiction of the Court of law of the Democratic
                    Socialist Republic of Sri Lanka in respect of any disputes
                    arising in connection with the Website, or any relevant
                    terms and conditions, policies and notices or any matter
                    related to or in connection therewith.
                  </li>
                  <li className="pl-6 -indent-6">
                    Comments or Questions: If you have any questions, comments
                    or concerns arising from the Website, the privacy policy or
                    any other relevant terms and conditions, policies and
                    notices or the way in which we are handling your personal
                    information please contact us
                  </li>
                </ul>
              </p>
              <h4 className="text-xl font-semibold">Termination</h4>
              <p>
                These terms and conditions are applicable to you upon your
                accessing the ML Website and/or booking and posting an Ad
                online. These terms and conditions, or any of them, may be
                modified or terminated by ML without notice at any time for any
                reason. The provisions relating to Copyrights and Trademarks,
                Disclaimer, Claims, Limitation of Liability, Indemnification,
                Applicable Laws, Arbitration and General, shall survive any
                termination.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
