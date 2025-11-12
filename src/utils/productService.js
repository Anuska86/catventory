import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";

import { db } from "./firebase";

//import paginated products from Firebase
export const fetchProducts = async (pageSize = 10, startAfterDoc = null) => {
  // 1. Siempre ordena por un campo para que la paginación funcione
  // Si no tienes un campo de ordenamiento claro, usa el campo que quieres para ordenar la tabla.
  let productsQuery = query(
    collection(db, "products"),
    orderBy("brand"), // Importante: Ordena por un campo (ej. brand)
    limit(pageSize)
  );

  // 2. Si se proporciona un cursor, lo añade a la consulta
  if (startAfterDoc) {
    productsQuery = query(
      collection(db, "products"),
      orderBy("brand"),
      startAfter(startAfterDoc), // Usa el último documento como punto de inicio
      limit(pageSize)
    );
  }

  const querySnapshot = await getDocs(productsQuery);

  const productList = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Devuelve el último documento para usarlo como cursor en la siguiente página
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { products: productList, lastVisible };
};

//import only one product by ID from Firebase
export const fetchProductById = async (id) => {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      image: data.photoUrl || "/default-image.jpg",
    };
  } else {
    throw new Error("Product not found");
  }
};

// Fetch products by partial SKU match
export const fetchProductsByPartialSku = async (partialSku) => {
  const productsRef = collection(db, "products");
  const snapshot = await getDocs(productsRef);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) =>
      product.sku?.toLowerCase().includes(partialSku.toLowerCase())
    );
};

// Fetch a supplier by ID from Firebase
export const fetchSupplierById = async (supplierId) => {
  const docRef = doc(db, "suppliers", supplierId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } else {
    throw new Error("Supplier not found");
  }
};

//Fetch product by ean when is a field
export const fetchProductByEan = async (ean) => {
  const q = query(collection(db, "products"), where("ean", "==", ean));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error(`No product found with ean ${ean}`);
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
};

//Update Blocked Quantity in products
export const updateBlockedQuantity = async (
  productId,
  fieldPathOrObject,
  value
) => {
  const productRef = doc(db, "products", productId);

  if (typeof fieldPathOrObject === "string" && typeof value !== "undefined") {
    await updateDoc(productRef, { [fieldPathOrObject]: value });
  } else if (typeof fieldPathOrObject === "object" && value === undefined) {
    await updateDoc(productRef, { ...fieldPathOrObject });
  } else {
    throw new Error("Invalid updateBlockedQuantity usage");
  }
};

//Unblock Quantity

export const overwriteBlockedQuantity = (
  supplierList,
  supplierId,
  warehouseKey,
  newBlockedQuantity
) => {
  return Array.isArray(supplierList)
    ? supplierList.map((supplier) => {
        if (supplier.supplierId === supplierId) {
          return {
            ...supplier,
            warehouses: {
              ...supplier.warehouses,
              [warehouseKey]: {
                ...supplier.warehouses?.[warehouseKey],
                blocked_quantity: newBlockedQuantity,
              },
            },
          };
        }
        return supplier;
      })
    : Object.entries(supplierList).reduce((acc, [key, supplier]) => {
        const updatedSupplier = {
          ...supplier,
          warehouses: {
            ...supplier.warehouses,
            [warehouseKey]: {
              ...supplier.warehouses?.[warehouseKey],
              blocked_quantity: newBlockedQuantity,
            },
          },
        };
        acc[key] = updatedSupplier;
        return acc;
      }, {});
};

// Fetch a supplier by name from Firebase
export const fetchSupplierByName = async (supplierName) => {
  const suppliersRef = collection(db, "suppliers");
  const querySnapshot = await getDocs(
    query(suppliersRef, where("name", "==", supplierName))
  );

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } else {
    throw new Error("Supplier not found");
  }
};

// Fetch all the suppliers by name from Firebase
export const fetchAllSupplierNames = async () => {
  const querySnapshot = await getDocs(collection(db, "suppliers"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Add a new supplier to a product's supplierList
export const addSupplierToProduct = async (productId, newSupplier) => {
  const productRef = doc(db, "products", productId);

  try {
    await updateDoc(productRef, {
      supplierList: arrayUnion(newSupplier),
    });
    console.log("Supplier added successfully");
  } catch (error) {
    console.error("Error adding supplier:", error);
    throw error;
  }
};

// Fetch registered suppliers for product
export const fetchRegisteredSupplierIdsForProduct = async (productId) => {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    throw new Error("Product not found");
  }

  const productData = productSnap.data();
  const supplierList = productData.supplierList || [];

  return supplierList.map((entry) => entry.supplierId);
};

//Delete supplier by Id
export const deleteSupplierById = async (supplierId) => {
  try {
    await deleteDoc(doc(db, "suppliers", supplierId));
    console.log("Supplier deleted:", supplierId);
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};

// Fetch all warehouses from Firebase
export const fetchWarehouses = async () => {
  const querySnapshot = await getDocs(collection(db, "warehouses"));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      country: data.country,
    };
  });
};

// Fetch all clients
export const fetchClients = async () => {
  const querySnapshot = await getDocs(collection(db, "clients"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Fetch one client by ID
export const fetchClientById = async (id) => {
  const docRef = doc(db, "clients", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Client not found");
  }
};

// Delete a client by ID
export const deleteClientById = async (clientId) => {
  try {
    await deleteDoc(doc(db, "clients", clientId));
    console.log("Client deleted:", clientId);
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};
