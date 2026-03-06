import TrainingsClientV2 from "@/components/TrainingsClientV2";

export const metadata = {
    title: "Katalog Školení | ZF HR Portal",
    description: "Katalog školení a záznamy o absolvování.",
};

export default function TrainingsPage() {
    return (
        <>
            <TrainingsClientV2 />
        </>
    );
}
