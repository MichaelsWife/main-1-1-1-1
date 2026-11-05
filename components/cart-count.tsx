"use client";
import { useCart } from "@/components/cart-provider";
export default function CartCountClient() { const { items } = useCart(); return <>{items.reduce((sum, item) => sum + item.quantity, 0)}</>; }
