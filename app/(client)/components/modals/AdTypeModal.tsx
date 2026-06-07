"use client";

interface AdTypeModalProps {
  adType: string;
  onClose: () => void;
}

export default function AdTypeModal({ adType, onClose }: AdTypeModalProps) {
  const adTypeInfo: Record<string, { title: string; details: string[] }> = {
    classified: {
      title: "Classified Advertisement Details",
      details: [
        "• Text-only advertisement (up to 65 words).",
        "• Appears in the classifieds section.",
        "• Ideal for announcements, notices, or job postings.",
        "• Base price: Rs. 500 for first 20 words + Rs. 25 per additional word.",
      ],
    },
    photo_classified: {
      title: "Photo Classified Advertisement Details",
      details: [
        "• Includes one photo (JPEG/PNG up to 5MB).",
        "• Appears in premium classifieds section.",
        "• Price varies based on color and size.",
        "• Recommended for personal or small business promotions.",
      ],
    },
    casual: {
      title: "Casual Advertisement Details",
      details: [
        "• Full-color display advertisement.",
        "• Custom dimensions (minimum 5x5 cm).",
        "• Price: Rs. 200 per cm².",
        "• Suitable for company ads, promotions, and offers.",
      ],
    },
  };

  const content = adTypeInfo[adType] || { title: "", details: [] };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
        <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {content.details.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-3 py-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
