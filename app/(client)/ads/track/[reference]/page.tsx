// app/ads/track/[reference]/page.tsx
import TrackAdClient from "@/app/(client)/components/TrackAdClient";

interface Props {
  params: Promise<{ reference: string }>;
}

export default async function Page({ params }: Props) {
  const { reference } = await params;
  return <TrackAdClient reference={reference} />;
}
