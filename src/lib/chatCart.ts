import { productCorrections } from "./productCorrections.ts";

export type ChatProduct = {
  id: string;
  name: string;
  price: string;
  icon: string;
  image: string;
};

export type ChatCartItem = Omit<ChatProduct, "id"> & { quantity: number };

export function normalizeChatCatalog(payload: unknown): ChatProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object") return normalizeChatCatalog(record.data);
  const entries = Array.isArray(record.products) ? record.products : Object.values(record);
  const products = new Map<string, ChatProduct>();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 100) continue;
    const name = item.name.trim();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!id || ["scoprio", "feed-box"].includes(id)) continue;
    if (typeof item.price !== "string" || !/^\$\d+(?:\.\d{1,2})?$/.test(item.price) || Number(item.price.slice(1)) <= 0) continue;
    products.set(id, {
      id, name, price: item.price,
      icon: typeof item.icon === "string" ? item.icon.slice(0, 16) : "",
      image: productCorrections[id]?.image ?? (typeof item.image === "string" && item.image.startsWith("/assets/")
        ? item.image : "/assets/healthfood/product-01.jpg"),
    });
  }
  return [...products.values()].slice(0, 100);
}

export function resolveCartRequest(value: unknown, catalog: ChatProduct[]): ChatCartItem[] {
  if (!value || typeof value !== "object") throw new Error("Invalid cart action.");
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 10) throw new Error("Choose between 1 and 10 products at a time.");
  const resolved = new Map<string, ChatCartItem>();
  for (const item of items) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error("Choose a whole quantity between 1 and 99.");
    }
    const product = catalog.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error("That product is not available in the chat catalog.");
    const quantity = (resolved.get(product.id)?.quantity ?? 0) + item.quantity;
    if (quantity > 99) throw new Error("The maximum quantity per product is 99.");
    const { name, price, icon, image } = product;
    resolved.set(product.id, { name, price, icon, image, quantity });
  }
  return [...resolved.values()];
}

export function mergeChatCart(stored: string | null, additions: ChatCartItem[]): ChatCartItem[] {
  const existing: unknown = stored === null ? [] : JSON.parse(stored);
  if (!Array.isArray(existing) || existing.some((item) => !item || typeof item.name !== "string" ||
    typeof item.price !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    throw new Error("Your saved cart could not be read. Please review it before adding items.");
  }
  const next: ChatCartItem[] = existing.map((item) => ({ ...item }));
  for (const addition of additions) {
    const index = next.findIndex((item) => item.name === addition.name);
    const quantity = (index >= 0 ? next[index].quantity : 0) + addition.quantity;
    if (quantity > 99) throw new Error(`Adding ${addition.name} would exceed 99 units. Your cart was not changed.`);
    if (index >= 0) next[index] = { ...next[index], ...addition, quantity };
    else next.push({ ...addition });
  }
  if (next.length > 50) throw new Error("Your cart can hold up to 50 different products. Your cart was not changed.");
  return next;
}

export function saveChatCartAction(storage: Pick<Storage, "getItem" | "setItem">, action: unknown): string {
  if (!action || typeof action !== "object" || (action as { type?: unknown }).type !== "add") {
    throw new Error("Unsupported cart action. Your cart was not changed.");
  }
  const items = (action as { items?: unknown }).items;
  if (!Array.isArray(items) || items.some((item) => !item || typeof item.name !== "string")) {
    throw new Error("Invalid cart action. Your cart was not changed.");
  }
  const catalog = normalizeChatCatalog({ products: items });
  const additions = resolveCartRequest({ items: items.map((item) => ({
    productId: catalog.find((product) => product.name === item.name)?.id,
    quantity: item.quantity,
  })) }, catalog);
  const nextCart = mergeChatCart(storage.getItem("healthfood4u_cart"), additions);
  storage.setItem("healthfood4u_cart", JSON.stringify(nextCart));
  return `Added ${additions.map((item) => `${item.quantity} x ${item.name}`).join(", ")} to your cart.`;
}