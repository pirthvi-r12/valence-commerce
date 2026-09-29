import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-5xl tracking-[-0.05em] md:text-7xl">This piece left the floor.</h1>
      <Link href="/shop" className="btn-lime mt-8 w-fit">
        Return to shop
      </Link>
    </div>
  );
}
