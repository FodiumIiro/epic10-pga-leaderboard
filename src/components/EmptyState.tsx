interface Props {
  message?: string;
}

export function EmptyState({ message }: Props) {
  return (
    <div className="px-4 py-8 text-center text-sm text-zinc-400">
      {message ?? "Kierros ei ole alkanut."}
    </div>
  );
}
