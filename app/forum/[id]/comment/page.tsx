import LostFoundDetailsSection from "@/components/forum/comment/CommentSection";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CommentDetailsPage({
    params,
}: PageProps) {
    const { id } = await params;
    return <LostFoundDetailsSection id={Number(id)} />;
}