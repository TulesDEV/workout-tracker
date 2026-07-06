export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{message}</p>
  );
}
