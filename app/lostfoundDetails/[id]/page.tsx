import LostFoundDetailsSection from "@/components/lostfoundDetails/lostfoundDetailsSection";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function LostFoundDetailsPage({
    params,
}: PageProps) {
    const { id } = await params;

    return <LostFoundDetailsSection id={Number(id)} />;
}