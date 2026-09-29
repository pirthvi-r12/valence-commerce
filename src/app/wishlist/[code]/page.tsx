import { WishlistView } from "@/components/wishlist/WishlistView";
import { decodeShare } from "@/lib/share";

export const metadata = { title: "Shared wardrobe" };

export default function SharedWishlistPage({ params }: { params: { code: string } }) {
  return <WishlistView sharedIds={decodeShare(params.code)} />;
}
