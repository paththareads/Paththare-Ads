export function buildAdSubmitSMS({
  referenceNumber,
  trackingLink,
  to,
  status,
}: {
  referenceNumber: string;
  trackingLink: string;
  to: string;
  status: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // const fullTrackingLink = trackingLink ? `${baseUrl}${trackingLink}` : baseUrl;
  const fullTrackingLink = trackingLink;

  console.log("building : ", status);

  if (to === "user") {
    if (status === "pending") {
      return `Your Ad Submitted Successfully. Wait for admin to review it. Ref Number: ${referenceNumber}
Track: ${fullTrackingLink}`;
    }

    if (status === "resubmit") {
      return `Your Ad ${referenceNumber} has been reviewed and requested to change some content. Please review them`;
    }

    if (
      status === "Approve" ||
      status === "Approved" ||
      status === "approve" ||
      status === "approved"
    ) {
      return `Your Ad ${referenceNumber} has been approved. Pay here ${fullTrackingLink}`;
    }

    if (status === "priceChange") {
      return `Your ad ${referenceNumber} has a price update. Review and confirm: ${fullTrackingLink}`;
    }

    if (status === "UpdateImage") {
      return `Your ad ${referenceNumber} requires an image update. Please upload a new image: ${fullTrackingLink}`;
    }

    if (status === "Declined") {
      return `Your ad ${referenceNumber} was declined. Check details: ${fullTrackingLink} Contact Us: www.paththareads.lk/contact-us`;
    }
  }

  if (to === "admin") {
    if (status === "pending") {
      return `New Advertisement! Ref: ${referenceNumber}; Log in to PaththareAds Admin Dashboard to review it.`;
    }

    if (status === "paymentPending") {
      return `Payment pending for Ref ${referenceNumber}. Awaiting confirmation.`;
    }

    if (status === "PaymentDone") {
      return `Payment received for Ref ${referenceNumber}. Ready for processing.`;
    }

    if (status === "Resubmit") {
      return `Ad resubmitted. Ref: ${referenceNumber}. Please review.`;
    }

    if (status === "Cancelled") {
      return `Ad Cancelled by the advertiser Ref: ${referenceNumber}`;
    }
  }
}
