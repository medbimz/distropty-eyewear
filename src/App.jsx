import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Users, Wallet, Fuel, Heart, Tag, Package,
  Receipt, TrendingUp, Landmark, Plus, Pencil, Trash2, Search,
  X, AlertTriangle, ChevronDown, RotateCcw, Menu, MapPin,
  Phone, Mail, Calendar, CheckCircle2, XCircle, Clock, Filter
} from "lucide-react";

/* ============================================================
   CONSTANTES MÉTIER
============================================================ */

const BRANDS = ["ELEGANZ", "VEROKA", "CRILLON"];

const BRAND_COLORS = {
  ELEGANZ: { main: "#6B4E9E", light: "#EFE9F7", text: "#4A3470", ring: "#6B4E9E" },
  VEROKA:  { main: "#C8862E", light: "#FBF0E1", text: "#8C5D1E", ring: "#C8862E" },
  CRILLON: { main: "#B23A55", light: "#FAE6EA", text: "#7D2839", ring: "#B23A55" },
};

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir",
  "Meknès", "Oujda", "Kénitra", "Tétouan", "Salé", "Nador",
  "Mohammedia", "El Jadida", "Béni Mellal",
];

const ROLES = ["Commercial", "Manager", "Chauffeur", "Comptable"];

const EXPENSE_CATEGORIES = [
  "Carburant", "Salaire", "Loyer", "Marketing", "Maintenance",
  "Logistique", "Bureau", "Repas", "Autre",
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LOYALTY_TIERS = [
  { key: "Bronze",   min: 0,    color: "#9B8B73", bg: "#F3EFE6" },
  { key: "Argent",   min: 500,  color: "#7A828C", bg: "#EEF0F2" },
  { key: "Or",       min: 1000, color: "#B8860B", bg: "#FBF3DD" },
  { key: "Platine",  min: 2500, color: "#4A6E8C", bg: "#E9F1F6" },
];

const CHEQUE_BANKS = [
  "Attijariwafa Bank", "Banque Populaire", "BMCE Bank", "BMCI",
  "CIH Bank", "Crédit du Maroc", "Société Générale Maroc", "Al Barid Bank",
];

const CHEQUE_STATUSES_RECU = ["En attente", "Encaissé", "Rejeté"];
const CHEQUE_STATUSES_EMIS = ["En attente", "Débité", "Annulé"];

/* ============================================================
   HELPERS
============================================================ */

const fmtMAD = (n) =>
  new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + " MAD";

const fmtNum = (n) => new Intl.NumberFormat("fr-MA").format(Math.round(n || 0));

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const uid = () => Math.random().toString(36).slice(2, 10);

const getTier = (points) => {
  let tier = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) if (points >= t.min) tier = t;
  return tier;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const monthsAgoISO = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

const daysFromNowISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/* ============================================================
   DONNÉES DE DÉMONSTRATION
============================================================ */

function buildDemoData() {
  // ---------- Employés ----------
  const employeeNames = [
    ["Yassine", "El Amrani"], ["Sara", "Bennani"], ["Omar", "Tazi"],
    ["Imane", "Cherkaoui"], ["Mehdi", "Lahlou"], ["Nadia", "Fassi"],
    ["Karim", "Berrada"], ["Salma", "Idrissi"], ["Hamza", "Ouazzani"],
    ["Leïla", "Saadi"], ["Younes", "Benjelloun"], ["Fatima", "Zahra"],
  ];
  const employees = employeeNames.map(([first, last], i) => {
    const role = i < 6 ? "Commercial" : i < 9 ? "Chauffeur" : i < 11 ? "Manager" : "Comptable";
    return {
      id: uid(),
      firstName: first,
      lastName: last,
      role,
      phone: `06${randInt(10000000, 99999999)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@distropty.ma`,
      city: pick(CITIES),
      baseSalary: role === "Manager" ? randInt(12000, 18000) : role === "Commercial" ? randInt(6000, 9000) : randInt(4500, 7000),
      hireDate: monthsAgoISO(randInt(3, 48)),
      active: Math.random() > 0.1,
    };
  });

  const salesReps = employees.filter((e) => e.role === "Commercial");
  const drivers = employees.filter((e) => e.role === "Chauffeur");

  // ---------- Clients (opticiens B2B) ----------
  const shopNames = [
    "Optique du Centre", "Vision Plus", "Optic Atlas", "Le Regard",
    "Optique Lumière", "Vision Royale", "Optic Médina", "Optique Élégance",
    "Vision Express", "Optic Avenue", "Optique Horizon", "Le Petit Lunetier",
    "Optic Premium", "Vision Care", "Optique du Souk", "Optic Style",
    "Vision Excellence", "Optique Atlantique", "Optic Confort", "Vision Nord",
  ];
  const clients = shopNames.map((shop) => {
    const totalSpent = randInt(3000, 45000);
    const points = Math.floor(totalSpent / 100);
    return {
      id: uid(),
      contactName: `${pick(["M.", "Mme"])} ${pick(["Alaoui", "Benani", "Toumi", "Rifai", "Skali", "Naciri"])}`,
      shopName: shop,
      phone: `05${randInt(10000000, 99999999)}`,
      email: `contact@${shop.toLowerCase().replace(/[^a-z]/g, "")}.ma`,
      city: pick(CITIES),
      brands: BRANDS.filter(() => Math.random() > 0.35).length
        ? BRANDS.filter(() => Math.random() > 0.35)
        : [pick(BRANDS)],
      points,
      totalSpent,
      joinDate: monthsAgoISO(randInt(2, 36)),
      lastVisit: monthsAgoISO(randInt(0, 4)),
    };
  });

  // ---------- Stock ----------
  const models = {
    ELEGANZ: ["Aurora", "Belmonte", "Cosmo", "Diane", "Eclipse"],
    VEROKA: ["Falcon", "Granite", "Horizon", "Ionis", "Jasper"],
    CRILLON: ["Kyoto", "Liberty", "Monaco", "Nova", "Opale"],
  };
  const colors = ["Noir", "Havane", "Doré", "Argenté", "Bordeaux", "Bleu marine"];
  let stock = [];
  BRANDS.forEach((brand) => {
    models[brand].forEach((model, mi) => {
      colors.slice(0, 3 + (mi % 3)).forEach((color, ci) => {
        const sku = `${brand.slice(0, 3).toUpperCase()}-${String(mi + 1).padStart(2, "0")}${ci}-${color.slice(0, 3).toUpperCase()}`;
        const cost = randInt(180, 450);
        stock.push({
          id: uid(),
          sku,
          brand,
          model,
          color,
          quantity: randInt(0, 60),
          minQuantity: randInt(8, 15),
          costPrice: cost,
          sellPrice: Math.round(cost * (1.6 + Math.random() * 0.7)),
          city: pick(CITIES.slice(0, 6)),
        });
      });
    });
  });

  // ---------- Ventes ----------
  let sales = [];
  for (let i = 0; i < 140; i++) {
    const client = pick(clients);
    const rep = pick(salesReps);
    const item = pick(stock.filter((s) => client.brands.includes(s.brand)) ) || pick(stock);
    const qty = randInt(1, 12);
    const date = monthsAgoISO(randInt(0, 11));
    sales.push({
      id: uid(),
      date,
      clientId: client.id,
      employeeId: rep.id,
      brand: item.brand,
      stockId: item.id,
      sku: item.sku,
      quantity: qty,
      unitPrice: item.sellPrice,
      total: qty * item.sellPrice,
      city: client.city,
    });
  }
  sales.sort((a, b) => new Date(b.date) - new Date(a.date));

  // ---------- Dépenses ----------
  let expenses = [];
  for (let i = 0; i < 90; i++) {
    const cat = pick(EXPENSE_CATEGORIES);
    const date = monthsAgoISO(randInt(0, 11));
    const emp = Math.random() > 0.4 ? pick(employees) : null;
    const liters = cat === "Carburant" ? randInt(20, 60) : null;
    const pricePerLiter = cat === "Carburant" ? +(12 + Math.random() * 2).toFixed(2) : null;
    expenses.push({
      id: uid(),
      date,
      category: cat,
      description:
        cat === "Carburant" ? "Plein carburant véhicule de tournée" :
        cat === "Salaire" ? "Versement salaire mensuel" :
        cat === "Loyer" ? "Loyer entrepôt / bureau" :
        cat === "Marketing" ? "Campagne promotionnelle locale" :
        cat === "Maintenance" ? "Entretien véhicule / équipement" :
        cat === "Logistique" ? "Transport de marchandises" :
        cat === "Bureau" ? "Fournitures de bureau" :
        cat === "Repas" ? "Frais de représentation" : "Dépense diverse",
      amount: cat === "Carburant" ? Math.round(liters * pricePerLiter) :
               cat === "Salaire" ? randInt(4500, 18000) :
               cat === "Loyer" ? randInt(6000, 15000) :
               randInt(300, 5000),
      employeeId: emp?.id || null,
      city: Math.random() > 0.3 ? pick(CITIES) : null,
      brand: Math.random() > 0.6 ? pick(BRANDS) : null,
      liters,
    });
  }

  // ---------- Carburant (journal détaillé) ----------
  let fuelLogs = [];
  for (let i = 0; i < 60; i++) {
    const driver = pick(drivers.length ? drivers : employees);
    const liters = randInt(25, 55);
    const pricePerLiter = +(12 + Math.random() * 2).toFixed(2);
    fuelLogs.push({
      id: uid(),
      date: monthsAgoISO(randInt(0, 11)),
      employeeId: driver.id,
      vehicle: pick(["Dacia Logan - 14589-A-7", "Renault Kangoo - 22341-B-9", "Peugeot Partner - 9087-C-12", "Dacia Dokker - 33456-D-3"]),
      city: pick(CITIES),
      liters,
      pricePerLiter,
      total: Math.round(liters * pricePerLiter),
      odometer: randInt(15000, 120000),
    });
  }

  // ---------- Offres ----------
  const offers = [
    { id: uid(), title: "Promo Rentrée ELEGANZ", description: "Remise spéciale sur la collection ELEGANZ pour la rentrée.", brand: "ELEGANZ", discount: 15, startDate: monthsAgoISO(1), endDate: daysFromNowISO(10), active: true },
    { id: uid(), title: "Soldes VEROKA Été", description: "Réduction sur toute la gamme VEROKA été.", brand: "VEROKA", discount: 20, startDate: monthsAgoISO(2), endDate: monthsAgoISO(0), active: false },
    { id: uid(), title: "Lancement CRILLON Monaco", description: "Offre de lancement sur le nouveau modèle Monaco.", brand: "CRILLON", discount: 10, startDate: daysFromNowISO(-5), endDate: daysFromNowISO(25), active: true },
    { id: uid(), title: "Fidélité Multi-marques", description: "Remise toutes marques pour les clients fidèles.", brand: "Toutes", discount: 12, startDate: daysFromNowISO(-2), endDate: daysFromNowISO(40), active: true },
    { id: uid(), title: "Clearance Stock Hiver", description: "Déstockage des références hiver toutes marques.", brand: "Toutes", discount: 25, startDate: monthsAgoISO(4), endDate: monthsAgoISO(1), active: false },
  ];

  // ---------- Chèques ----------
  let cheques = [];
  for (let i = 0; i < 24; i++) {
    const direction = Math.random() > 0.45 ? "Reçu" : "Émis";
    const client = pick(clients);
    const date = monthsAgoISO(randInt(0, 6));
    const dueDate = Math.random() > 0.3 ? daysFromNowISO(randInt(-15, 45)) : daysFromNowISO(randInt(-40, -1));
    const statusList = direction === "Reçu" ? CHEQUE_STATUSES_RECU : CHEQUE_STATUSES_EMIS;
    let status = pick(statusList);
    // Si échéance dans le passé et toujours "en attente", on force un peu de réalisme
    if (new Date(dueDate) < new Date() && status === "En attente" && Math.random() > 0.5) {
      status = direction === "Reçu" ? "Encaissé" : "Débité";
    }
    cheques.push({
      id: uid(),
      direction, // "Reçu" | "Émis"
      number: `CHQ${randInt(100000, 999999)}`,
      bank: pick(CHEQUE_BANKS),
      amount: randInt(1500, 38000),
      issueDate: date,
      dueDate,
      status,
      clientId: direction === "Reçu" ? client.id : null,
      payee: direction === "Émis" ? pick(["Fournisseur Optic Import", "Régie Loyer Casablanca", "Garage Auto Plus", "Imprimerie Centrale", "Transitaire Maroc Logistics"]) : null,
      note: "",
    });
  }
  cheques.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  return { employees, clients, stock, sales, expenses, fuelLogs, offers, cheques };
}


/* ============================================================
   STORE — connecté à Supabase (sauvegarde réelle et partagée)
============================================================ */

// Conversion entre les noms de colonnes Supabase (snake_case)
// et les noms utilisés dans l'app (camelCase)
function rowToEmployee(r) {
  return { id: r.id, firstName: r.first_name, lastName: r.last_name, role: r.role, phone: r.phone, email: r.email, city: r.city, baseSalary: r.base_salary, hireDate: r.hire_date, active: r.active };
}
function employeeToRow(e) {
  return { id: e.id, first_name: e.firstName, last_name: e.lastName, role: e.role, phone: e.phone, email: e.email, city: e.city, base_salary: e.baseSalary, hire_date: e.hireDate, active: e.active };
}
function rowToClient(r) {
  return { id: r.id, contactName: r.contact_name, shopName: r.shop_name, phone: r.phone, email: r.email, city: r.city, brands: r.brands || [], points: r.points, totalSpent: r.total_spent, joinDate: r.join_date, lastVisit: r.last_visit };
}
function clientToRow(c) {
  return { id: c.id, contact_name: c.contactName, shop_name: c.shopName, phone: c.phone, email: c.email, city: c.city, brands: c.brands, points: c.points, total_spent: c.totalSpent, join_date: c.joinDate, last_visit: c.lastVisit };
}
function rowToStock(r) {
  return { id: r.id, sku: r.sku, brand: r.brand, model: r.model, color: r.color, quantity: r.quantity, minQuantity: r.min_quantity, costPrice: r.cost_price, sellPrice: r.sell_price, city: r.city };
}
function stockToRow(s) {
  return { id: s.id, sku: s.sku, brand: s.brand, model: s.model, color: s.color, quantity: s.quantity, min_quantity: s.minQuantity, cost_price: s.costPrice, sell_price: s.sellPrice, city: s.city };
}
function rowToSale(r) {
  return { id: r.id, date: r.date, clientId: r.client_id, employeeId: r.employee_id, brand: r.brand, stockId: r.stock_id, sku: r.sku, quantity: r.quantity, unitPrice: r.unit_price, total: r.total, city: r.city };
}
function saleToRow(s) {
  return { id: s.id, date: s.date, client_id: s.clientId, employee_id: s.employeeId, brand: s.brand, stock_id: s.stockId, sku: s.sku, quantity: s.quantity, unit_price: s.unitPrice, total: s.total, city: s.city };
}
function rowToExpense(r) {
  return { id: r.id, date: r.date, category: r.category, description: r.description, amount: r.amount, employeeId: r.employee_id, city: r.city, brand: r.brand, liters: r.liters };
}
function expenseToRow(e) {
  return { id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, employee_id: e.employeeId, city: e.city, brand: e.brand, liters: e.liters };
}
function rowToFuel(r) {
  return { id: r.id, date: r.date, employeeId: r.employee_id, vehicle: r.vehicle, city: r.city, liters: r.liters, pricePerLiter: r.price_per_liter, total: r.total, odometer: r.odometer };
}
function fuelToRow(f) {
  return { id: f.id, date: f.date, employee_id: f.employeeId, vehicle: f.vehicle, city: f.city, liters: f.liters, price_per_liter: f.pricePerLiter, total: f.total, odometer: f.odometer };
}
function rowToOffer(r) {
  return { id: r.id, title: r.title, description: r.description, brand: r.brand, discount: r.discount, startDate: r.start_date, endDate: r.end_date, active: r.active };
}
function offerToRow(o) {
  return { id: o.id, title: o.title, description: o.description, brand: o.brand, discount: o.discount, start_date: o.startDate, end_date: o.endDate, active: o.active };
}
function rowToCheque(r) {
  return { id: r.id, direction: r.direction, number: r.number, bank: r.bank, amount: r.amount, issueDate: r.issue_date, dueDate: r.due_date, status: r.status, clientId: r.client_id, payee: r.payee, note: r.note };
}
function chequeToRow(c) {
  return { id: c.id, direction: c.direction, number: c.number, bank: c.bank, amount: c.amount, issue_date: c.issueDate, due_date: c.dueDate, status: c.status, client_id: c.clientId, payee: c.payee, note: c.note };
}

const EMPTY_DATA = { employees: [], clients: [], stock: [], sales: [], expenses: [], fuelLogs: [], offers: [], cheques: [] };

function useStore() {
  const [data, setDataState] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [emp, cli, stk, sal, exp, fuel, off, chq] = await Promise.all([
        supabase.from("employees").select("*").order("created_at"),
        supabase.from("clients").select("*").order("created_at"),
        supabase.from("stock").select("*").order("created_at"),
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("fuel_logs").select("*").order("date", { ascending: false }),
        supabase.from("offers").select("*").order("created_at"),
        supabase.from("cheques").select("*").order("issue_date", { ascending: false }),
      ]);
      const firstError = [emp, cli, stk, sal, exp, fuel, off, chq].find((r) => r.error)?.error;
      if (firstError) throw firstError;
      setDataState({
        employees: (emp.data || []).map(rowToEmployee),
        clients: (cli.data || []).map(rowToClient),
        stock: (stk.data || []).map(rowToStock),
        sales: (sal.data || []).map(rowToSale),
        expenses: (exp.data || []).map(rowToExpense),
        fuelLogs: (fuel.data || []).map(rowToFuel),
        offers: (off.data || []).map(rowToOffer),
        cheques: (chq.data || []).map(rowToCheque),
      });
    } catch (e) {
      setError(e.message || "Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // setData accepte soit un nouvel objet, soit une fonction (updater) — comme useState classique.
  // Chaque appel recalcule le nouvel état, compare avec l'ancien, et synchronise les différences vers Supabase.
  const setData = useCallback((updater) => {
    setDataState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncToSupabase(prev, next);
      return next;
    });
  }, []);

  const TABLES = {
    employees: { table: "employees", toRow: employeeToRow },
    clients: { table: "clients", toRow: clientToRow },
    stock: { table: "stock", toRow: stockToRow },
    sales: { table: "sales", toRow: saleToRow },
    expenses: { table: "expenses", toRow: expenseToRow },
    fuelLogs: { table: "fuel_logs", toRow: fuelToRow },
    offers: { table: "offers", toRow: offerToRow },
    cheques: { table: "cheques", toRow: chequeToRow },
  };

  async function syncToSupabase(prev, next) {
    for (const key of Object.keys(TABLES)) {
      const { table, toRow } = TABLES[key];
      const prevList = prev[key] || [];
      const nextList = next[key] || [];
      const prevIds = new Set(prevList.map((x) => x.id));
      const nextIds = new Set(nextList.map((x) => x.id));

      // Suppressions
      const removed = prevList.filter((x) => !nextIds.has(x.id));
      for (const item of removed) {
        await supabase.from(table).delete().eq("id", item.id);
      }
      // Ajouts et modifications (upsert : insère si nouveau, met à jour si existant)
      const changed = nextList.filter((x) => {
        const before = prevList.find((p) => p.id === x.id);
        return !before || JSON.stringify(before) !== JSON.stringify(x);
      });
      for (const item of changed) {
        const row = toRow(item);
        await supabase.from(table).upsert(row);
      }
    }
  }

  return [data, setData, loadAll, loading, error];
}

/* ============================================================
   COMPOSANTS UI PARTAGÉS
============================================================ */

function StatCard({ label, value, icon: Icon, accent = "#6B4E9E", sub }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-4 flex items-start gap-3 shadow-sm">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent + "1A", color: accent }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500 truncate">{label}</p>
        <p className="text-lg font-semibold text-stone-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", icon: Icon, size = "md", type = "button" }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-xl transition active:scale-[0.98]";
  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  const variants = {
    primary: "bg-indigo-700 text-white hover:bg-indigo-800",
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    ghost: "text-stone-500 hover:bg-stone-100",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${sizes} ${variants[variant]}`}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

function Badge({ children, color = "#6B4E9E", bg }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color, background: bg || color + "1A" }}
    >
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400";
const selectCls = inputCls + " bg-white";

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-stone-400">
      <Icon size={32} className="mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rechercher..."}
        className="pl-8 pr-3 py-2 rounded-lg border border-stone-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
    </div>
  );
}

const CHART_COLORS = ["#6B4E9E", "#C8862E", "#B23A55", "#4A6E8C", "#3B8C6E"];

/* ============================================================
   NAVIGATION
============================================================ */

const NAV_ITEMS = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "employees", label: "Employés", icon: Users },
  { key: "expenses", label: "Dépenses", icon: Wallet },
  { key: "fuel", label: "Carburant", icon: Fuel },
  { key: "clients", label: "Clients & fidélité", icon: Heart },
  { key: "offers", label: "Offres & promotions", icon: Tag },
  { key: "stock", label: "Stock", icon: Package },
  { key: "sales", label: "Ventes", icon: Receipt },
  { key: "cheques", label: "Chèques", icon: Landmark },
  { key: "finance", label: "Suivi financier", icon: TrendingUp },
];

function Sidebar({ active, onNavigate, mobileOpen, setMobileOpen, onReset, resetLabel }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-stone-900 text-stone-200 flex flex-col transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="px-5 py-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
              DE
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">Distropty Eyewear</p>
              <p className="text-xs text-stone-400">Distribution de montures</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition
                  ${isActive ? "bg-indigo-600 text-white font-medium" : "text-stone-300 hover:bg-stone-800"}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <RotateCcw size={14} />
            {resetLabel || "Réinitialiser les données de démo"}
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, onMenuClick }) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
      <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-stone-100">
        <Menu size={20} />
      </button>
      <span className="font-semibold text-stone-900 text-sm">{title}</span>
    </div>
  );
}

/* ============================================================
   MODULE : TABLEAU DE BORD
============================================================ */

function DashboardModule({ data }) {
  const { employees, clients, stock, sales, expenses, fuelLogs } = data;
  const currentYear = new Date().getFullYear();

  const totalRevenue = useMemo(() => sales.reduce((s, x) => s + x.total, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const totalFuel = useMemo(() => fuelLogs.reduce((s, x) => s + x.total, 0), [fuelLogs]);
  const netProfit = totalRevenue - totalExpenses;
  const lowStockItems = useMemo(() => stock.filter((s) => s.quantity <= s.minQuantity), [stock]);
  const activeEmployees = employees.filter((e) => e.active).length;

  const monthlyData = useMemo(() => {
    return MONTHS.map((m, idx) => {
      const rev = sales
        .filter((s) => new Date(s.date).getMonth() === idx && new Date(s.date).getFullYear() === currentYear)
        .reduce((sum, s) => sum + s.total, 0);
      const exp = expenses
        .filter((e) => new Date(e.date).getMonth() === idx && new Date(e.date).getFullYear() === currentYear)
        .reduce((sum, e) => sum + e.amount, 0);
      return { mois: m.slice(0, 3), revenu: rev, depenses: exp };
    });
  }, [sales, expenses, currentYear]);

  const brandRevenue = useMemo(() => {
    return BRANDS.map((b) => ({
      name: b,
      value: sales.filter((s) => s.brand === b).reduce((sum, s) => sum + s.total, 0),
    }));
  }, [sales]);

  const cityRevenue = useMemo(() => {
    const map = {};
    sales.forEach((s) => { map[s.city] = (map[s.city] || 0) + s.total; });
    return Object.entries(map)
      .map(([city, value]) => ({ city, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [sales]);

  const topEmployees = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      if (!map[s.employeeId]) map[s.employeeId] = 0;
      map[s.employeeId] += s.total;
    });
    return Object.entries(map)
      .map(([id, revenue]) => {
        const emp = employees.find((e) => e.id === id);
        return emp ? { name: `${emp.firstName} ${emp.lastName}`, revenue, city: emp.city } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales, employees]);

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle={`Vue d'ensemble de l'activité — ${currentYear}`} />

      {lowStockItems.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-amber-800 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{lowStockItems.length}</strong> référence(s) en stock bas nécessitent un réapprovisionnement.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Chiffre d'affaires total" value={fmtMAD(totalRevenue)} icon={TrendingUp} accent="#3B8C6E" />
        <StatCard label="Dépenses totales" value={fmtMAD(totalExpenses)} icon={Wallet} accent="#B23A55" />
        <StatCard label="Coût carburant cumulé" value={fmtMAD(totalFuel)} icon={Fuel} accent="#C8862E" />
        <StatCard label="Bénéfice net" value={fmtMAD(netProfit)} icon={Landmark} accent="#6B4E9E" />
        <StatCard label="Employés actifs" value={activeEmployees} icon={Users} accent="#4A6E8C" />
        <StatCard label="Clients (opticiens)" value={clients.length} icon={Heart} accent="#B23A55" />
        <StatCard label="Articles en stock" value={fmtNum(stock.reduce((s, x) => s + x.quantity, 0))} icon={Package} accent="#3B8C6E" />
        <StatCard label="Alertes stock bas" value={lowStockItems.length} icon={AlertTriangle} accent="#C8862E" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Revenu vs dépenses ({currentYear})</p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Area type="monotone" dataKey="revenu" stroke="#6B4E9E" fill="#6B4E9E" fillOpacity={0.18} name="Revenu" />
                <Area type="monotone" dataKey="depenses" stroke="#B23A55" fill="#B23A55" fillOpacity={0.12} name="Dépenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Revenu par marque</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={brandRevenue} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {brandRevenue.map((b, i) => (
                    <Cell key={b.name} fill={BRAND_COLORS[b.name]?.main || CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtMAD(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {brandRevenue.map((b) => (
              <Badge key={b.name} color={BRAND_COLORS[b.name]?.text} bg={BRAND_COLORS[b.name]?.light}>
                {b.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Top des villes par revenu</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={cityRevenue} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 12, fill: "#44403c" }} width={90} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Bar dataKey="value" fill="#6B4E9E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Meilleurs employés par chiffre d'affaires</p>
          <div className="space-y-2.5">
            {topEmployees.map((emp, i) => (
              <div key={emp.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{emp.name}</p>
                  <p className="text-xs text-stone-400">{emp.city}</p>
                </div>
                <p className="text-sm font-semibold text-stone-700">{fmtMAD(emp.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODULE : EMPLOYÉS
============================================================ */

function EmployeeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      firstName: "", lastName: "", role: "Commercial", phone: "", email: "",
      city: CITIES[0], baseSalary: "", hireDate: todayISO(), active: true,
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, baseSalary: Number(form.baseSalary) || 0 });
      }}
    >
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Prénom"><input className={inputCls} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></Field>
        <Field label="Nom"><input className={inputCls} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></Field>
      </div>
      <Field label="Rôle">
        <select className={selectCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Téléphone"><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Ville">
          <select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Salaire de base (MAD)"><input type="number" className={inputCls} value={form.baseSalary} onChange={(e) => set("baseSalary", e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Date d'embauche"><input type="date" className={inputCls} value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} /></Field>
        <Field label="Statut">
          <select className={selectCls} value={form.active ? "1" : "0"} onChange={(e) => set("active", e.target.value === "1")}>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function EmployeesModule({ data, setData }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [modal, setModal] = useState(null); // null | "new" | employee object

  const stats = useMemo(() => {
    const map = {};
    data.sales.forEach((s) => {
      if (!map[s.employeeId]) map[s.employeeId] = { revenue: 0, count: 0 };
      map[s.employeeId].revenue += s.total;
      map[s.employeeId].count += 1;
    });
    return map;
  }, [data.sales]);

  const filtered = useMemo(() => {
    return data.employees.filter((e) => {
      const matchesRole = roleFilter === "Tous" || e.role === roleFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || `${e.firstName} ${e.lastName} ${e.email} ${e.city}`.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [data.employees, search, roleFilter]);

  const saveEmployee = (emp) => {
    setData((d) => {
      if (emp.id) {
        return { ...d, employees: d.employees.map((e) => (e.id === emp.id ? emp : e)) };
      }
      return { ...d, employees: [...d.employees, { ...emp, id: uid() }] };
    });
    setModal(null);
  };

  const deleteEmployee = (id) => {
    setData((d) => ({ ...d, employees: d.employees.filter((e) => e.id !== id) }));
  };

  return (
    <div>
      <PageHeader
        title="Employés"
        subtitle={`${data.employees.length} employé(s) — ${data.employees.filter((e) => e.active).length} actif(s)`}
        action={<Button icon={Plus} onClick={() => setModal("new")}>Ajouter un employé</Button>}
      />

      <div className="flex flex-wrap gap-2.5 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, email, ville..." />
        <select className={selectCls + " w-auto"} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option>Tous</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text="Aucun employé ne correspond à ces critères." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Employé</th>
                <th className="text-left px-4 py-2.5 font-medium">Rôle</th>
                <th className="text-left px-4 py-2.5 font-medium">Ville</th>
                <th className="text-right px-4 py-2.5 font-medium">Ventes</th>
                <th className="text-right px-4 py-2.5 font-medium">CA généré</th>
                <th className="text-center px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const s = stats[e.id] || { revenue: 0, count: 0 };
                return (
                  <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-stone-800">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-stone-400">{e.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-stone-600">{e.role}</td>
                    <td className="px-4 py-2.5 text-stone-600">{e.city}</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{s.count}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(s.revenue)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {e.active ? <Badge color="#15803d" bg="#ecfdf5">Actif</Badge> : <Badge color="#78716c" bg="#f5f5f4">Inactif</Badge>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(e)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                        <button onClick={() => deleteEmployee(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Ajouter un employé" : "Modifier l'employé"} onClose={() => setModal(null)}>
          <EmployeeForm initial={modal === "new" ? null : modal} onSave={saveEmployee} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : DÉPENSES
============================================================ */

function ExpenseForm({ initial, employees, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      date: todayISO(), category: "Autre", description: "", amount: "",
      employeeId: "", city: "", brand: "", liters: "",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          amount: Number(form.amount) || 0,
          liters: form.category === "Carburant" ? Number(form.liters) || 0 : null,
          employeeId: form.employeeId || null,
          city: form.city || null,
          brand: form.brand || null,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} required /></Field>
        <Field label="Catégorie">
          <select className={selectCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description"><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} required /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Montant (MAD)"><input type="number" className={inputCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} required /></Field>
        {form.category === "Carburant" && (
          <Field label="Litres"><input type="number" className={inputCls} value={form.liters} onChange={(e) => set("liters", e.target.value)} /></Field>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Employé (optionnel)">
          <select className={selectCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">—</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </Field>
        <Field label="Ville (optionnel)">
          <select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">—</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Marque (optionnel)">
        <select className={selectCls} value={form.brand} onChange={(e) => set("brand", e.target.value)}>
          <option value="">—</option>
          {BRANDS.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function ExpensesModule({ data, setData }) {
  const [catFilter, setCatFilter] = useState("Toutes");
  const [monthFilter, setMonthFilter] = useState("Tous");
  const [modal, setModal] = useState(null);

  const filtered = useMemo(() => {
    return data.expenses.filter((e) => {
      const matchesCat = catFilter === "Toutes" || e.category === catFilter;
      const matchesMonth = monthFilter === "Tous" || new Date(e.date).getMonth() === Number(monthFilter);
      return matchesCat && matchesMonth;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.expenses, catFilter, monthFilter]);

  const totalAll = useMemo(() => data.expenses.reduce((s, e) => s + e.amount, 0), [data.expenses]);
  const totalFuel = useMemo(() => data.expenses.filter((e) => e.category === "Carburant").reduce((s, e) => s + e.amount, 0), [data.expenses]);
  const totalSalary = useMemo(() => data.expenses.filter((e) => e.category === "Salaire").reduce((s, e) => s + e.amount, 0), [data.expenses]);
  const totalOther = totalAll - totalFuel - totalSalary;

  const last6Months = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const monthExpenses = data.expenses.filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === m && ed.getFullYear() === y;
      });
      arr.push({
        mois: MONTHS[m].slice(0, 3),
        carburant: monthExpenses.filter((e) => e.category === "Carburant").reduce((s, e) => s + e.amount, 0),
        autres: monthExpenses.filter((e) => e.category !== "Carburant").reduce((s, e) => s + e.amount, 0),
      });
    }
    return arr;
  }, [data.expenses]);

  const byCategory = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      name: cat,
      value: data.expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    })).filter((c) => c.value > 0);
  }, [data.expenses]);

  const saveExpense = (exp) => {
    setData((d) => {
      if (exp.id) return { ...d, expenses: d.expenses.map((e) => (e.id === exp.id ? exp : e)) };
      return { ...d, expenses: [...d.expenses, { ...exp, id: uid() }] };
    });
    setModal(null);
  };

  const deleteExpense = (id) => setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));

  return (
    <div>
      <PageHeader
        title="Suivi des dépenses"
        subtitle="Carburant, salaires, loyer, marketing et autres charges"
        action={<Button icon={Plus} onClick={() => setModal("new")}>Nouvelle dépense</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total dépenses" value={fmtMAD(totalAll)} icon={Wallet} accent="#B23A55" />
        <StatCard label="Total carburant" value={fmtMAD(totalFuel)} icon={Fuel} accent="#C8862E" />
        <StatCard label="Total salaires" value={fmtMAD(totalSalary)} icon={Users} accent="#4A6E8C" />
        <StatCard label="Autres coûts" value={fmtMAD(totalOther)} icon={Receipt} accent="#6B4E9E" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Tendance sur 6 mois (carburant vs autres)</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Bar dataKey="autres" stackId="a" fill="#6B4E9E" name="Autres" radius={[0, 0, 0, 0]} />
                <Bar dataKey="carburant" stackId="a" fill="#C8862E" name="Carburant" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Répartition par catégorie</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {byCategory.map((c, i) => <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-4">
        <select className={selectCls + " w-auto"} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option>Toutes</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={selectCls + " w-auto"} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="Tous">Tous les mois</option>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} text="Aucune dépense ne correspond à ces critères." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 font-medium">Catégorie</th>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
                <th className="text-left px-4 py-2.5 font-medium">Employé / Ville</th>
                <th className="text-right px-4 py-2.5 font-medium">Montant</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const emp = data.employees.find((x) => x.id === e.employeeId);
                return (
                  <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-600">{fmtDate(e.date)}</td>
                    <td className="px-4 py-2.5"><Badge color="#44403c" bg="#f5f5f4">{e.category}</Badge></td>
                    <td className="px-4 py-2.5 text-stone-700">{e.description}</td>
                    <td className="px-4 py-2.5 text-stone-500 text-xs">{emp ? `${emp.firstName} ${emp.lastName}` : ""} {e.city ? `· ${e.city}` : ""}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(e.amount)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(e)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                        <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Nouvelle dépense" : "Modifier la dépense"} onClose={() => setModal(null)}>
          <ExpenseForm initial={modal === "new" ? null : modal} employees={data.employees} onSave={saveExpense} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : CARBURANT & LOGISTIQUE
============================================================ */

function FuelForm({ initial, employees, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      date: todayISO(), employeeId: employees[0]?.id || "", vehicle: "",
      city: CITIES[0], liters: "", pricePerLiter: "", odometer: "",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const total = (Number(form.liters) || 0) * (Number(form.pricePerLiter) || 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          liters: Number(form.liters) || 0,
          pricePerLiter: Number(form.pricePerLiter) || 0,
          odometer: Number(form.odometer) || 0,
          total: Math.round(total),
        });
      }}
    >
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} required /></Field>
        <Field label="Chauffeur">
          <select className={selectCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Véhicule"><input className={inputCls} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="Ex. Dacia Logan - 14589-A-7" required /></Field>
        <Field label="Ville">
          <select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-x-3">
        <Field label="Litres"><input type="number" className={inputCls} value={form.liters} onChange={(e) => set("liters", e.target.value)} required /></Field>
        <Field label="Prix / litre (MAD)"><input type="number" step="0.01" className={inputCls} value={form.pricePerLiter} onChange={(e) => set("pricePerLiter", e.target.value)} required /></Field>
        <Field label="Compteur (km)"><input type="number" className={inputCls} value={form.odometer} onChange={(e) => set("odometer", e.target.value)} /></Field>
      </div>
      <p className="text-sm text-stone-500 mb-3">Total calculé : <span className="font-semibold text-stone-800">{fmtMAD(total)}</span></p>
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function FuelModule({ data, setData }) {
  const [modal, setModal] = useState(null);

  const totalCost = useMemo(() => data.fuelLogs.reduce((s, f) => s + f.total, 0), [data.fuelLogs]);
  const totalLiters = useMemo(() => data.fuelLogs.reduce((s, f) => s + f.liters, 0), [data.fuelLogs]);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  const monthlyTrend = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const total = data.fuelLogs.filter((f) => {
        const fd = new Date(f.date);
        return fd.getMonth() === m && fd.getFullYear() === y;
      }).reduce((s, f) => s + f.total, 0);
      arr.push({ mois: MONTHS[m].slice(0, 3), total });
    }
    return arr;
  }, [data.fuelLogs]);

  const byDriver = useMemo(() => {
    const map = {};
    data.fuelLogs.forEach((f) => {
      const emp = data.employees.find((e) => e.id === f.employeeId);
      const name = emp ? `${emp.firstName} ${emp.lastName}` : "Inconnu";
      map[name] = (map[name] || 0) + f.total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.fuelLogs, data.employees]);

  const drivers = data.employees.filter((e) => e.role === "Chauffeur");

  const saveFuel = (log) => {
    setData((d) => {
      if (log.id) return { ...d, fuelLogs: d.fuelLogs.map((f) => (f.id === log.id ? log : f)) };
      return { ...d, fuelLogs: [...d.fuelLogs, { ...log, id: uid() }] };
    });
    setModal(null);
  };
  const deleteFuel = (id) => setData((d) => ({ ...d, fuelLogs: d.fuelLogs.filter((f) => f.id !== id) }));

  const sortedLogs = [...data.fuelLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <PageHeader
        title="Carburant & logistique"
        subtitle="Journal des pleins de carburant et suivi des tournées"
        action={<Button icon={Plus} onClick={() => setModal("new")}>Nouveau plein</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Coût total carburant" value={fmtMAD(totalCost)} icon={Fuel} accent="#C8862E" />
        <StatCard label="Litres consommés" value={`${fmtNum(totalLiters)} L`} icon={Fuel} accent="#6B4E9E" />
        <StatCard label="Prix moyen / litre" value={`${avgPrice.toFixed(2)} MAD`} icon={Landmark} accent="#4A6E8C" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Tendance mensuelle</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Line type="monotone" dataKey="total" stroke="#C8862E" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Répartition par chauffeur</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={byDriver} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#44403c" }} width={100} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Bar dataKey="value" fill="#C8862E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {sortedLogs.length === 0 ? (
        <EmptyState icon={Fuel} text="Aucun plein enregistré." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 font-medium">Chauffeur</th>
                <th className="text-left px-4 py-2.5 font-medium">Véhicule</th>
                <th className="text-left px-4 py-2.5 font-medium">Ville</th>
                <th className="text-right px-4 py-2.5 font-medium">Litres</th>
                <th className="text-right px-4 py-2.5 font-medium">Prix/L</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((f) => {
                const emp = data.employees.find((e) => e.id === f.employeeId);
                return (
                  <tr key={f.id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-600">{fmtDate(f.date)}</td>
                    <td className="px-4 py-2.5 text-stone-700">{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                    <td className="px-4 py-2.5 text-stone-600 text-xs">{f.vehicle}</td>
                    <td className="px-4 py-2.5 text-stone-600">{f.city}</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{f.liters} L</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{f.pricePerLiter.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(f.total)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(f)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                        <button onClick={() => deleteFuel(f.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Nouveau plein de carburant" : "Modifier le plein"} onClose={() => setModal(null)}>
          <FuelForm initial={modal === "new" ? null : modal} employees={drivers.length ? drivers : data.employees} onSave={saveFuel} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : CLIENTS & FIDÉLITÉ
============================================================ */

function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      contactName: "", shopName: "", phone: "", email: "", city: CITIES[0],
      brands: [], totalSpent: 0, points: 0, joinDate: todayISO(), lastVisit: todayISO(),
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleBrand = (b) => {
    setForm((f) => ({
      ...f,
      brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b],
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Nom du contact"><input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} required /></Field>
        <Field label="Nom de la boutique"><input className={inputCls} value={form.shopName} onChange={(e) => set("shopName", e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Téléphone"><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      </div>
      <Field label="Ville">
        <select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Marques distribuées">
        <div className="flex gap-2 flex-wrap">
          {BRANDS.map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => toggleBrand(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                form.brands.includes(b)
                  ? "border-transparent text-white"
                  : "border-stone-200 text-stone-500 bg-white"
              }`}
              style={form.brands.includes(b) ? { background: BRAND_COLORS[b].main } : {}}
            >
              {b}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function AwardPointsModal({ client, onSave, onCancel }) {
  const [amount, setAmount] = useState("");
  const pointsToAdd = Math.floor((Number(amount) || 0) / 100);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(pointsToAdd, Number(amount) || 0);
      }}
    >
      <p className="text-sm text-stone-500 mb-3">
        Attribuer des points à <strong className="text-stone-800">{client.shopName}</strong> selon le montant dépensé (1 point par tranche de 100 MAD).
      </p>
      <Field label="Montant de l'achat (MAD)">
        <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
      </Field>
      <p className="text-sm text-stone-500 mb-3">Points à attribuer : <span className="font-semibold text-stone-800">{pointsToAdd}</span></p>
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Attribuer</Button>
      </div>
    </form>
  );
}

function ClientsModule({ data, setData }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("Tous");
  const [cityFilter, setCityFilter] = useState("Toutes");
  const [modal, setModal] = useState(null);
  const [awardModal, setAwardModal] = useState(null);

  const filtered = useMemo(() => {
    return data.clients.filter((c) => {
      const tier = getTier(c.points).key;
      const matchesTier = tierFilter === "Tous" || tier === tierFilter;
      const matchesCity = cityFilter === "Toutes" || c.city === cityFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || `${c.contactName} ${c.shopName} ${c.city}`.toLowerCase().includes(q);
      return matchesTier && matchesCity && matchesSearch;
    });
  }, [data.clients, search, tierFilter, cityFilter]);

  const saveClient = (client) => {
    setData((d) => {
      if (client.id) return { ...d, clients: d.clients.map((c) => (c.id === client.id ? client : c)) };
      return { ...d, clients: [...d.clients, { ...client, id: uid() }] };
    });
    setModal(null);
  };

  const deleteClient = (id) => setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));

  const awardPoints = (clientId, pointsToAdd, amount) => {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) =>
        c.id === clientId
          ? { ...c, points: c.points + pointsToAdd, totalSpent: c.totalSpent + amount, lastVisit: todayISO() }
          : c
      ),
    }));
    setAwardModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Clients & fidélité"
        subtitle={`${data.clients.length} opticien(s) partenaire(s)`}
        action={<Button icon={Plus} onClick={() => setModal("new")}>Ajouter un client</Button>}
      />

      <div className="flex flex-wrap gap-2.5 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Boutique, contact, ville..." />
        <select className={selectCls + " w-auto"} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option>Tous</option>
          {LOYALTY_TIERS.map((t) => <option key={t.key}>{t.key}</option>)}
        </select>
        <select className={selectCls + " w-auto"} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option>Toutes</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Heart} text="Aucun client ne correspond à ces critères." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((c) => {
            const tier = getTier(c.points);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{c.shopName}</p>
                    <p className="text-xs text-stone-400">{c.contactName}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ color: tier.color, background: tier.bg }}>
                    {tier.key}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
                  <MapPin size={12} /> {c.city}
                </div>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {c.brands.map((b) => (
                    <Badge key={b} color={BRAND_COLORS[b]?.text} bg={BRAND_COLORS[b]?.light}>{b}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm border-t border-stone-100 pt-2.5">
                  <div>
                    <p className="text-xs text-stone-400">Points</p>
                    <p className="font-semibold text-stone-800">{fmtNum(c.points)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Total dépensé</p>
                    <p className="font-semibold text-stone-800">{fmtMAD(c.totalSpent)}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <Button size="sm" variant="secondary" onClick={() => setAwardModal(c)}>Attribuer points</Button>
                  <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                  <button onClick={() => deleteClient(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Ajouter un client" : "Modifier le client"} onClose={() => setModal(null)}>
          <ClientForm initial={modal === "new" ? null : modal} onSave={saveClient} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {awardModal && (
        <Modal title="Attribuer des points de fidélité" onClose={() => setAwardModal(null)}>
          <AwardPointsModal client={awardModal} onSave={(pts, amt) => awardPoints(awardModal.id, pts, amt)} onCancel={() => setAwardModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : OFFRES & PROMOTIONS
============================================================ */

function OfferForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      title: "", description: "", brand: "Toutes", discount: "",
      startDate: todayISO(), endDate: daysFromNowISO(30), active: true,
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, discount: Number(form.discount) || 0 }); }}>
      <Field label="Titre"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Marque">
          <select className={selectCls} value={form.brand} onChange={(e) => set("brand", e.target.value)}>
            <option>Toutes</option>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Réduction (%)"><input type="number" className={inputCls} value={form.discount} onChange={(e) => set("discount", e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Date de début"><input type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required /></Field>
        <Field label="Date de fin"><input type="date" className={inputCls} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function OffersModule({ data, setData }) {
  const [filter, setFilter] = useState("Toutes");
  const [modal, setModal] = useState(null);

  const isExpired = (o) => new Date(o.endDate) < new Date();

  const filtered = useMemo(() => {
    return data.offers.filter((o) => {
      if (filter === "Actives") return o.active && !isExpired(o);
      if (filter === "Expirées") return isExpired(o);
      return true;
    });
  }, [data.offers, filter]);

  const activeCount = data.offers.filter((o) => o.active && !isExpired(o)).length;
  const expiredCount = data.offers.filter((o) => isExpired(o)).length;
  const avgDiscount = data.offers.length
    ? Math.round(data.offers.reduce((s, o) => s + o.discount, 0) / data.offers.length)
    : 0;

  const saveOffer = (offer) => {
    setData((d) => {
      if (offer.id) return { ...d, offers: d.offers.map((o) => (o.id === offer.id ? offer : o)) };
      return { ...d, offers: [...d.offers, { ...offer, id: uid() }] };
    });
    setModal(null);
  };

  const deleteOffer = (id) => setData((d) => ({ ...d, offers: d.offers.filter((o) => o.id !== id) }));
  const toggleActive = (id) => setData((d) => ({ ...d, offers: d.offers.map((o) => (o.id === id ? { ...o, active: !o.active } : o)) }));

  return (
    <div>
      <PageHeader
        title="Offres & promotions"
        subtitle="Campagnes marketing et remises par marque"
        action={<Button icon={Plus} onClick={() => setModal("new")}>Nouvelle offre</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Offres actives" value={activeCount} icon={CheckCircle2} accent="#3B8C6E" />
        <StatCard label="Offres expirées" value={expiredCount} icon={XCircle} accent="#78716c" />
        <StatCard label="Total campagnes" value={data.offers.length} icon={Tag} accent="#6B4E9E" />
        <StatCard label="Remise moyenne" value={`${avgDiscount}%`} icon={TrendingUp} accent="#C8862E" />
      </div>

      <div className="flex gap-2 mb-5">
        {["Toutes", "Actives", "Expirées"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? "bg-indigo-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Tag} text="Aucune offre ne correspond à ces critères." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((o) => {
            const expired = isExpired(o);
            const brandColor = o.brand === "Toutes" ? { main: "#44403c", light: "#f5f5f4", text: "#44403c" } : BRAND_COLORS[o.brand];
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge color={brandColor.text} bg={brandColor.light}>{o.brand}</Badge>
                  {expired ? (
                    <Badge color="#78716c" bg="#f5f5f4">Expirée</Badge>
                  ) : o.active ? (
                    <Badge color="#15803d" bg="#ecfdf5">Active</Badge>
                  ) : (
                    <Badge color="#b45309" bg="#fffbeb">En pause</Badge>
                  )}
                </div>
                <p className="font-semibold text-stone-900 text-sm mb-1">{o.title}</p>
                <p className="text-xs text-stone-500 mb-3 line-clamp-2">{o.description}</p>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-2xl font-bold text-indigo-700">-{o.discount}%</span>
                  <span className="text-xs text-stone-400">{fmtDate(o.startDate)} → {fmtDate(o.endDate)}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(o.id)}>
                    {o.active ? "Désactiver" : "Activer"}
                  </Button>
                  <button onClick={() => setModal(o)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                  <button onClick={() => deleteOffer(o.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Nouvelle offre" : "Modifier l'offre"} onClose={() => setModal(null)}>
          <OfferForm initial={modal === "new" ? null : modal} onSave={saveOffer} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : STOCK
============================================================ */

function StockForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      sku: "", brand: BRANDS[0], model: "", color: "", quantity: "",
      minQuantity: "", costPrice: "", sellPrice: "", city: CITIES[0],
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          quantity: Number(form.quantity) || 0,
          minQuantity: Number(form.minQuantity) || 0,
          costPrice: Number(form.costPrice) || 0,
          sellPrice: Number(form.sellPrice) || 0,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="SKU"><input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ELG-01A-NOI" required /></Field>
        <Field label="Marque">
          <select className={selectCls} value={form.brand} onChange={(e) => set("brand", e.target.value)}>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Modèle"><input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} required /></Field>
        <Field label="Couleur"><input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Quantité en stock"><input type="number" className={inputCls} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} required /></Field>
        <Field label="Seuil d'alerte"><input type="number" className={inputCls} value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Prix coûtant (MAD)"><input type="number" className={inputCls} value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} required /></Field>
        <Field label="Prix de vente (MAD)"><input type="number" className={inputCls} value={form.sellPrice} onChange={(e) => set("sellPrice", e.target.value)} required /></Field>
      </div>
      <Field label="Ville de stockage">
        <select className={selectCls} value={form.city} onChange={(e) => set("city", e.target.value)}>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function StockModule({ data, setData }) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("Toutes");
  const [cityFilter, setCityFilter] = useState("Toutes");
  const [modal, setModal] = useState(null);

  const lowStock = useMemo(() => data.stock.filter((s) => s.quantity <= s.minQuantity), [data.stock]);
  const totalValue = useMemo(() => data.stock.reduce((s, x) => s + x.quantity * x.costPrice, 0), [data.stock]);

  const filtered = useMemo(() => {
    return data.stock.filter((s) => {
      const matchesBrand = brandFilter === "Toutes" || s.brand === brandFilter;
      const matchesCity = cityFilter === "Toutes" || s.city === cityFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || `${s.sku} ${s.model} ${s.color}`.toLowerCase().includes(q);
      return matchesBrand && matchesCity && matchesSearch;
    });
  }, [data.stock, search, brandFilter, cityFilter]);

  const saveItem = (item) => {
    setData((d) => {
      if (item.id) return { ...d, stock: d.stock.map((s) => (s.id === item.id ? item : s)) };
      return { ...d, stock: [...d.stock, { ...item, id: uid() }] };
    });
    setModal(null);
  };
  const deleteItem = (id) => setData((d) => ({ ...d, stock: d.stock.filter((s) => s.id !== id) }));

  return (
    <div>
      <PageHeader
        title="Gestion de stock"
        subtitle={`${data.stock.length} référence(s) — valeur totale ${fmtMAD(totalValue)}`}
        action={<Button icon={Plus} onClick={() => setModal("new")}>Ajouter une référence</Button>}
      />

      {lowStock.length > 0 && (
        <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-rose-700 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>{lowStock.length}</strong> référence(s) en stock bas : {lowStock.slice(0, 5).map((s) => s.sku).join(", ")}
            {lowStock.length > 5 && "…"}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="SKU, modèle, couleur..." />
        <select className={selectCls + " w-auto"} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option>Toutes</option>
          {BRANDS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className={selectCls + " w-auto"} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option>Toutes</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text="Aucune référence ne correspond à ces critères." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">SKU</th>
                <th className="text-left px-4 py-2.5 font-medium">Marque</th>
                <th className="text-left px-4 py-2.5 font-medium">Modèle / Couleur</th>
                <th className="text-left px-4 py-2.5 font-medium">Ville</th>
                <th className="text-right px-4 py-2.5 font-medium">Qté</th>
                <th className="text-right px-4 py-2.5 font-medium">Prix vente</th>
                <th className="text-right px-4 py-2.5 font-medium">Marge</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const margin = s.costPrice > 0 ? Math.round(((s.sellPrice - s.costPrice) / s.costPrice) * 100) : 0;
                const low = s.quantity <= s.minQuantity;
                return (
                  <tr key={s.id} className={`border-t border-stone-100 hover:bg-stone-50 ${low ? "bg-rose-50/40" : ""}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{s.sku}</td>
                    <td className="px-4 py-2.5">
                      <Badge color={BRAND_COLORS[s.brand]?.text} bg={BRAND_COLORS[s.brand]?.light}>{s.brand}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-stone-700">{s.model} <span className="text-stone-400">· {s.color}</span></td>
                    <td className="px-4 py-2.5 text-stone-600">{s.city}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={low ? "text-rose-600 font-semibold" : "text-stone-700"}>{s.quantity}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-stone-700">{fmtMAD(s.sellPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">{margin}%</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(s)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                        <button onClick={() => deleteItem(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Ajouter une référence" : "Modifier la référence"} onClose={() => setModal(null)}>
          <StockForm initial={modal === "new" ? null : modal} onSave={saveItem} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : VENTES
============================================================ */

function SaleForm({ clients, employees, stock, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: todayISO(), clientId: clients[0]?.id || "", employeeId: employees[0]?.id || "",
    stockId: stock[0]?.id || "", quantity: 1,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedItem = stock.find((s) => s.id === form.stockId);
  const client = clients.find((c) => c.id === form.clientId);
  const total = (selectedItem?.sellPrice || 0) * (Number(form.quantity) || 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!selectedItem) return;
        onSave({
          date: form.date,
          clientId: form.clientId,
          employeeId: form.employeeId,
          brand: selectedItem.brand,
          stockId: selectedItem.id,
          sku: selectedItem.sku,
          quantity: Number(form.quantity) || 1,
          unitPrice: selectedItem.sellPrice,
          total: Math.round(total),
          city: client?.city || selectedItem.city,
        });
      }}
    >
      <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} required /></Field>
      <Field label="Client (opticien)">
        <select className={selectCls} value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.shopName} — {c.city}</option>)}
        </select>
      </Field>
      <Field label="Commercial">
        <select className={selectCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </Field>
      <Field label="Article (SKU)">
        <select className={selectCls} value={form.stockId} onChange={(e) => set("stockId", e.target.value)}>
          {stock.map((s) => (
            <option key={s.id} value={s.id}>{s.sku} — {s.model} {s.color} ({fmtMAD(s.sellPrice)})</option>
          ))}
        </select>
      </Field>
      <Field label="Quantité">
        <input type="number" min={1} className={inputCls} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} required />
      </Field>
      <p className="text-sm text-stone-500 mb-3">Total calculé : <span className="font-semibold text-stone-800">{fmtMAD(total)}</span></p>
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer la vente</Button>
      </div>
    </form>
  );
}

function SalesModule({ data, setData }) {
  const [modal, setModal] = useState(null);

  const sortedSales = useMemo(() => [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date)), [data.sales]);
  const total = useMemo(() => data.sales.reduce((s, x) => s + x.total, 0), [data.sales]);
  const avg = data.sales.length ? total / data.sales.length : 0;
  const brandsUsed = new Set(data.sales.map((s) => s.brand)).size;

  const saveSale = (sale) => {
    setData((d) => ({
      ...d,
      sales: [{ ...sale, id: uid() }, ...d.sales],
      clients: d.clients.map((c) =>
        c.id === sale.clientId
          ? { ...c, totalSpent: c.totalSpent + sale.total, points: c.points + Math.floor(sale.total / 100), lastVisit: sale.date }
          : c
      ),
      stock: d.stock.map((s) => (s.id === sale.stockId ? { ...s, quantity: Math.max(0, s.quantity - sale.quantity) } : s)),
    }));
    setModal(null);
  };

  const deleteSale = (id) => setData((d) => ({ ...d, sales: d.sales.filter((s) => s.id !== id) }));

  return (
    <div>
      <PageHeader
        title="Ventes"
        subtitle="Historique des transactions B2B avec les opticiens"
        action={<Button icon={Plus} onClick={() => setModal("new")}>Nouvelle vente</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Chiffre d'affaires total" value={fmtMAD(total)} icon={TrendingUp} accent="#3B8C6E" />
        <StatCard label="Transactions" value={fmtNum(data.sales.length)} icon={Receipt} accent="#6B4E9E" />
        <StatCard label="Panier moyen" value={fmtMAD(avg)} icon={Wallet} accent="#4A6E8C" />
        <StatCard label="Marques vendues" value={brandsUsed} icon={Tag} accent="#C8862E" />
      </div>

      {sortedSales.length === 0 ? (
        <EmptyState icon={Receipt} text="Aucune vente enregistrée." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 font-medium">Client</th>
                <th className="text-left px-4 py-2.5 font-medium">Commercial</th>
                <th className="text-left px-4 py-2.5 font-medium">Article</th>
                <th className="text-right px-4 py-2.5 font-medium">Qté</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sortedSales.slice(0, 100).map((s) => {
                const client = data.clients.find((c) => c.id === s.clientId);
                const emp = data.employees.find((e) => e.id === s.employeeId);
                return (
                  <tr key={s.id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-600">{fmtDate(s.date)}</td>
                    <td className="px-4 py-2.5 text-stone-700">{client?.shopName || "—"}</td>
                    <td className="px-4 py-2.5 text-stone-600">{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-stone-500">{s.sku}</span>
                      <Badge color={BRAND_COLORS[s.brand]?.text} bg={BRAND_COLORS[s.brand]?.light}>{s.brand}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{s.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(s.total)}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => deleteSale(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 ml-auto block"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedSales.length > 100 && (
            <p className="text-xs text-stone-400 text-center py-3">Affichage des 100 ventes les plus récentes sur {sortedSales.length}.</p>
          )}
        </div>
      )}

      {modal && (
        <Modal title="Nouvelle vente" onClose={() => setModal(null)} wide>
          <SaleForm clients={data.clients} employees={data.employees} stock={data.stock} onSave={saveSale} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : CHÈQUES (REÇUS & ÉMIS)
============================================================ */

function ChequeForm({ initial, clients, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      direction: "Reçu", number: "", bank: CHEQUE_BANKS[0], amount: "",
      issueDate: todayISO(), dueDate: todayISO(), status: "En attente",
      clientId: clients[0]?.id || "", payee: "", note: "",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const statusOptions = form.direction === "Reçu" ? CHEQUE_STATUSES_RECU : CHEQUE_STATUSES_EMIS;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          amount: Number(form.amount) || 0,
          clientId: form.direction === "Reçu" ? form.clientId : null,
          payee: form.direction === "Émis" ? form.payee : null,
        });
      }}
    >
      <Field label="Sens du chèque">
        <div className="flex gap-2">
          {["Reçu", "Émis"].map((dir) => (
            <button
              type="button"
              key={dir}
              onClick={() => {
                set("direction", dir);
                set("status", dir === "Reçu" ? CHEQUE_STATUSES_RECU[0] : CHEQUE_STATUSES_EMIS[0]);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                form.direction === dir ? "bg-indigo-700 text-white border-transparent" : "border-stone-200 text-stone-600 bg-white"
              }`}
            >
              {dir === "Reçu" ? "Reçu d'un client" : "Émis par nous"}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Numéro de chèque"><input className={inputCls} value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="CHQ123456" required /></Field>
        <Field label="Banque">
          <select className={selectCls} value={form.bank} onChange={(e) => set("bank", e.target.value)}>
            {CHEQUE_BANKS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
      </div>

      {form.direction === "Reçu" ? (
        <Field label="Client (opticien)">
          <select className={selectCls} value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.shopName} — {c.city}</option>)}
          </select>
        </Field>
      ) : (
        <Field label="Bénéficiaire (payé à)">
          <input className={inputCls} value={form.payee} onChange={(e) => set("payee", e.target.value)} placeholder="Ex. Fournisseur Optic Import" required />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Montant (MAD)"><input type="number" className={inputCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} required /></Field>
        <Field label="Statut">
          <select className={selectCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {statusOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Date d'émission"><input type="date" className={inputCls} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} required /></Field>
        <Field label="Date d'échéance"><input type="date" className={inputCls} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} required /></Field>
      </div>

      <Field label="Note (optionnel)"><input className={inputCls} value={form.note} onChange={(e) => set("note", e.target.value)} /></Field>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function ChequeStatusBadge({ status }) {
  const map = {
    "En attente": { color: "#b45309", bg: "#fffbeb", icon: Clock },
    "Encaissé": { color: "#15803d", bg: "#ecfdf5", icon: CheckCircle2 },
    "Débité": { color: "#15803d", bg: "#ecfdf5", icon: CheckCircle2 },
    "Rejeté": { color: "#b91c1c", bg: "#fef2f2", icon: XCircle },
    "Annulé": { color: "#78716c", bg: "#f5f5f4", icon: XCircle },
  };
  const cfg = map[status] || map["En attente"];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, background: cfg.bg }}>
      <Icon size={11} /> {status}
    </span>
  );
}

function ChequesModule({ data, setData }) {
  const [directionFilter, setDirectionFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const isPending = (c) => c.status === "En attente";
  const isOverdue = (c) => isPending(c) && new Date(c.dueDate) < new Date();
  const isUpcoming = (c) => {
    if (!isPending(c)) return false;
    const diff = (new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const received = data.cheques.filter((c) => c.direction === "Reçu");
  const issued = data.cheques.filter((c) => c.direction === "Émis");

  const totalReceivedPending = received.filter(isPending).reduce((s, c) => s + c.amount, 0);
  const totalIssuedPending = issued.filter(isPending).reduce((s, c) => s + c.amount, 0);
  const overdueCount = data.cheques.filter(isOverdue).length;
  const upcomingCount = data.cheques.filter(isUpcoming).length;

  const filtered = useMemo(() => {
    return data.cheques.filter((c) => {
      const matchesDir = directionFilter === "Tous" || c.direction === directionFilter;
      const matchesStatus = statusFilter === "Tous" || c.status === statusFilter;
      const q = search.toLowerCase();
      const client = data.clients.find((cl) => cl.id === c.clientId);
      const matchesSearch = !q || `${c.number} ${c.bank} ${client?.shopName || c.payee || ""}`.toLowerCase().includes(q);
      return matchesDir && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  }, [data.cheques, data.clients, directionFilter, statusFilter, search]);

  const saveCheque = (cheque) => {
    setData((d) => {
      if (cheque.id) return { ...d, cheques: d.cheques.map((c) => (c.id === cheque.id ? cheque : c)) };
      return { ...d, cheques: [{ ...cheque, id: uid() }, ...d.cheques] };
    });
    setModal(null);
  };

  const deleteCheque = (id) => setData((d) => ({ ...d, cheques: d.cheques.filter((c) => c.id !== id) }));

  const setStatus = (id, status) => setData((d) => ({ ...d, cheques: d.cheques.map((c) => (c.id === id ? { ...c, status } : c)) }));

  const allStatuses = ["En attente", "Encaissé", "Débité", "Rejeté", "Annulé"];

  return (
    <div>
      <PageHeader
        title="Chèques"
        subtitle="Suivi des chèques reçus des opticiens et émis par l'entreprise"
        action={<Button icon={Plus} onClick={() => setModal("new")}>Nouveau chèque</Button>}
      />

      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className="mb-5 grid sm:grid-cols-2 gap-3">
          {overdueCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-rose-700 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span><strong>{overdueCount}</strong> chèque(s) en attente avec échéance dépassée.</span>
            </div>
          )}
          {upcomingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-amber-800 text-sm">
              <Clock size={16} className="shrink-0" />
              <span><strong>{upcomingCount}</strong> chèque(s) à échéance dans les 7 jours.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Reçus en attente" value={fmtMAD(totalReceivedPending)} icon={Landmark} accent="#3B8C6E" sub={`${received.filter(isPending).length} chèque(s)`} />
        <StatCard label="Émis en attente" value={fmtMAD(totalIssuedPending)} icon={Landmark} accent="#B23A55" sub={`${issued.filter(isPending).length} chèque(s)`} />
        <StatCard label="En retard" value={overdueCount} icon={AlertTriangle} accent="#C8862E" />
        <StatCard label="Échéance ≤ 7 jours" value={upcomingCount} icon={Clock} accent="#6B4E9E" />
      </div>

      <div className="flex flex-wrap gap-2.5 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="N° chèque, banque, client..." />
        <select className={selectCls + " w-auto"} value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
          <option value="Tous">Reçus et émis</option>
          <option value="Reçu">Reçus uniquement</option>
          <option value="Émis">Émis uniquement</option>
        </select>
        <select className={selectCls + " w-auto"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="Tous">Tous les statuts</option>
          {allStatuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Landmark} text="Aucun chèque ne correspond à ces critères." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Sens</th>
                <th className="text-left px-4 py-2.5 font-medium">N° chèque</th>
                <th className="text-left px-4 py-2.5 font-medium">Banque</th>
                <th className="text-left px-4 py-2.5 font-medium">Client / Bénéficiaire</th>
                <th className="text-left px-4 py-2.5 font-medium">Échéance</th>
                <th className="text-right px-4 py-2.5 font-medium">Montant</th>
                <th className="text-center px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const client = data.clients.find((cl) => cl.id === c.clientId);
                const overdue = isOverdue(c);
                return (
                  <tr key={c.id} className={`border-t border-stone-100 hover:bg-stone-50 ${overdue ? "bg-rose-50/40" : ""}`}>
                    <td className="px-4 py-2.5">
                      <Badge color={c.direction === "Reçu" ? "#15803d" : "#7d2839"} bg={c.direction === "Reçu" ? "#ecfdf5" : "#fae6ea"}>
                        {c.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{c.number}</td>
                    <td className="px-4 py-2.5 text-stone-600">{c.bank}</td>
                    <td className="px-4 py-2.5 text-stone-700">{c.direction === "Reçu" ? (client?.shopName || "—") : c.payee}</td>
                    <td className="px-4 py-2.5">
                      <span className={overdue ? "text-rose-600 font-medium" : "text-stone-600"}>{fmtDate(c.dueDate)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(c.amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <select
                        value={c.status}
                        onChange={(e) => setStatus(c.id, e.target.value)}
                        className="text-xs rounded-lg border border-stone-200 px-1.5 py-1 bg-white focus:outline-none"
                      >
                        {(c.direction === "Reçu" ? CHEQUE_STATUSES_RECU : CHEQUE_STATUSES_EMIS).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                        <button onClick={() => deleteCheque(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Nouveau chèque" : "Modifier le chèque"} onClose={() => setModal(null)} wide>
          <ChequeForm initial={modal === "new" ? null : modal} clients={data.clients} onSave={saveCheque} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   MODULE : SUIVI FINANCIER
============================================================ */

function FinanceModule({ data }) {
  const [period, setPeriod] = useState("Annuel"); // "Mensuel" | "Annuel"
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [employeeFilter, setEmployeeFilter] = useState("Tous");

  const years = useMemo(() => {
    const set = new Set(data.sales.map((s) => new Date(s.date).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [data.sales]);

  const inPeriod = (dateStr) => {
    const d = new Date(dateStr);
    if (period === "Mensuel") return d.getFullYear() === year && d.getMonth() === month;
    return d.getFullYear() === year;
  };

  const filteredSales = useMemo(() => data.sales.filter((s) => inPeriod(s.date) && (employeeFilter === "Tous" || s.employeeId === employeeFilter)), [data.sales, period, year, month, employeeFilter]);
  const filteredExpenses = useMemo(() => data.expenses.filter((e) => inPeriod(e.date) && (employeeFilter === "Tous" || e.employeeId === employeeFilter)), [data.expenses, period, year, month, employeeFilter]);
  const filteredFuel = useMemo(() => data.fuelLogs.filter((f) => inPeriod(f.date) && (employeeFilter === "Tous" || f.employeeId === employeeFilter)), [data.fuelLogs, period, year, month, employeeFilter]);

  const revenue = filteredSales.reduce((s, x) => s + x.total, 0);
  const expensesTotal = filteredExpenses.filter((e) => e.category !== "Carburant").reduce((s, x) => s + x.amount, 0);
  const fuelTotal = filteredFuel.reduce((s, x) => s + x.total, 0);
  const netProfit = revenue - expensesTotal - fuelTotal;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const monthlyBreakdown = useMemo(() => {
    return MONTHS.map((m, idx) => {
      const sales = data.sales.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === idx && (employeeFilter === "Tous" || s.employeeId === employeeFilter);
      });
      const exps = data.expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === idx && e.category !== "Carburant" && (employeeFilter === "Tous" || e.employeeId === employeeFilter);
      });
      const fuels = data.fuelLogs.filter((f) => {
        const d = new Date(f.date);
        return d.getFullYear() === year && d.getMonth() === idx && (employeeFilter === "Tous" || f.employeeId === employeeFilter);
      });
      const rev = sales.reduce((s, x) => s + x.total, 0);
      const exp = exps.reduce((s, x) => s + x.amount, 0);
      const fuel = fuels.reduce((s, x) => s + x.total, 0);
      return { mois: m.slice(0, 3), revenu: rev, depenses: exp, carburant: fuel, profit: rev - exp - fuel };
    });
  }, [data, year, employeeFilter]);

  const employeePerf = useMemo(() => {
    return data.employees.map((emp) => {
      const sales = data.sales.filter((s) => s.employeeId === emp.id && inPeriod(s.date));
      const exps = data.expenses.filter((e) => e.employeeId === emp.id && e.category !== "Carburant" && inPeriod(e.date));
      const fuels = data.fuelLogs.filter((f) => f.employeeId === emp.id && inPeriod(f.date));
      const rev = sales.reduce((s, x) => s + x.total, 0);
      const exp = exps.reduce((s, x) => s + x.amount, 0);
      const fuel = fuels.reduce((s, x) => s + x.total, 0);
      const profit = rev - exp - fuel;
      return {
        id: emp.id, name: `${emp.firstName} ${emp.lastName}`, city: emp.city,
        sales: sales.length, revenue: rev, expenses: exp, fuel, profit,
        margin: rev > 0 ? (profit / rev) * 100 : 0,
      };
    })
    .filter((e) => e.sales > 0 || e.expenses > 0 || e.fuel > 0)
    .sort((a, b) => b.revenue - a.revenue);
  }, [data, period, year, month]);

  return (
    <div>
      <PageHeader title="Suivi financier" subtitle="Analyse par employé, par mois et par année" />

      <div className="flex flex-wrap gap-2.5 mb-5">
        <div className="flex rounded-lg border border-stone-200 overflow-hidden">
          {["Mensuel", "Annuel"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-sm font-medium ${period === p ? "bg-indigo-700 text-white" : "bg-white text-stone-600 hover:bg-stone-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <select className={selectCls + " w-auto"} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {period === "Mensuel" && (
          <select className={selectCls + " w-auto"} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        )}
        <select className={selectCls + " w-auto"} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="Tous">Tous les employés</option>
          {data.employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Revenu" value={fmtMAD(revenue)} icon={TrendingUp} accent="#3B8C6E" />
        <StatCard label="Dépenses" value={fmtMAD(expensesTotal)} icon={Wallet} accent="#B23A55" />
        <StatCard label="Carburant" value={fmtMAD(fuelTotal)} icon={Fuel} accent="#C8862E" />
        <StatCard label="Bénéfice net" value={fmtMAD(netProfit)} icon={Landmark} accent="#6B4E9E" />
        <StatCard label="Marge" value={`${margin.toFixed(1)}%`} icon={TrendingUp} accent="#4A6E8C" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Comparatif mensuel — {year}</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenu" fill="#3B8C6E" name="Revenu" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depenses" fill="#B23A55" name="Dépenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="carburant" fill="#C8862E" name="Carburant" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-700 mb-3">Évolution du profit — {year}</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMAD(v)} />
                <Line type="monotone" dataKey="profit" stroke="#6B4E9E" strokeWidth={2.5} dot={{ r: 3 }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-stone-700 mb-3">Performance par employé — {period === "Mensuel" ? `${MONTHS[month]} ${year}` : year}</p>
      {employeePerf.length === 0 ? (
        <EmptyState icon={TrendingUp} text="Aucune donnée pour cette période." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Rang</th>
                <th className="text-left px-4 py-2.5 font-medium">Employé</th>
                <th className="text-right px-4 py-2.5 font-medium">Ventes</th>
                <th className="text-right px-4 py-2.5 font-medium">Revenu</th>
                <th className="text-right px-4 py-2.5 font-medium">Dépenses</th>
                <th className="text-right px-4 py-2.5 font-medium">Carburant</th>
                <th className="text-right px-4 py-2.5 font-medium">Profit</th>
                <th className="text-right px-4 py-2.5 font-medium">Marge</th>
              </tr>
            </thead>
            <tbody>
              {employeePerf.map((e, i) => (
                <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-2.5 text-stone-500">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-800">{e.name}</p>
                    <p className="text-xs text-stone-400">{e.city}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-600">{e.sales}</td>
                  <td className="px-4 py-2.5 text-right text-stone-700">{fmtMAD(e.revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">{fmtMAD(e.expenses)}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">{fmtMAD(e.fuel)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-stone-800">{fmtMAD(e.profit)}</td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: e.margin >= 0 ? "#15803d" : "#b91c1c" }}>
                    {e.margin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APPLICATION PRINCIPALE
============================================================ */

/* ============================================================
   ÉCRAN DE CONNEXION
============================================================ */

function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    onLoggedIn(data.session);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
            DE
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm leading-tight">Distropty Eyewear</p>
            <p className="text-xs text-stone-400">Connexion à votre espace</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Mot de passe">
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-800 disabled:opacity-60">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   APPLICATION PRINCIPALE
============================================================ */

function MainApp() {
  const [data, setData, reload, loading, error] = useStore();
  const [active, setActive] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Se déconnecter ?")) {
      await supabase.auth.signOut();
    }
  };

  const activeLabel = NAV_ITEMS.find((n) => n.key === active)?.label || "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 text-sm">Chargement des données…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-700 text-sm">
          <p className="font-medium mb-1">Erreur de connexion à la base de données</p>
          <p>{error}</p>
          <button onClick={reload} className="mt-3 text-rose-700 underline">Réessayer</button>
        </div>
      </div>
    );
  }

  let content;
  switch (active) {
    case "dashboard": content = <DashboardModule data={data} />; break;
    case "employees": content = <EmployeesModule data={data} setData={setData} />; break;
    case "expenses": content = <ExpensesModule data={data} setData={setData} />; break;
    case "fuel": content = <FuelModule data={data} setData={setData} />; break;
    case "clients": content = <ClientsModule data={data} setData={setData} />; break;
    case "offers": content = <OffersModule data={data} setData={setData} />; break;
    case "stock": content = <StockModule data={data} setData={setData} />; break;
    case "sales": content = <SalesModule data={data} setData={setData} />; break;
    case "cheques": content = <ChequesModule data={data} setData={setData} />; break;
    case "finance": content = <FinanceModule data={data} />; break;
    default: content = null;
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar active={active} onNavigate={setActive} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onReset={handleLogout} resetLabel="Se déconnecter" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={activeLabel} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{content}</main>
      </div>
    </div>
  );
}

export default function DistroptyApp() {
  const [session, setSession] = useState(undefined); // undefined = en cours de vérification

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 text-sm">Vérification de la connexion…</p>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLoggedIn={setSession} />;
  }

  return <MainApp />;
}
