/* ============================================================
   Datos mock para mockups — clientes, productos, etc.
   Paraguay: RUCs, Gs., ciudades, nombres reales.
   ============================================================ */

window.MOCK = window.MOCK || {};

window.MOCK.clientes = [
  { cod: "CLI-00001", ruc: "80012345-6", razon: "Lomiteria Tres Hermanos S.A.",      fantasia: "Tres Hermanos",        tipo: "Jurídica",  ciudad: "Asunción",       tel: "0981-123-456", email: "ventas@treshermanos.com.py",    limite: 5000000,  saldo: 1850000,  estado: "activo"   },
  { cod: "CLI-00002", ruc: "3456789-1",  razon: "Patricia Rojas de Mendoza",          fantasia: "Patricia Rojas",       tipo: "Física",    ciudad: "San Lorenzo",    tel: "0971-554-221", email: "patri.rojas@gmail.com",         limite: 1500000,  saldo: 0,        estado: "activo"   },
  { cod: "CLI-00003", ruc: "80054321-8", razon: "Pizzeria Don Vito SRL",              fantasia: "Don Vito",             tipo: "Jurídica",  ciudad: "Asunción",       tel: "021-604-800",  email: "admin@donvito.com.py",          limite: 8000000,  saldo: 3420000,  estado: "vip"      },
  { cod: "CLI-00004", ruc: "4567890-2",  razon: "Carlos Benítez Ojeda",               fantasia: "",                     tipo: "Física",    ciudad: "Lambaré",        tel: "0985-110-998", email: "carlos.benitez@hotmail.com",    limite: 800000,   saldo: 650000,   estado: "mora"     },
  { cod: "CLI-00005", ruc: "80098765-4", razon: "Supermercado La Familia SRL",        fantasia: "La Familia",           tipo: "Jurídica",  ciudad: "Luque",          tel: "0982-445-667", email: "compras@lafamilia.com.py",      limite: 12000000, saldo: 4780000,  estado: "activo"   },
  { cod: "CLI-00006", ruc: "5678901-3",  razon: "Maria Cristina Ayala Villalba",      fantasia: "",                     tipo: "Física",    ciudad: "Fernando de la Mora", tel: "0972-889-001", email: "mcayala@gmail.com",          limite: 500000,   saldo: 120000,   estado: "nuevo"    },
  { cod: "CLI-00007", ruc: "80011122-3", razon: "Ferreteria El Constructor S.A.",     fantasia: "El Constructor",       tipo: "Jurídica",  ciudad: "Ciudad del Este",tel: "061-500-123",  email: "ventas@elconstructor.com.py",   limite: 20000000, saldo: 8950000,  estado: "activo"   },
  { cod: "CLI-00008", ruc: "6789012-4",  razon: "Jorge Daniel Cáceres",               fantasia: "Kiosco Jorge",         tipo: "Física",    ciudad: "Asunción",       tel: "0981-776-554", email: "jd.caceres@yahoo.com",          limite: 400000,   saldo: 0,        estado: "activo"   },
  { cod: "CLI-00009", ruc: "80033445-2", razon: "Clínica Santa Lucia SRL",            fantasia: "Clínica Santa Lucia",  tipo: "Jurídica",  ciudad: "Encarnación",    tel: "071-205-400",  email: "admin@clinicasantalucia.com.py",limite: 15000000, saldo: 2130000,  estado: "activo"   },
  { cod: "CLI-00010", ruc: "7890123-5",  razon: "Laura Espínola Franco",              fantasia: "Boutique Laura",       tipo: "Física",    ciudad: "San Lorenzo",    tel: "0971-334-112", email: "laura.espinola@gmail.com",      limite: 2000000,  saldo: 780000,   estado: "activo"   },
  { cod: "CLI-00011", ruc: "80077889-0", razon: "Panaderia Mi Pueblo S.A.",           fantasia: "Mi Pueblo",            tipo: "Jurídica",  ciudad: "Capiatá",        tel: "0228-630-115", email: "compras@mipueblo.com.py",       limite: 3500000,  saldo: 910000,   estado: "activo"   },
  { cod: "CLI-00012", ruc: "8901234-6",  razon: "Roberto Ariel Giménez",              fantasia: "",                     tipo: "Física",    ciudad: "Villa Elisa",    tel: "0985-221-330", email: "robert.gimenez@gmail.com",      limite: 600000,   saldo: 600000,   estado: "mora"     },
  { cod: "CLI-00013", ruc: "80099001-7", razon: "Autoservicio El Vecino SRL",         fantasia: "El Vecino",            tipo: "Jurídica",  ciudad: "Lambaré",        tel: "021-907-200",  email: "elvecino.srl@gmail.com",        limite: 6000000,  saldo: 2150000,  estado: "activo"   },
  { cod: "CLI-00014", ruc: "9012345-7",  razon: "Fernando Javier Martínez Ozuna",     fantasia: "Taller Fernando",      tipo: "Física",    ciudad: "Asunción",       tel: "0981-441-112", email: "ferj.martinez@outlook.com",     limite: 1200000,  saldo: 450000,   estado: "activo"   },
  { cod: "CLI-00015", ruc: "80044556-1", razon: "Gastronomica Sabor Casero S.A.",     fantasia: "Sabor Casero",         tipo: "Jurídica",  ciudad: "Asunción",       tel: "021-332-884",  email: "pedidos@saborcasero.com.py",    limite: 4500000,  saldo: 1670000,  estado: "vip"      },
  { cod: "CLI-00016", ruc: "1234567-8",  razon: "Juana Isabel Ramírez",               fantasia: "",                     tipo: "Física",    ciudad: "Itauguá",        tel: "0294-220-118", email: "juanaramirez@hotmail.com",      limite: 300000,   saldo: 0,        estado: "inactivo" },
  { cod: "CLI-00017", ruc: "80022233-4", razon: "Farmacia San Rafael SRL",            fantasia: "Farmacia San Rafael",  tipo: "Jurídica",  ciudad: "Asunción",       tel: "021-490-110",  email: "admin@farmaciasanrafael.com.py",limite: 7000000,  saldo: 3340000,  estado: "activo"   },
  { cod: "CLI-00018", ruc: "2345678-9",  razon: "Sergio Ramón Domínguez",             fantasia: "Distribuidora Sergio", tipo: "Física",    ciudad: "Pedro Juan Caballero", tel: "0336-270-445", email: "sergiodom@gmail.com",    limite: 2500000,  saldo: 1100000,  estado: "activo"   },
  { cod: "CLI-00019", ruc: "80055667-9", razon: "Cyber Tigo Fast SRL",                fantasia: "Tigo Fast",            tipo: "Jurídica",  ciudad: "Ciudad del Este",tel: "061-510-998",  email: "tigofast.cde@gmail.com",        limite: 1800000,  saldo: 420000,   estado: "nuevo"    },
  { cod: "CLI-00020", ruc: "3456789-0",  razon: "Andrea Gabriela López Vera",         fantasia: "Peluqueria Andrea",    tipo: "Física",    ciudad: "Luque",          tel: "0985-009-771", email: "andrea.lopez@gmail.com",        limite: 450000,   saldo: 150000,   estado: "activo"   }
];

/* Formateo utilitario paraguayo */
window.MOCK.fmt = {
  gs(n) {
    if (n === null || n === undefined) return "";
    const s = Number(n).toLocaleString("es-PY", { maximumFractionDigits: 0 });
    return "Gs. " + s;
  },
  rucEmpresa(r) { return r || ""; },
  truncate(s, n) { if (!s) return ""; return s.length > n ? s.slice(0, n - 1) + "…" : s; }
};
