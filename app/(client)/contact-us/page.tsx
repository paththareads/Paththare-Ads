"use client";

import { useState } from "react";
import { MapPin, Phone, MessageCircle, Mail } from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    reason: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Message sent successfully!");
        setFormData({
          name: "",
          email: "",
          contact: "",
          reason: "",
          message: "",
        });
      } else {
        alert(data.error || "Failed to send message.");
      }
    } catch (err) {
      alert("An error occurred. Try again later.");
      console.error(err);
    }
  };

  return (
    <main className="flex-1 flex flex-col px-6 md:px-12 py-24">
      <section className="w-4/5 mx-auto flex flex-col md:flex-row gap-12">
        {/* Left: Contact Form */}
        <div className="flex-1 bg-gray-50 p-8 rounded-xl shadow-md">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-6 text-center md:text-left">
            Talk to Us
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-primary-accent outline-none py-3 placeholder-transparent transition"
                placeholder="Your Name"
              />
              <label className="absolute left-0 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-1 peer-focus:text-primary-accent peer-focus:text-sm">
                Your Name
              </label>
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-primary-accent outline-none py-3 placeholder-transparent transition"
                placeholder="Your Email"
              />
              <label className="absolute left-0 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-1 peer-focus:text-primary-accent peer-focus:text-sm">
                Your Email
              </label>
            </div>

            <div className="relative">
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="peer w-full border-b-2 border-gray-300 focus:border-primary-accent outline-none py-3 placeholder-transparent transition"
                placeholder="Contact Number"
              />
              <label className="absolute left-0 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-1 peer-focus:text-primary-accent peer-focus:text-sm">
                Contact Number
              </label>
            </div>

            <div className="relative">
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-primary-accent outline-none py-3 placeholder-transparent transition appearance-none pr-8" // add padding-right
              >
                <option value=""></option>
                <option value="general">General Inquiry</option>
                <option value="advert">Advert Placement</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </select>

              <label
                className="absolute left-0 top-3 text-gray-400 text-sm transition-all 
    peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
    peer-focus:-top-1 peer-focus:text-primary-accent peer-focus:text-sm"
              >
                Reason
              </label>

              {/* Custom Down Arrow */}
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 pr-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-primary-accent outline-none py-3 placeholder-transparent transition resize-none"
                placeholder="Your Message"
              />
              <label className="absolute left-0 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-1 peer-focus:text-primary-accent peer-focus:text-sm">
                Your Message
              </label>
            </div>

            <button
              type="submit"
              className="bg-primary-accent hover:bg-primary-dark text-white font-semibold rounded-md px-6 py-3 mt-4 transition"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Right: Contact Info with Icons */}
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-50 p-8 rounded-xl shadow-md flex flex-col space-y-6 max-w-md hover:shadow-lg transition">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-6 text-center md:text-left">
              Contact Information
            </h1>

            <div className="flex flex-col space-y-4">
              {/* Address */}
              <div className="flex items-center gap-3 text-xl">
                <MapPin className="text-primary-accent w-5 h-5" />
                <span className="text-gray-900">
                  467A, Main Street, Panadura
                </span>
              </div>

              {/* Tel */}
              <div className="flex items-center gap-3 text-xl">
                <Phone className="text-primary-accent w-5 h-5" />
                <span className="text-gray-900">038 224 0060</span>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3 text-xl">
                <MessageCircle className="text-primary-accent w-5 h-5" />
                <span className="text-gray-900">076 713 1894</span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 text-xl">
                <Mail className="text-primary-accent w-5 h-5" />
                <span className="text-gray-900">paththareads@gmail.com</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-baseline text-gray-500">
                We are happy to assist you with your ads or inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
