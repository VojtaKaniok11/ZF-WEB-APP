import TrainingsClientV2 from "@/components/TrainingsClientV2";

export const metadata = {
    title: "Katalog Školení | V2",
};

export default function TrainingsV2Page() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#FCFCFD] text-[#0A0A0B] selection:bg-black selection:text-white pb-24 font-sans">
            <TrainingsClientV2 />
        </div>
    );
}
