import MainLayout from '@/components/MainLayout';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
