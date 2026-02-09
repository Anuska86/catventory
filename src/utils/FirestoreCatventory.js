// seedFirestore.js
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { readFile } = require("fs/promises");
const path = require("path");

const jsonPath = path.resolve(
    __dirname,
    "../../../TradeFlow/serviceAccountKey.json"
);

// --- UTILIDADES ---

// Genera un ID aleatorio corto
function generateUUID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Devuelve un elemento aleatorio de un array
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/*
// Genera una fecha aleatoria dentro de los últimos 180 días
function getRandomPastDate(days) {
    const now = new Date();
    const randomOffset = Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
    return new Date(now.getTime() - randomOffset);
}
*/


// Generate a specific date for February or March 2026
function getRandomTargetDate() {
    //Months JS: 0=Ene, 1=Feb, 2=Mar...
    const start = new Date(2026, 1, 1).getTime(); // 1 Feb 2026
    const end = new Date(2026, 2, 31).getTime();  // 31 Mar 2026
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
}

// 💥 FUNCIONES PARA BORRAR COLECCIONES EN LOTES 💥

/**
 * Borra todos los documentos de una colección en lotes de 500.
 * @param {admin.firestore.Firestore} db La instancia de Firestore.
 * @param {string} collectionPath El nombre de la colección a borrar.
 * @param {number} batchSize El tamaño del lote de borrado (máx. 500).
 */
async function clearCollection(db, collectionPath, batchSize = 500) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    // Recursividad para asegurarse de que se borran todos los lotes
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}
// ---------------------------------------------


// --- CONFIGURACIÓN DE CANTIDADES Y DATOS BASE ---

const SEED_CONFIG = {
    SUPPLIERS: 16,
    PRODUCTS: 11, // Multiplicado por 4 (300 * 4 = 1200)
    WAREHOUSES: 8,
    CLIENTS: 5,
    STOCKS_PER_PRODUCT: 2,
    ORDERS: 60,
    BATCH_SIZE: 450, // Límite de Firestore es 500
};

const BASE_DATA = {
    CITIES: ["Berlin", "Paris", "Rome", "Madrid", "Warsaw", "Amsterdam", "Brussels", "Vienna", "Lisbon", "Copenhagen"],
    COUNTRIES: ["Germany", "France", "Italy", "Spain", "Poland", "Netherlands", "Belgium", "Austria", "Portugal", "Denmark"],
    BRANDS: ["Electro", "Solar", "Tech", "Green", "Logi", "Fast", "Smart", "Aero", "Maxi", "Pro"],
    CATEGORIES: ["Electronics", "Solar Panels", "Lighting", "Accessories", "Peripherals", "Tools"],
    COLORS: ["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow"],
    STATUS: ["processing", "shipping", "delivered", "billing", "cancelled"],
    TRANSPORT: ["truck", "plane", "ship", "train"],
    // Usamos un servicio de imágenes aleatorias con dimensiones fijas.
    RANDOM_IMAGE_URL_BASE: "https://picsum.photos/seed/",
};

// --- FUNCIONES DE SEEDING ---

/**
 * 1. Genera X proveedores aleatorios.
 * @returns {Array<Object>} Lista de proveedores.
 */
async function seedSuppliers(db) {
    const suppliersRef = db.collection("suppliers");
    let batch = db.batch();
    const createdSuppliers = [];

    for (let i = 0; i < SEED_CONFIG.SUPPLIERS; i++) {
        const id = `SUP${i + 1}-${generateUUID().substring(0, 5)}`;
        const country = getRandomItem(BASE_DATA.COUNTRIES);

        const supplier = {
            id,
            name: `Supplier Corp ${i + 1}`,
            email: `supplier${i + 1}@corp.com`,
            vatNumber: `VAT${Math.floor(Math.random() * 90000) + 10000}`,
            address: `${getRandomItem(BASE_DATA.CITIES)}, ${country}`,
            billingAddress: `Billing Address ${i + 1}`,
            country: country,
            contactName: `Contact ${i + 1}`,
            phone: `+123-${Math.floor(Math.random() * 900000000) + 100000000}`,
            createdAt: Timestamp.now(),
            currency: "€",
            active: true
        };

        createdSuppliers.push(supplier);
        batch.set(suppliersRef.doc(id), supplier);

        if ((i + 1) % SEED_CONFIG.BATCH_SIZE === 0) {
            await batch.commit();
            console.log(`💾 Committed ${i + 1} suppliers batch.`);
            batch = db.batch();
        }
    }
    await batch.commit();
    console.log(`🎉 Seeded ${createdSuppliers.length} suppliers.`);
    return createdSuppliers;
}

/**
 * 2. Genera X almacenes aleatorios.
 * @returns {Array<Object>} Lista de almacenes.
 */
async function seedWarehouses(db) {
    const warehousesRef = db.collection("warehouses");
    let batch = db.batch();
    const createdWarehouses = [];

    for (let i = 0; i < SEED_CONFIG.WAREHOUSES; i++) {
        const country = getRandomItem(BASE_DATA.COUNTRIES);
        const id = `wh-${country.substring(0, 2).toLowerCase()}-${i + 1}`;

        const warehouse = {
            id,
            name: `${country} Hub W${i + 1}`,
            address: `Street ${Math.floor(Math.random() * 100)}, ${getRandomItem(BASE_DATA.CITIES)}`,
            country: country,
            unitPrice: parseFloat((Math.random() * 40 + 10).toFixed(2)), // Precio entre 10 y 50
            createdAt: Timestamp.now(),
        };

        createdWarehouses.push(warehouse);
        batch.set(warehousesRef.doc(id), warehouse);

        if ((i + 1) % SEED_CONFIG.BATCH_SIZE === 0) {
            await batch.commit();
            console.log(`💾 Committed ${i + 1} warehouses batch.`);
            batch = db.batch();
        }
    }
    await batch.commit();
    console.log(`🎉 Seeded ${createdWarehouses.length} warehouses.`);
    return createdWarehouses;
}

/**
 * 3. Genera X clientes aleatorios.
 * @returns {Array<Object>} Lista de clientes.
 */
async function seedClients(db) {
    const clientsRef = db.collection("clients");
    let batch = db.batch();
    const createdClients = [];

    for (let i = 0; i < SEED_CONFIG.CLIENTS; i++) {
        const id = `CLI${i + 1}-${generateUUID().substring(0, 5)}`;
        const country = getRandomItem(BASE_DATA.COUNTRIES);
        const clientName = `Client Trading ${i + 1}`;

        const client = {
            id,
            name: clientName,
            email: `client${i + 1}@${clientName.replace(/\s/g, '').toLowerCase()}.com`,
            vatNumber: `VAT${Math.floor(Math.random() * 90000) + 10000}`,
            billingAddress: `Billing Address ${i + 1}`,
            deliveryAddress: `Delivery Address ${i + 1}`,
            invoiceCounter: 0,
            scpCounter: 0,
            country: country,
            createdAt: Timestamp.now(),
            balance: parseFloat((Math.random() * 10000).toFixed(2)),
            currency: "€",
            tier: Math.floor(Math.random() * 4) + 1,
            active: true
        };

        createdClients.push(client);
        batch.set(clientsRef.doc(id), client);

        if ((i + 1) % SEED_CONFIG.BATCH_SIZE === 0) {
            await batch.commit();
            console.log(`💾 Committed ${i + 1} clients batch.`);
            batch = db.batch();
        }
    }
    await batch.commit();
    console.log(`🎉 Seeded ${createdClients.length} clients.`);
    return createdClients;
}

/**
 * 4. Genera X productos y, simultáneamente, Y documentos de stock.
 */
async function seedProductsAndStock(db, suppliers, warehouses) {
    const productsRef = db.collection("products");
    const stockRef = db.collection("stock");
    let batch = db.batch();
    let productCount = 0;
    let stockCount = 0;

    for (let i = 0; i < SEED_CONFIG.PRODUCTS; i++) {
        const brand = getRandomItem(BASE_DATA.BRANDS);
        const category = getRandomItem(BASE_DATA.CATEGORIES);
        const color = getRandomItem(BASE_DATA.COLORS);
        const model = `M-${Math.floor(Math.random() * 999)}`;
        const sku = `${brand.substring(0, 3)}-${color.substring(0, 2)}-${model}-${i}`;
        const ean = (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString(); // EAN de 13 dígitos

        // Genera una URL de imagen aleatoria única usando el SKU como semilla
        const photoUrl = `${BASE_DATA.RANDOM_IMAGE_URL_BASE}${sku}/300/300`;

        // 1. Crear la lista de proveedores para el producto
        const numSuppliers = Math.floor(Math.random() * 3) + 1; // 1 a 3 proveedores
        const supplierList = [];

        for (let j = 0; j < numSuppliers; j++) {
            const supplier = getRandomItem(suppliers);
            const supplierWarehouses = {};

            // Asignar 1 a 2 almacenes a este proveedor
            const numWarehouses = Math.floor(Math.random() * 2) + 1;

            for (let k = 0; k < numWarehouses; k++) {
                const warehouse = getRandomItem(warehouses);
                const stockQuantity = Math.floor(Math.random() * 1000) + 50;

                supplierWarehouses[warehouse.country.toLowerCase().replace(/\s/g, '_')] = {
                    name: warehouse.name,
                    blocked_quantity: 0,
                    quantity: stockQuantity,
                    transport: BASE_DATA.TRANSPORT.slice(0, Math.floor(Math.random() * 3) + 1).map(t => ({
                        name: t,
                        sla: Math.floor(Math.random() * 10) + 1,
                        unitPrice: parseFloat((Math.random() * 50 + 5).toFixed(2)),
                    })),
                };

                // 2. Crear documento de Stock para este producto/almacén
                const stockId = `${sku}-${warehouse.id}`;
                const stockDoc = {
                    sku,
                    productName: `${brand} ${model} (${category})`,
                    quantity: stockQuantity,
                    blocked_quantity: 0,
                    product_status: "not available",
                    warehouse: warehouse.name,
                    warehouseId: warehouse.id,
                    unitPrice: parseFloat((Math.random() * 150 + 20).toFixed(2)),
                    ean,
                    lastUpdated: Timestamp.now(),
                };
                batch.set(stockRef.doc(stockId), stockDoc);
                stockCount++;
            }

            supplierList.push({ supplierId: supplier.id, warehouses: supplierWarehouses });
        }

        // 3. Crear documento de Producto
        const product = {
            brand,
            category,
            color,
            depth: Math.floor(Math.random() * 100) + 10,
            description: `Product ${i + 1}: ${category} from ${brand} in ${color}.`,
            ean,
            height: Math.floor(Math.random() * 100) + 10,
            minThreshold: Math.floor(Math.random() * 100) + 10,
            model,
            photoUrl, // AÑADIDA FOTO ALEATORIA
            productVariant: `${color} ${model}`,
            sku,
            supplierList,
            weight: Math.floor(Math.random() * 1000) + 100,
            width: Math.floor(Math.random() * 100) + 10,
            createdAt: Timestamp.now(),
        };
        batch.set(productsRef.doc(sku), product);
        productCount++;

        // El punto de control debe estar lo suficientemente alejado para permitir las escrituras de stock
        if ((productCount + stockCount) % SEED_CONFIG.BATCH_SIZE < 5) {
            await batch.commit();
            console.log(`💾 Committed products and stock batch. Total: ${productCount} products, ${stockCount} stock items.`);
            batch = db.batch();
        }
    }

    await batch.commit();
    console.log(`🎉 Seeded ${productCount} products and ${stockCount} stock items.`);
    return { productCount, stockCount };
}

/**
 * 5. Genera X órdenes aleatorias.
 */
async function seedOrders(db, clients) {
    const ordersRef = db.collection("orders");
    let batch = db.batch();
    let ordersCount = 0;

    // Obtener datos de productos y stock para crear órdenes realistas
    const stockSnap = await db.collection("stock").get();
    const stockItems = stockSnap.docs.map(doc => doc.data());

    if (stockItems.length === 0) {
        console.warn("🚨 No stock items found to create orders. Skipping order seeding.");
        return 0;
    }

    for (let i = 0; i < SEED_CONFIG.ORDERS; i++) {
        const client = getRandomItem(clients);
        const creationDate = getRandomTargetDate();
        const deliveryDate = new Date(creationDate.getTime() + Math.floor(Math.random() * 7 + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const numItems = Math.floor(Math.random() * 4) + 1; // 1 a 4 productos por orden
        const eanList = {};
        let totalBlockedAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const stockItem = getRandomItem(stockItems);
            const quantity = Math.floor(Math.random() * 10) + 1;
            const unitPrice = stockItem.unitPrice * (Math.random() * 0.4 + 0.8);

            eanList[stockItem.ean] = {
                sku: stockItem.sku,
                description: stockItem.productName,
                quantity,
                blocked_quantity: 0,
                product_status: "not available",
                unitPrice: parseFloat(unitPrice.toFixed(2)),
                isBlocked: Math.random() > 0.1,
                selectedWarehouse: stockItem.warehouse,
            };
            totalBlockedAmount += quantity * unitPrice;
        }

        const order = {
            clientId: client.id,
            creationDate: Timestamp.fromDate(creationDate),
            deliveryDate: deliveryDate,
            origin: "purchase",
            currency: "€",
            poNumber: `PO${Math.floor(Math.random() * 999999)}`,
            status: getRandomItem(BASE_DATA.STATUS),
            totalBlockedAmount: parseFloat(totalBlockedAmount.toFixed(2)),
            scp: `${client.id}-${creationDate.toISOString()}`,
            backOrder: Math.random() < 0.2,
            eanList,
            createdAt: Timestamp.now(),
        };

        // CORREGIDO: Usamos batch.set(doc()) para IDs automáticos en batches
        batch.set(ordersRef.doc(), order);
        ordersCount++;

        if (ordersCount % SEED_CONFIG.BATCH_SIZE === 0) {
            await batch.commit();
            console.log(`💾 Committed ${ordersCount} orders batch.`);
            batch = db.batch();
        }
    }

    await batch.commit();
    console.log(`🎉 Seeded ${ordersCount} orders.`);
    return ordersCount;
}

// --- FUNCIÓN DE LIMPIEZA MAESTRA ---

async function clearAllData(db) {
    console.log("--- Starting Data Cleanup ---");

    const collectionsToClear = [
        "suppliers",
        "warehouses",
        "clients",
        "products",
        "stock",
        "orders",
        //"invoices", // Se asume que también hay una colección de facturas que limpiar
    ];

    for (const collectionName of collectionsToClear) {
        console.log(`🗑️ Clearing collection: ${collectionName}...`);
        await clearCollection(db, collectionName);
        console.log(`✅ Collection ${collectionName} cleared.`);
    }

    console.log("--- Data Cleanup Complete ---");
}


// --- FUNCIÓN MAESTRA DE SEEDING ---

async function seedBatch(db) {
    console.log("--- Starting Batch Seeding ---");

    // 1. Seedear datos base que otros necesitan
    const suppliers = await seedSuppliers(db);
    const warehouses = await seedWarehouses(db);
    const clients = await seedClients(db);

    // 2. Seedear productos y stock (depende de proveedores y almacenes)
    const { productCount, stockCount } = await seedProductsAndStock(db, suppliers, warehouses);

    3. Seedear órdenes (depende de clientes y stock)
    //const ordersCount = await seedOrders(db, clients);

    console.log("--- Final Counts ---");
    console.log(`✅ Suppliers: ${suppliers.length} (Target: ${SEED_CONFIG.SUPPLIERS})`);
    console.log(`✅ Clients: ${clients.length} (Target: ${SEED_CONFIG.CLIENTS})`);
    console.log(`✅ Warehouses: ${warehouses.length} (Target: ${SEED_CONFIG.WAREHOUSES})`);
    console.log(`✅ Products: ${productCount} (Target: ${SEED_CONFIG.PRODUCTS})`);
    console.log(`✅ Stock Items: ${stockCount} (Target: ~${SEED_CONFIG.PRODUCTS * 2})`);
    //console.log(`✅ Orders: ${ordersCount} (Target: ${SEED_CONFIG.ORDERS})`);
    console.log("--- Batch Seeding Complete ---");
}

// --- FUNCIÓN MAIN ORIGINAL MODIFICADA ---

async function main() {
    const jsonData = await readFile(jsonPath, "utf-8");
    const serviceAccount = JSON.parse(jsonData);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();

    // 1. LIMPIAR TODOS LOS DATOS
    await clearAllData(db);

    // 2. SEMBRAR LOS NUEVOS DATOS
    await seedBatch(db);

    // ... (otras funciones originales comentadas)

    console.log("🎉 All done!");
}

main().catch(console.error);