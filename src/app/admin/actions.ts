"use server";
import { z } from "zod";
import { authDb, configured, requireAdmin } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { eu } from "@/lib/catalog";
import sharp from "sharp";
type Result = { message: string };
const string = (form: FormData, key: string) => String(form.get(key) || "");
const checkbox = (form: FormData, key: string) => form.get(key) === "on";
export async function login(_: Result, form: FormData): Promise<Result> {
  if (!configured()) return { message: "Supabase Auth non configuré." };
  const parsed = z
    .object({ email: z.email(), password: z.string().min(8).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Vérifiez vos identifiants." };
  const db = await authDb();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Connexion refusée." };
  try {
    await requireAdmin();
  } catch {
    await db.auth.signOut();
    return { message: "Accès administrateur requis." };
  }
  redirect("/admin");
}
export async function logout() {
  const db = await authDb();
  await db.auth.signOut();
  redirect("/admin");
}
export async function saveProduct(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const row = z
      .object({
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(80),
        name: z.string().min(1).max(100),
        description: z.string().max(3000),
        composition: z.string().max(300),
        active: z.boolean(),
      })
      .parse({
        slug: string(form, "slug"),
        name: string(form, "name"),
        description: string(form, "description"),
        composition: string(form, "composition"),
        active: checkbox(form, "active"),
      });
    const id = string(form, "id");
    const result = id
      ? await db.from("products").update(row).eq("id", z.uuid().parse(id))
      : await db.from("products").insert(row);
    if (result.error) throw result.error;
    revalidatePath("/", "layout");
    return { message: "Produit enregistré." };
  } catch {
    return {
      message: "Enregistrement refusé. Vérifiez les champs et vos droits.",
    };
  }
}
export async function saveVariant(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const row = z
      .object({
        product_id: z.uuid(),
        size: z.string().min(1).max(15),
        price: z.number().int().min(1).max(1000000),
        stock: z.number().int().min(0).max(100000),
        preorder_limit: z.number().int().min(0).max(100000),
        preorder: z.boolean(),
        inventory_verified: z.boolean(),
      })
      .parse({
        product_id: string(form, "product_id"),
        size: string(form, "size"),
        price: Math.round(Number(form.get("price")) * 100),
        stock: Number(form.get("stock")),
        preorder_limit: Number(form.get("preorder_limit")),
        preorder: checkbox(form, "preorder"),
        inventory_verified: checkbox(form, "inventory_verified"),
      });
    const id = string(form, "id");
    const result = id
      ? await db.from("variants").update(row).eq("id", z.uuid().parse(id))
      : await db.from("variants").insert(row);
    if (result.error) throw result.error;
    revalidatePath("/", "layout");
    return { message: "Variante enregistrée." };
  } catch {
    return {
      message:
        "Vérifiez les quantités : elles doivent couvrir les réservations en cours.",
    };
  }
}
export async function saveSettings(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const row = z
      .object({
        seller_name: z.string().max(200),
        seller_address: z.string().max(1000),
        seller_registration: z.string().max(300),
        contact_email: z.union([z.email(), z.literal("")]),
        shipping_copy: z.string().max(4000),
        returns_copy: z.string().max(4000),
        legal_copy: z.string().max(20000),
        privacy_copy: z.string().max(20000),
        terms_copy: z.string().max(20000),
        legal_verified: z.boolean(),
        tax_verified: z.boolean(),
        shipping_verified: z.boolean(),
        live_enabled: z.boolean(),
      })
      .parse({
        seller_name: string(form, "seller_name"),
        seller_address: string(form, "seller_address"),
        seller_registration: string(form, "seller_registration"),
        contact_email: string(form, "contact_email"),
        shipping_copy: string(form, "shipping_copy"),
        returns_copy: string(form, "returns_copy"),
        legal_copy: string(form, "legal_copy"),
        privacy_copy: string(form, "privacy_copy"),
        terms_copy: string(form, "terms_copy"),
        legal_verified: checkbox(form, "legal_verified"),
        tax_verified: checkbox(form, "tax_verified"),
        shipping_verified: checkbox(form, "shipping_verified"),
        live_enabled: checkbox(form, "live_enabled"),
      });
    if (
      row.live_enabled &&
      (!row.legal_verified ||
        !row.tax_verified ||
        !row.shipping_verified ||
        !row.seller_name ||
        !row.seller_address ||
        !row.seller_registration ||
        !row.contact_email ||
        !row.returns_copy)
    )
      return {
        message:
          "Renseignez et validez les informations commerciales avant ouverture.",
      };
    const { error } = await db.from("store_settings").update(row).eq("id", 1);
    if (error) throw error;
    revalidatePath("/", "layout");
    return {
      message:
        "Paramètres enregistrés. Le mode serveur reste requis pour ouvrir les ventes.",
    };
  } catch {
    return { message: "Vérifiez les champs et votre autorisation." };
  }
}
export async function saveShipping(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const row = {
      country: z.enum(eu).parse(form.get("country")),
      amount: z
        .number()
        .int()
        .min(0)
        .max(100000)
        .parse(Math.round(Number(form.get("amount")) * 100)),
      enabled: checkbox(form, "enabled"),
    };
    const { error } = await db.from("shipping_rates").upsert(row);
    if (error) throw error;
    revalidatePath("/admin");
    return { message: "Tarif enregistré." };
  } catch {
    return { message: "Tarif invalide ou accès refusé." };
  }
}
export async function saveShipment(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const order_id = z.uuid().parse(form.get("order_id"));
    const status = z
      .enum(["preparing", "shipped", "delivered"])
      .parse(form.get("status"));
    const tracking_number = z
      .string()
      .max(150)
      .parse(string(form, "tracking_number"));
    const carrier = z.string().max(100).parse(string(form, "carrier"));
    const { data: order } = await db
      .from("orders")
      .select("status")
      .eq("id", order_id)
      .single();
    if (!order || !["paid", "partially_refunded"].includes(order.status))
      return { message: "Une commande payée est requise." };
    if (status !== "preparing" && (!tracking_number || !carrier))
      return { message: "Renseignez le transporteur et le numéro de suivi." };
    const { error } = await db.from("shipments").upsert({
      order_id,
      status,
      tracking_number,
      carrier,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    revalidatePath("/admin");
    return { message: "Expédition mise à jour." };
  } catch {
    return { message: "Mise à jour refusée." };
  }
}
export async function uploadImage(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const product_id = z.uuid().parse(form.get("product_id"));
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    )
      return { message: "Image requise, maximum 5 Mo." };
    const bytes = Buffer.from(await file.arrayBuffer());
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP";
    if (!png && !jpg && !webp)
      return { message: "Formats autorisés : JPEG, PNG, WebP." };
    const alt = z.string().min(1).max(200).parse(string(form, "alt"));
    const position = z
      .number()
      .int()
      .min(0)
      .max(100)
      .parse(Number(form.get("position")));
    const safeImage = await sharp(bytes, { limitInputPixels: 25000000 })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
    const path = product_id + "/" + randomUUID() + ".webp";
    const { error } = await db.storage
      .from("products")
      .upload(path, safeImage, { contentType: "image/webp", upsert: false });
    if (error) throw error;
    const { data } = db.storage.from("products").getPublicUrl(path);
    const { error: insertError } = await db.from("images").insert({
      product_id,
      url: data.publicUrl,
      alt,
      position,
    });
    if (insertError) throw insertError;
    revalidatePath("/", "layout");
    return { message: "Image ajoutée." };
  } catch {
    return {
      message: "Téléversement refusé. Vérifiez vos champs et votre accès.",
    };
  }
}
export async function reorderImage(_: Result, form: FormData): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const id = z.uuid().parse(form.get("id"));
    const position = z
      .number()
      .int()
      .min(0)
      .max(100)
      .parse(Number(form.get("position")));
    const alt = z.string().min(1).max(200).parse(string(form, "alt"));
    const { error } = await db
      .from("images")
      .update({ position, alt })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { message: "Image mise à jour." };
  } catch {
    return { message: "Modification refusée." };
  }
}
export async function revokeTracking(
  _: Result,
  form: FormData,
): Promise<Result> {
  try {
    const { db } = await requireAdmin();
    const { error } = await db
      .from("orders")
      .update({ token_hash: randomUUID() })
      .eq("id", z.uuid().parse(form.get("order_id")));
    if (error) throw error;
    return { message: "Lien de suivi révoqué." };
  } catch {
    return { message: "Révocation refusée." };
  }
}
