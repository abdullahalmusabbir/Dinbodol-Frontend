import LostFoundDetailsSection from "@/components/forum/ForumSection";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ForumDetailsPage({
    params,
}: PageProps) {
    const { id } = await params;
    return <LostFoundDetailsSection id={Number(id)} />;
}