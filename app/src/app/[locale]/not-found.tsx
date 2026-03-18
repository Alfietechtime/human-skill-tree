import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
