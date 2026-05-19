type Props = {
  version: string;
};

export default function VersionLabel({ version }: Props) {
  return (
    <div className="fixed bottom-3 right-4 text-xs text-slate-400">
      {version}
    </div>
  );
}