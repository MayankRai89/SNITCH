import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e2e1] flex flex-col items-center justify-center p-6 text-center font-sans">
      <p className="text-xs font-bold uppercase tracking-widest text-[#f5c518] mb-3">
        Error 404
      </p>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-4">
        LOST IN THE STREETS.
      </h1>
      <p className="text-sm text-[#9a9078] max-w-md mb-8">
        The page or drop you're looking for doesn't exist, has been removed, or has moved to a new drop zone.
      </p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="px-8 py-3.5 bg-[#f5c518] text-[#111] font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
        >
          Return to Marketplace
        </Link>
      </div>
    </div>
  );
}
