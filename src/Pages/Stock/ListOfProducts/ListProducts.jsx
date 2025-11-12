import React, { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import "./style/ListProducts.css";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../utils/TransitionWrapper";
import { Row, Col, Card, CardBody, Button, CardHeader } from "reactstrap";
import PageTitle from "../../../Layout/AppMain/PageTitle";
import DataTable from "react-data-table-component";
import { fetchProducts } from "../../../utils/productService";
import { Link } from "react-router-dom";

// *************** CAMBIO 1: Importar el modal ***************
// Ajusta la ruta si es necesario. Por ejemplo, si está en el mismo nivel:
import BuyProductsModal from "./BuyProductsModal"; 
// O si está en una ruta relativa específica:
// import BuyProductsModal from "../Modals/BuyProductsModal";
// ************************************************************

// Define el límite de productos por página
const ITEMS_PER_PAGE = 10;

const ListOfProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Cursor de la página actual, usado para ir a la SIGUIENTE página
  const [lastVisible, setLastVisible] = useState(null); 
  // Stack para almacenar los cursores de las páginas anteriores.
  const [cursorStack, setCursorStack] = useState([null]); // Empieza con null para la primera página
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // productsToBuy almacenará los objetos de producto COMPLETOs
  const [productsToBuy, setProductsToBuy] = useState([]); 
  
  const [submissionStatus, setSubmissionStatus] = useState({
    status: "",
    message: "",
  });

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggledClearRows, setToggleClearRows] = useState(false);

  // Función para abrir/cerrar el modal
  const toggleSendModal = () => setShowSendModal(!showSendModal);
  
  // Función para limpiar la selección de filas después de la compra (pasa al modal)
  const clearSelectedRows = useCallback(() => {
    setToggleClearRows(prev => !prev); // Alterna para forzar el borrado de filas en DataTable
    setSelectedRows([]);
  }, []);

  const handleBuyProducts = () => {
    setSubmissionStatus({ status: "", message: "" });
    if (selectedRows.length === 0) {
      alert(
        "Por favor, selecciona al menos una fila para generar la orden de compra."
      );
      return;
    }

    // *************** CAMBIO CLAVE 2: Guardar los objetos de fila COMPLETOs ***************
    // El modal necesita todos los detalles (model, brand, unitPrice, ean).
    setProductsToBuy(selectedRows);
    
    // Abrir el modal
    setShowSendModal(true); 

    // NOTA: He eliminado el bloque try/catch de prueba que guardaba `purchaseIds`, 
    // ya que la lógica de "compra real" ocurre dentro del BuyProductsModal.
  };


  /**
   * Carga una página de productos desde Firestore.
   * @param {object} startAfterDoc El documento para iniciar la consulta (cursor).
   */
  const fetchData = async (startAfterDoc) => {
    setLoading(true);
    try {
      // La función fetchProducts debe devolver: { products, lastVisible }
      const result = await fetchProducts(ITEMS_PER_PAGE, startAfterDoc);
      const productList = result.products;

      // Determinar si hay más elementos (Firestore trae ITEMS_PER_PAGE + 1 para verificar)
      // Como fetchProducts trae un límite exacto, asumimos que si la lista tiene el
      // tamaño completo, puede haber más. (Ajustar si tu fetch trae N+1)
      if (productList.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      const formattedData = productList.map((product) => ({
        id: product.id,
        image: product.photoUrl || "https://placehold.co/60x60?text=No+Image",
        brand: product.brand,
        model: product.model,
        category: product.category,
        unitPrice: product.unitPrice,
        ean: product.ean,
        details: product.id,
        supplierList: product.supplierList || [],
      }));

      setProducts(formattedData);
      setLastVisible(result.lastVisible);

    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carga la primera página al montar el componente (cursor: null)
    fetchData(null);
  }, []);

  // --- Funciones de Navegación de Paginación ---

  const handleNextPage = () => {
    // Solo avanza si hay un cursor para la siguiente página
    if (lastVisible) {
      // 1. Añade el cursor actual al stack antes de avanzar
      setCursorStack(prevStack => [...prevStack, lastVisible]); 
      
      // 2. Incrementa la página y carga la nueva página
      setCurrentPage(prev => prev + 1);
      fetchData(lastVisible);
    }
  };

  const handlePreviousPage = () => {
    // 1. Solo retrocede si no estamos en la primera página
    if (currentPage > 1) {
      // 2. Elimina el cursor de la página actual del stack
      // El último elemento del stack (cursor actual) ya no es necesario
      const newStack = cursorStack.slice(0, -1);
      setCursorStack(newStack);

      // 3. Obtiene el cursor de la página anterior (el nuevo último elemento del stack)
      const previousCursor = newStack[newStack.length - 1];

      // 4. Decrementa la página y carga los datos usando el cursor anterior
      setCurrentPage(prev => prev - 1);
      fetchData(previousCursor);
    }
  };

  // ... (El resto del componente se mantiene igual)

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.ean?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);


  const columns = [
    // ... (Tu array de columnas se mantiene igual)
    {
        name: "Image",
        selector: (row) => (
            <div style={{ padding: "8px" }}>
                <img
                    src={row.image}
                    alt={row.model}
                    width="60"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/60x60?text=No+Image";
                    }}
                />
            </div>
        ),
        sortable: false,
    },
    { name: "Brand", selector: (row) => row.brand, sortable: true },
    { name: "Model", selector: (row) => row.model, sortable: true },
    { name: "Category", selector: (row) => row.category, sortable: true },
    { name: "EAN", selector: (row) => row.ean, sortable: true },
    {
        name: "Details",
        cell: (row) => (
            <Link to={`/stock/details/${row.details}`}>
                <button
                    type="button"
                    style={{
                        background: "none",
                        border: "none",
                        color: "blue",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                    }}
                >
                    More Details
                </button>
            </Link>
        ),
    },
  ];

  const handleRowSelected = React.useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  return (
    <Fragment>
      <PageTitle
        heading="📦 Product Inventory"
        subheading="Manage and view your product stock."
        icon="pe-7s-box2 icon-gradient bg-amy-crisp"
      />
      <TransitionGroup>
        <CSSTransition
          component="div"
          classNames="TabsAnimation"
          appear={true}
          timeout={1500}
          enter={false}
          exit={false}
        >
          <Row>
            <Col lg="12" style={{ width: "100%" }}>
              <Card>
                <CardHeader className="card-header-tab">
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    <Button
                      color="success"
                      onClick={handleBuyProducts}
                      disabled={selectedRows.length === 0}
                    >
                      Buy Products
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="full-width-table">
                  {/* Search bar... (Se mantiene igual) */}
                  <div
                    className="search-bar"
                    style={{ textAlign: "left", marginBottom: "1rem" }}
                  >
                    <div
                      className="search-wrapper"
                      style={{
                        position: "relative",
                        width: "220px",
                        display: "inline-block",
                      }}
                    >
                      <svg
                        className="search-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          pointerEvents: "none",
                        }}
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                      </svg>

                      <input
                        type="text"
                        placeholder="Search by EAN or SKU"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="list-product-search-input"
                        style={{
                          paddingLeft: "30px",
                          paddingRight: "30px",
                          paddingTop: "6px",
                          paddingBottom: "6px",
                          width: "100%",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          height: "32px",
                          boxSizing: "border-box",
                          backgroundColor: "white",
                        }}
                      />

                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            backgroundColor: "#eee",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#555",
                            transition: "background-color 0.3s ease",
                            zIndex: 3,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ccc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#eee")
                          }
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable table container */}
                  <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <DataTable
                      data={filteredProducts}
                      columns={columns}
                      pagination={false} 
                      selectableRows
                      fixedHeader
                      fixedHeaderScrollHeight="600px"
                      onSelectedRowsChange={handleRowSelected}
                      clearSelectedRows={toggledClearRows}
                      progressPending={loading}
                    />
                  </div>

                  {/* Controles de Paginación Manual */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: "10px 0",
                      gap: "10px",
                    }}
                  >
                    <Button
                      color="secondary"
                      onClick={handlePreviousPage}
                      // Deshabilita si es la primera página o está cargando
                      disabled={currentPage === 1 || loading} 
                    >
                      Anterior
                    </Button>
                    <span style={{ alignSelf: "center", fontSize: "14px" }}>
                      Página {currentPage}
                    </span>
                    <Button
                      color="primary"
                      onClick={handleNextPage}
                      // Deshabilita si no hay más elementos o está cargando
                      disabled={!hasMore || loading} 
                    >
                      Siguiente
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </TransitionGroup>

      {/* *************** CAMBIO 3: Renderizar el BuyProductsModal *************** */}
      <BuyProductsModal
        modal={showSendModal}
        toggle={toggleSendModal}
        productsToBuy={productsToBuy} // Pasa los objetos completos seleccionados
        clearSelections={clearSelectedRows} // Función para limpiar la selección de la tabla al confirmar la compra
      />
      {/* ************************************************************************* */}
    </Fragment>
  );
};

export default ListOfProducts;