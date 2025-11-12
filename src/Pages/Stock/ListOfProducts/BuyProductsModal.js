import React, { useState, useEffect, useMemo } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Table,
    Input,
    FormGroup,
} from "reactstrap";

// --- Utitlidad de Correo ---
const generateMailtoLink = (supplierDetails, supplierId, recipientEmail) => {
    // Usamos el ID del proveedor para crear un email por defecto si no se proporciona uno real
    const recipient = recipientEmail || `${supplierId.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
    const subject = encodeURIComponent(`ORDEN DE COMPRA URGENTE - Productos para ${supplierId}`);

    let body = `Estimado Proveedor ${supplierId}, \n\nAdjunto nuestra orden de compra:\n\n`;

    supplierDetails.forEach((item) => {
        // Incluye la información clave del producto y la cantidad confirmada
        body += `${item.brand} ${item.model} - Cantidad: ${item.quantity} - EAN: ${item.ean}\n`;
    });

    body += "\n\nPor favor, confirmar disponibilidad y precio final. \n\nGracias.";
    
    const encodedBody = encodeURIComponent(body);
    
    return `mailto:${recipient}?subject=${subject}&body=${encodedBody}`;
};
// ----------------------------

const BuyProductsModal = ({ modal, toggle, productsToBuy = [], clearSelections }) => {
    // Estado para las cantidades: { [productId]: cantidad, ... }
    const [quantities, setQuantities] = useState({});
    
    // Estado para el proveedor seleccionado por producto: { [productId]: supplierId, ... }
    const [productSuppliers, setProductSuppliers] = useState({});

    // Estado para almacenar los enlaces mailto generados (activa la Fase de Envío)
    const [mailtoLinks, setMailtoLinks] = useState([]);

    // Estabilizar la lista de productos
    const selectedProductsData = useMemo(() => {
        return productsToBuy; 
    }, [productsToBuy]);
    
    // Lógica de Inicialización de Estados
    useEffect(() => {
        if (!modal) {
            // Limpieza al cerrar el modal
            setQuantities({});
            setProductSuppliers({});
            setMailtoLinks([]);
            return;
        }

        const initialQuantities = {};
        const initialSuppliers = {};

        selectedProductsData.forEach(product => {
            // Inicializar Cantidades (mantiene el valor existente o 1)
            initialQuantities[product.id] = quantities[product.id] || 1; 

            // Inicializar Proveedor (mantiene el valor existente o el primer proveedor de la lista)
            const firstSupplier = product.supplierList && product.supplierList.length > 0
                ? product.supplierList[0].supplierId
                : null;
                
            initialSuppliers[product.id] = productSuppliers[product.id] || firstSupplier;
        });

        // Actualizar solo si los estados iniciales difieren de los actuales para evitar bucle
        if (JSON.stringify(initialQuantities) !== JSON.stringify(quantities)) {
            setQuantities(initialQuantities);
        }
        if (JSON.stringify(initialSuppliers) !== JSON.stringify(productSuppliers)) {
            setProductSuppliers(initialSuppliers);
        }

    }, [modal, selectedProductsData]); 

    // HANDLERS
    const handleQuantityChange = (productId, value) => {
        const newQuantity = Math.max(1, parseInt(value, 10) || 1);
        setQuantities((prev) => ({
            ...prev,
            [productId]: newQuantity,
        }));
    };
    
    const handleSupplierChange = (productId, supplierId) => {
        setProductSuppliers((prev) => ({
            ...prev,
            [productId]: supplierId,
        }));
    };

    // LÓGICA DE GENERACIÓN Y AGRUPAMIENTO DE ÓRDENES (sustituye a handleConfirmPurchase)
    const handleGenerateOrders = () => {
        
        // 1. AGRUPAR TODOS LOS PRODUCTOS POR EL PROVEEDOR SELECCIONADO POR EL USUARIO
        const ordersBySupplier = selectedProductsData.reduce((acc, product) => {
            const supplierId = productSuppliers[product.id];
            
            if (supplierId) {
                if (!acc[supplierId]) {
                    acc[supplierId] = [];
                }
                
                // Añadir el detalle completo con la cantidad elegida
                acc[supplierId].push({
                    ...product,
                    quantity: quantities[product.id] || 1,
                });
            }
            return acc;
        }, {});
        
        const supplierIdsToMail = Object.keys(ordersBySupplier);
        
        if (supplierIdsToMail.length === 0) {
            alert("No hay productos asignados a ningún proveedor. Por favor, selecciona un proveedor para cada producto.");
            return;
        }

        // 2. GENERAR LOS OBJETOS DE ENLACE (sin abrirlos, esto previene el error 'Disconnected Port')
        const generatedLinks = supplierIdsToMail.map((supplierId) => {
            const productsForSupplier = ordersBySupplier[supplierId];
            const recipientEmail = `${supplierId.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`; 
            
            const link = generateMailtoLink(productsForSupplier, supplierId, recipientEmail);
            
            return {
                supplierId,
                recipientEmail,
                link,
                productCount: productsForSupplier.length
            };
        });

        // 3. Almacenar los enlaces para mostrarlos en la UI (activa la Fase de Envío)
        setMailtoLinks(generatedLinks);
    };

    const handleCloseAndClear = () => {
        toggle(); // Cierra el modal
        if (clearSelections) {
            clearSelections(); // Limpia la selección en el componente padre
        }
    }

    const uniqueSuppliersCount = useMemo(() => {
        return new Set(selectedProductsData.flatMap(p => (p.supplierList || []).map(s => s.supplierId))).size;
    }, [selectedProductsData]);


    // RENDERIZADO DEL MODAL
    return (
        <Modal isOpen={modal} toggle={handleCloseAndClear} size="xl">
            <ModalHeader toggle={handleCloseAndClear}>
                Generar Órdenes de Compra por Proveedor ({selectedProductsData.length} productos)
            </ModalHeader>
            <ModalBody>
                
                {mailtoLinks.length === 0 ? (
                    // ************************ FASE 1: CONFIGURACIÓN (TABLA) ************************
                    <>
                        <p>
                            Para cada producto, selecciona el **proveedor** al que deseas solicitarlo e indica la **cantidad**.
                        </p>
                        <Table striped responsive>
                            <thead>
                                <tr>
                                    <th>Modelo</th>
                                    <th>Marca</th>
                                    <th>Precio (€)</th>
                                    <th>EAN</th>
                                    <th>Proveedor</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProductsData.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.model}</td>
                                        <td>{product.brand}</td>
                                        <td>{product.unitPrice || 'N/A'}</td>
                                        <td>{product.ean}</td>
                                        <td style={{ width: "200px" }}>
                                            <Input
                                                type="select"
                                                value={productSuppliers[product.id] || ''}
                                                onChange={(e) => handleSupplierChange(product.id, e.target.value)}
                                                disabled={!product.supplierList || product.supplierList.length === 0}
                                            >
                                                <option value="" disabled>Seleccionar Proveedor</option>
                                                {(product.supplierList || []).map((supplierInfo) => (
                                                    <option key={supplierInfo.supplierId} value={supplierInfo.supplierId}>
                                                        {supplierInfo.supplierId}
                                                    </option>
                                                ))}
                                            </Input>
                                        </td>
                                        <td style={{ width: "120px" }}>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={quantities[product.id] || 1}
                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                style={{ maxWidth: "80px" }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                ) : (
                    // ************************ FASE 2: ENVÍO (LISTA DE ENLACES) ************************
                    <div>
                        <h4>✅ Órdenes de Compra Generadas</h4>
                        <p>
                            La información ha sido agrupada por proveedor. Haz clic en cada botón para abrir tu cliente de correo y enviar la orden.
                        </p>
                        {mailtoLinks.map((item) => (
                            <div key={item.supplierId} className="my-3 d-flex justify-content-between align-items-center border p-2 rounded">
                                <strong>{item.supplierId}</strong>
                                <span>({item.productCount} {item.productCount === 1 ? 'producto' : 'productos'})</span>
                                <a 
                                    href={item.link} 
                                    className="btn btn-sm btn-info" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    Enviar a {item.recipientEmail} 📧
                                </a>
                            </div>
                        ))}
                        <Button color="secondary" className="mt-4" onClick={() => setMailtoLinks([])}>
                            ⬅️ Volver y Editar Asignaciones
                        </Button>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={handleCloseAndClear}>
                    {mailtoLinks.length === 0 ? 'Cancelar' : 'Cerrar y Limpiar'}
                </Button>
                
                {mailtoLinks.length === 0 && (
                    <Button 
                        color="success" 
                        onClick={handleGenerateOrders} 
                        disabled={selectedProductsData.length === 0}
                    >
                        Generar {uniqueSuppliersCount} Órden(es) de Compra
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default BuyProductsModal;