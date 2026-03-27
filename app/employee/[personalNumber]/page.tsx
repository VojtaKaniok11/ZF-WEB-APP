import ClientPage from './ClientPage';

export const dynamicParams = false;

export function generateStaticParams() {
    return [{ personalNumber: '0' }];
}

export default function Page({ params }: { params: Promise<{ personalNumber: string }> }) {
    return <ClientPage params={params} />;
}
