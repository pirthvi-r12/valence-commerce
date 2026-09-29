"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { imageFor } from "@/lib/catalog";
import { validateCoupon, type Coupon } from "@/lib/coupons";
import { detectCurrency, formatMoney, isCurrency, REFERENCE_RATES } from "@/lib/currency";
import { materialize } from "@/lib/materialize";
import { FREE_SHIPPING_CENTS, quote } from "@/lib/pricing";
import { DEMO_ADDRESSES, DEMO_CARDS, DEMO_PASSWORD, DEMO_USER, buildSeedOrders } from "@/lib/seedOrders";
import type {
  AccountRecord,
  Address,
  CartLine,
  CurrencyCode,
  FitAdvice,
  Order,
  OrderStatus,
  Product,
  ProductOverride,
  Review,
  SavedCard,
  ShippingMethod,
  User,
} from "@/lib/types";

const STORAGE_KEY = "valence.commerce.v1";

interface RemovedLine {
  line: CartLine;
  title: string;
}

interface CommerceState {
  cart: CartLine[];
  wishlist: string[];
  currency: CurrencyCode;
  currencyChosen: boolean;
  couponCode: string | null;
  user: User | null;
  accounts: AccountRecord[];
  addresses: Address[];
  payments: SavedCard[];
  orders: Order[];
  reviews: Review[];
  overrides: Record<string, ProductOverride>;
  customProducts: Product[];
  removed: RemovedLine | null;
}

interface CommerceContextValue {
  ready: boolean;
  state: CommerceState;
  catalog: Product[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  fxLive: boolean;
  format: (cents: number) => string;
  cartCount: number;
  wishlistCount: number;
  detailedCart: DetailedLine[];
  subtotalCents: number;
  coupon: Coupon | null;
  shippingGapCents: number;
  cartOpen: boolean;
  searchOpen: boolean;
  pdpDock: boolean;
  notice: string | null;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setPdpDock: (dock: boolean) => void;
  notify: (message: string) => void;
  addToCart: (productId: string, variantId: string, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeLine: (variantId: string) => void;
  undoRemove: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  setCurrency: (currency: CurrencyCode) => void;
  applyCoupon: (code: string) => Promise<string | null>;
  clearCoupon: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  adoptAdmin: () => void;
  signOut: () => Promise<void>;
  placeOrder: (input: PlaceOrderInput) => Promise<Order>;
  addReview: (input: { productId: string; rating: number; comment: string; fit: FitAdvice; name?: string }) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addPayment: (card: Omit<SavedCard, "id">) => void;
  removePayment: (id: string) => void;
  setDefaultPayment: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus, tracking?: { carrier?: string; number?: string }) => void;
  saveProduct: (productId: string, patch: ProductOverride) => void;
  addCustomProduct: (product: Product) => void;
  priceCart: (method: ShippingMethod) => ReturnType<typeof quote>;
  reviewsFor: (productId: string) => Review[];
}

export interface DetailedLine {
  productId: string;
  variantId: string;
  qty: number;
  product: Product;
  unit: number;
  image: string;
  title: string;
  sku: string;
  size: string;
  color: string;
  max: number;
}

interface PlaceOrderInput {
  email: string;
  name: string;
  address: Address;
  method: ShippingMethod;
  paymentLabel: string;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

function initialState(): CommerceState {
  return {
    cart: [],
    wishlist: ["p4", "p7"],
    currency: "USD",
    currencyChosen: false,
    couponCode: null,
    user: null,
    accounts: [],
    addresses: [],
    payments: [],
    orders: buildSeedOrders(),
    reviews: [],
    overrides: {},
    customProducts: [],
    removed: null,
  };
}

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function mergeOrders(seed: Order[], saved: Order[]) {
  const map = new Map(seed.map((order) => [order.id, order]));
  for (const order of saved) map.set(order.id, order);
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergeState(raw: unknown): CommerceState {
  const base = initialState();
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<CommerceState>;
  const currency = typeof saved.currency === "string" && isCurrency(saved.currency) ? saved.currency : base.currency;
  return {
    ...base,
    cart: asArray(saved.cart, []),
    wishlist: asArray(saved.wishlist, base.wishlist),
    currency,
    currencyChosen: Boolean(saved.currencyChosen),
    couponCode: typeof saved.couponCode === "string" ? saved.couponCode : null,
    user: saved.user ?? null,
    accounts: asArray(saved.accounts, []),
    addresses: asArray(saved.addresses, []),
    payments: asArray(saved.payments, []),
    orders: mergeOrders(base.orders, asArray(saved.orders, [])),
    reviews: asArray(saved.reviews, []),
    overrides: saved.overrides && typeof saved.overrides === "object" ? saved.overrides : {},
    customProducts: asArray(saved.customProducts, []),
    removed: null,
  };
}

async function digest(value: string) {
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<CommerceState>(initialState);
  const [ready, setReady] = useState(false);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(REFERENCE_RATES);
  const [fxLive, setFxLive] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pdpDock, setPdpDock] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const stateRef = useRef(state);
  const undoTimer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);
  stateRef.current = state;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setState(mergeState(JSON.parse(raw)));
      } catch {
        setState(initialState());
      }
    } else {
      setState((current) => ({ ...current, currency: detectCurrency() }));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, removed: null }));
  }, [state, ready]);

  useEffect(() => {
    let cancel = false;
    fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,JPY")
      .then((response) => response.json())
      .then((data: { rates?: Partial<Record<CurrencyCode, number>> }) => {
        if (cancel || !data.rates) return;
        setRates({ USD: 1, EUR: data.rates.EUR ?? REFERENCE_RATES.EUR, GBP: data.rates.GBP ?? REFERENCE_RATES.GBP, CAD: data.rates.CAD ?? REFERENCE_RATES.CAD, JPY: data.rates.JPY ?? REFERENCE_RATES.JPY });
        setFxLive(true);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    setCartOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen]);

  const catalog = useMemo(() => materialize(state.overrides, state.customProducts), [state.overrides, state.customProducts]);

  const notify = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  };

  const detailedCart = useMemo<DetailedLine[]>(() => {
    return state.cart.flatMap((line) => {
      const product = catalog.find((item) => item.id === line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      if (!product || !variant) return [];
      return [{
        ...line,
        product,
        unit: product.priceCents + variant.priceOffsetCents,
        image: imageFor(product, variant.color),
        title: product.title,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        max: variant.inventoryCount,
      }];
    });
  }, [catalog, state.cart]);

  const subtotalCents = detailedCart.reduce((sum, line) => sum + line.unit * line.qty, 0);
  const validated = state.couponCode ? validateCoupon(state.couponCode) : null;
  const coupon = validated && validated.ok ? validated.coupon : null;
  const discounted = quote(subtotalCents, "standard", coupon?.discountPercent ?? 0);
  const shippingGapCents = Math.max(0, FREE_SHIPPING_CENTS - discounted.net);

  const addToCart = (productId: string, variantId: string, qty = 1) => {
    const product = catalog.find((item) => item.id === productId);
    const variant = product?.variants.find((item) => item.id === variantId);
    if (!product || !variant) return;
    const inCart = state.cart.find((line) => line.variantId === variantId)?.qty ?? 0;
    const room = variant.inventoryCount - inCart;
    if (room <= 0) {
      notify("That size is gone.");
      return;
    }
    const nextQty = Math.min(qty, room);
    setState((current) => {
      const existing = current.cart.find((line) => line.variantId === variantId);
      const cart = existing
        ? current.cart.map((line) => (line.variantId === variantId ? { ...line, qty: Math.min(variant.inventoryCount, line.qty + nextQty) } : line))
        : [...current.cart, { productId, variantId, qty: nextQty }];
      return { ...current, cart };
    });
    if (nextQty < qty) notify(`Only ${room} left in ${variant.size}.`);
    setCartOpen(true);
  };

  const setQty = (variantId: string, qty: number) => {
    if (qty < 1) {
      removeLine(variantId);
      return;
    }
    const line = detailedCart.find((item) => item.variantId === variantId);
    const max = line?.max ?? qty;
    setState((current) => ({
      ...current,
      cart: current.cart.map((item) => (item.variantId === variantId ? { ...item, qty: Math.min(max, qty) } : item)),
    }));
  };

  const removeLine = (variantId: string) => {
    const line = state.cart.find((item) => item.variantId === variantId);
    if (!line) return;
    const title = catalog.find((product) => product.id === line.productId)?.title ?? "Piece";
    setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item.variantId !== variantId),
      removed: { line, title },
    }));
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setState((current) => ({ ...current, removed: null }));
    }, 5000);
  };

  const undoRemove = () => {
    const removed = stateRef.current.removed;
    if (!removed) return;
    setState((current) => {
      const existing = current.cart.find((line) => line.variantId === removed.line.variantId);
      const cart = existing
        ? current.cart.map((line) => (line.variantId === removed.line.variantId ? { ...line, qty: line.qty + removed.line.qty } : line))
        : [...current.cart, removed.line];
      return { ...current, cart, removed: null };
    });
  };

  const value: CommerceContextValue = {
    ready,
    state,
    catalog,
    currency: state.currency,
    rates,
    fxLive,
    format: (cents) => formatMoney(cents, state.currency, rates),
    cartCount: state.cart.reduce((sum, line) => sum + line.qty, 0),
    wishlistCount: state.wishlist.length,
    detailedCart,
    subtotalCents,
    coupon,
    shippingGapCents,
    cartOpen,
    searchOpen,
    pdpDock,
    notice,
    setCartOpen,
    setSearchOpen,
    setPdpDock,
    notify,
    addToCart,
    setQty,
    removeLine,
    undoRemove,
    toggleWishlist: (productId) => {
      setState((current) => ({
        ...current,
        wishlist: current.wishlist.includes(productId)
          ? current.wishlist.filter((id) => id !== productId)
          : [...current.wishlist, productId],
      }));
    },
    isWishlisted: (productId) => state.wishlist.includes(productId),
    setCurrency: (currency) => setState((current) => ({ ...current, currency, currencyChosen: true })),
    applyCoupon: async (code) => {
      try {
        const response = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = (await response.json()) as { error?: string; coupon?: Coupon };
        if (!response.ok || !data.coupon) return data.error ?? "Code not recognized.";
        setState((current) => ({ ...current, couponCode: data.coupon?.code ?? code.toUpperCase() }));
        return null;
      } catch {
        const local = validateCoupon(code);
        if (!local.ok) return local.error;
        setState((current) => ({ ...current, couponCode: local.coupon.code }));
        return null;
      }
    },
    clearCoupon: () => setState((current) => ({ ...current, couponCode: null })),
    signIn: async (email, password) => {
      const normalized = email.trim().toLowerCase();
      if (normalized === DEMO_USER.email && password === DEMO_PASSWORD) {
        setState((current) => ({
          ...current,
          user: DEMO_USER,
          addresses: current.addresses.length ? current.addresses : DEMO_ADDRESSES,
          payments: current.payments.length ? current.payments : DEMO_CARDS,
        }));
        return null;
      }
      const account = stateRef.current.accounts.find((item) => item.email === normalized);
      if (!account) return "No atelier profile for that email.";
      const hash = await digest(password);
      if (hash !== account.passwordHash) return "Password does not match.";
      setState((current) => ({
        ...current,
        user: { id: account.id, name: account.name, email: account.email, role: "customer" },
      }));
      return null;
    },
    register: async (name, email, password) => {
      const normalized = email.trim().toLowerCase();
      if (!name.trim() || !normalized.includes("@") || password.length < 4) return "Name, email, and a 4+ character password are required.";
      if (normalized === DEMO_USER.email) return "That profile already exists. Sign in instead.";
      const hash = await digest(password);
      const account: AccountRecord = {
        id: `usr_${normalized.replace(/[^a-z0-9]/g, "").slice(0, 16)}`,
        name: name.trim(),
        email: normalized,
        passwordHash: hash,
        role: "customer",
      };
      setState((current) => ({
        ...current,
        accounts: [...current.accounts.filter((item) => item.email !== normalized), account],
        user: { id: account.id, name: account.name, email: account.email, role: "customer" },
      }));
      return null;
    },
    adoptAdmin: () => {
      setState((current) => ({
        ...current,
        user: { id: "usr_admin", name: "Valence Atelier", email: "admin@valence.studio", role: "admin" },
      }));
    },
    signOut: async () => {
      setState((current) => ({ ...current, user: null }));
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    },
    placeOrder: async (input) => {
      const current = stateRef.current;
      const lines = detailedCart;
      const subtotal = lines.reduce((sum, line) => sum + line.unit * line.qty, 0);
      const active = current.couponCode ? validateCoupon(current.couponCode) : null;
      const percent = active && active.ok ? active.coupon.discountPercent : 0;
      const priced = quote(subtotal, input.method, percent);
      const order: Order = {
        id: `ord_${Date.now()}`,
        orderNumber: `VL-${String(Date.now()).slice(-6)}`,
        userId: current.user?.id ?? null,
        customerEmail: input.email.trim().toLowerCase(),
        customerName: input.name.trim(),
        shippingAddress: input.address,
        shippingMethod: input.method,
        subtotalCents: subtotal,
        discountCents: priced.discountCents,
        shippingCents: priced.shippingCents,
        taxCents: priced.taxCents,
        totalCents: priced.totalCents,
        coupon: active && active.ok ? active.coupon.code : null,
        currency: current.currency,
        fxRate: rates[current.currency] ?? 1,
        status: "Pending",
        returned: false,
        trackingCarrier: null,
        trackingNumber: null,
        createdAt: new Date().toISOString(),
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          title: line.title,
          sku: line.sku,
          size: line.size,
          color: line.color,
          priceCents: line.unit,
          quantity: line.qty,
          image: line.image,
        })),
      };
      setState((prev) => {
        const overrides = { ...prev.overrides };
        const customProducts = prev.customProducts.map((product) => ({
          ...product,
          variants: product.variants.map((variant) => ({ ...variant })),
        }));
        for (const item of order.items) {
          const product = materialize(overrides, customProducts).find((entry) => entry.id === item.productId);
          const variant = product?.variants.find((entry) => entry.id === item.variantId);
          if (!product || !variant) continue;
          const next = Math.max(0, variant.inventoryCount - item.quantity);
          if (product.id.startsWith("custom-")) {
            const index = customProducts.findIndex((entry) => entry.id === product.id);
            if (index >= 0) {
              customProducts[index] = {
                ...customProducts[index],
                variants: customProducts[index].variants.map((entry) => (entry.id === variant.id ? { ...entry, inventoryCount: next } : entry)),
              };
            }
          } else {
            overrides[product.id] = {
              ...overrides[product.id],
              inventory: { ...overrides[product.id]?.inventory, [variant.id]: next },
            };
          }
        }
        return { ...prev, orders: [order, ...prev.orders], cart: [], couponCode: null, overrides, customProducts };
      });
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      }).catch(() => undefined);
      return order;
    },
    addReview: (input) => {
      const current = stateRef.current;
      const verified = current.orders.some(
        (order) =>
          order.customerEmail === current.user?.email &&
          order.status !== "Pending" &&
          order.items.some((item) => item.productId === input.productId),
      );
      const review: Review = {
        id: `rv-${Date.now()}`,
        productId: input.productId,
        userName: input.name?.trim() || current.user?.name || "Guest",
        rating: input.rating,
        comment: input.comment.trim(),
        fit: input.fit,
        verifiedPurchase: verified,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, reviews: [review, ...prev.reviews] }));
      fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review }),
      }).catch(() => undefined);
    },
    addAddress: (address) => {
      setState((current) => {
        const next: Address = { ...address, id: `addr_${Date.now()}`, isDefault: address.isDefault || current.addresses.length === 0 };
        const addresses = next.isDefault
          ? [...current.addresses.map((item) => ({ ...item, isDefault: false })), next]
          : [...current.addresses, next];
        return { ...current, addresses };
      });
    },
    removeAddress: (id) => setState((current) => ({ ...current, addresses: current.addresses.filter((item) => item.id !== id) })),
    setDefaultAddress: (id) =>
      setState((current) => ({
        ...current,
        addresses: current.addresses.map((item) => ({ ...item, isDefault: item.id === id })),
      })),
    addPayment: (card) => {
      setState((current) => {
        const next: SavedCard = { ...card, id: `card_${Date.now()}`, isDefault: card.isDefault || current.payments.length === 0 };
        const payments = next.isDefault
          ? [...current.payments.map((item) => ({ ...item, isDefault: false })), next]
          : [...current.payments, next];
        return { ...current, payments };
      });
    },
    removePayment: (id) => setState((current) => ({ ...current, payments: current.payments.filter((item) => item.id !== id) })),
    setDefaultPayment: (id) =>
      setState((current) => ({
        ...current,
        payments: current.payments.map((item) => ({ ...item, isDefault: item.id === id })),
      })),
    updateOrderStatus: (id, status, tracking) => {
      setState((current) => ({
        ...current,
        orders: current.orders.map((order) =>
          order.id === id
            ? {
                ...order,
                status,
                trackingCarrier: tracking?.carrier ?? order.trackingCarrier,
                trackingNumber: tracking?.number ?? order.trackingNumber,
              }
            : order,
        ),
      }));
      fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, trackingCarrier: tracking?.carrier, trackingNumber: tracking?.number }),
      }).catch(() => undefined);
    },
    saveProduct: (productId, patch) => {
      setState((current) => {
        if (productId.startsWith("custom-")) {
          return {
            ...current,
            customProducts: current.customProducts.map((product) => {
              if (product.id !== productId) return product;
              return {
                ...product,
                title: patch.title ?? product.title,
                priceCents: patch.priceCents ?? product.priceCents,
                compareAtCents: patch.compareAtCents === undefined ? product.compareAtCents : patch.compareAtCents,
                hidden: patch.hidden ?? product.hidden,
                variants: product.variants.map((variant) => ({
                  ...variant,
                  inventoryCount: patch.inventory?.[variant.id] ?? variant.inventoryCount,
                })),
              };
            }),
          };
        }
        const previous = current.overrides[productId] ?? {};
        return {
          ...current,
          overrides: {
            ...current.overrides,
            [productId]: {
              ...previous,
              ...patch,
              inventory: { ...previous.inventory, ...patch.inventory },
            },
          },
        };
      });
      fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, patch }),
      }).catch(() => undefined);
    },
    addCustomProduct: (product) => setState((current) => ({ ...current, customProducts: [product, ...current.customProducts] })),
    priceCart: (method) => quote(subtotalCents, method, coupon?.discountPercent ?? 0),
    reviewsFor: (productId) => {
      const product = catalog.find((item) => item.id === productId);
      return [...(product?.reviews ?? []), ...state.reviews.filter((review) => review.productId === productId)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
  };

  return (
    <CommerceContext.Provider value={value}>
      {children}
      {notice ? (
        <div className="fixed left-1/2 top-24 z-[80] -translate-x-1/2 border border-lime/40 bg-obsidian px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
          {notice}
        </div>
      ) : null}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used within CommerceProvider");
  return context;
}
