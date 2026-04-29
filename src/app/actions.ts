"use server";

import { revalidatePath } from "next/cache";
import { addItemToCart, clearCart, decreaseItemQuantity } from "@/lib/db";

export async function addToCartAction(formData: FormData) {
  const medicineId = Number(formData.get("medicineId"));
  if (!Number.isInteger(medicineId) || medicineId <= 0) {
    return;
  }

  addItemToCart(medicineId);
  revalidatePath("/");
}

export async function decreaseCartItemAction(formData: FormData) {
  const medicineId = Number(formData.get("medicineId"));
  if (!Number.isInteger(medicineId) || medicineId <= 0) {
    return;
  }

  decreaseItemQuantity(medicineId);
  revalidatePath("/");
}

export async function payNowAction() {
  clearCart();
  revalidatePath("/");
}
