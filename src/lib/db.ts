import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "medicine-order.sqlite");
const db = new Database(dbPath);

type Medicine = {
  id: number;
  name: string;
  description: string;
  price: number;
};

type CartItem = {
  medicineId: number;
  medicineName: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

type CartSummary = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

type CartUpdateInput = {
  medicineId: number;
  quantity: number;
};

const defaultMedicines = [
  ["Paracetamol 500mg", "Pain and fever relief", 35],
  ["Vitamin C Tablets", "Daily immunity support", 120],
  ["Cough Syrup", "Soothes dry cough", 95],
  ["Antacid Gel", "Relief from acidity and heartburn", 80],
  ["Multivitamin Capsules", "General nutrition support", 210],
  ["ORS Sachets", "Hydration salts for recovery", 60],
  ["Ibuprofen 400mg", "Inflammation and pain relief", 55],
  ["Cetirizine 10mg", "Allergy symptom control", 45],
  ["Azithromycin 500mg", "Antibiotic as prescribed by doctor", 160],
  ["Calcium + D3 Tablets", "Bone health support", 140],
  ["BP Monitor Strips", "Home blood pressure tracking support", 180],
  ["Diabetes Test Strips", "Blood glucose testing strips", 350],
  ["Nasal Spray", "Relief from blocked nose", 110],
  ["Eye Lubricant Drops", "Dry eye moisture support", 130],
  ["Pain Relief Spray", "Topical muscle pain spray", 175],
] as const;

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL UNIQUE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      FOREIGN KEY (medicine_id) REFERENCES medicines (id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_medicines_name
    ON medicines (name);
  `);

  const insert = db.prepare(
    "INSERT OR IGNORE INTO medicines (name, description, price) VALUES (?, ?, ?)",
  );

  const transaction = db.transaction(() => {
    for (const medicine of defaultMedicines) {
      insert.run(...medicine);
    }
  });

  transaction();
}

initDb();

export function getMedicines(): Medicine[] {
  return db
    .prepare("SELECT id, name, description, price FROM medicines ORDER BY name")
    .all() as Medicine[];
}

export function searchMedicinesByName(medicineName: string): Medicine[] {
  const normalizedQuery = medicineName.trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  return db
    .prepare(
      `
        SELECT id, name, description, price
        FROM medicines
        WHERE name LIKE ?
        ORDER BY name
      `,
    )
    .all(`%${normalizedQuery}%`) as Medicine[];
}

export function addItemToCart(medicineId: number) {
  db.prepare(
    `
      INSERT INTO cart_items (medicine_id, quantity)
      VALUES (?, 1)
      ON CONFLICT(medicine_id) DO UPDATE SET quantity = quantity + 1
    `,
  ).run(medicineId);
}

export function decreaseItemQuantity(medicineId: number) {
  db.prepare(
    `
      UPDATE cart_items
      SET quantity = quantity - 1
      WHERE medicine_id = ? AND quantity > 1
    `,
  ).run(medicineId);

  db.prepare(
    `
      DELETE FROM cart_items
      WHERE medicine_id = ? AND quantity <= 1
    `,
  ).run(medicineId);
}

export function getCartSummary(): CartSummary {
  const items = db
    .prepare(
      `
        SELECT
          m.id as medicineId,
          m.name as medicineName,
          m.price as price,
          c.quantity as quantity,
          (m.price * c.quantity) as lineTotal
        FROM cart_items c
        INNER JOIN medicines m ON m.id = c.medicine_id
        ORDER BY m.name
      `,
    )
    .all() as CartItem[];

  const totals = db
    .prepare(
      `
        SELECT
          COALESCE(SUM(quantity), 0) as totalItems,
          COALESCE(SUM(m.price * c.quantity), 0) as totalPrice
        FROM cart_items c
        INNER JOIN medicines m ON m.id = c.medicine_id
      `,
    )
    .get() as { totalItems: number; totalPrice: number };

  return {
    items,
    totalItems: totals.totalItems,
    totalPrice: totals.totalPrice,
  };
}

export function updateCart(items: CartUpdateInput[]) {
  const normalizedItems = items.filter(
    (item) =>
      Number.isInteger(item.medicineId) &&
      item.medicineId > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 0,
  );

  const updateTransaction = db.transaction((updates: CartUpdateInput[]) => {
    const removeAll = db.prepare("DELETE FROM cart_items");
    const addOrUpdate = db.prepare(
      `
        INSERT INTO cart_items (medicine_id, quantity)
        VALUES (?, ?)
        ON CONFLICT(medicine_id) DO UPDATE SET quantity = excluded.quantity
      `,
    );

    removeAll.run();

    for (const item of updates) {
      if (item.quantity > 0) {
        addOrUpdate.run(item.medicineId, item.quantity);
      }
    }
  });

  updateTransaction(normalizedItems);
}

export function clearCart() {
  db.prepare("DELETE FROM cart_items").run();
}
