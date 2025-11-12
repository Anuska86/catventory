export const UpgradeNav = [
  {
    icon: "pe-7s-diamond",
    label: "Upgrade to PRO",
    to: "https://dashboardpack.com/theme-details/tradeflow-dashboard-react-pro?utm_source=free_theme&utm_medium=sidebar&utm_campaign=upgrade_cta&utm_content=menu_item",
    external: true,
  },
];

export const SettingsNav = [
  {
    icon: "pe-7s-graph2",
    label: "Settings",
    to: "/settings",
  },
];

export const MainNav = [
  {
    icon: "pe-7s-graph2",
    label: "Dashboard",
    to: "/dashboards/dashboard",
  },
];

export const SuppliersNav = [
  {
    icon: "pe-7s-monitor",
    label: "Management Dashboard",
    to: "/management",
  },
];

export const OperationsNav = [
  {
    icon: "pe-7s-cart",
    label: "Purchases",
    content: [
      /*
      {
        icon: "pe-7s-plus",
        label: "Estimation",
        to: "/purchase/purchase-estimation",
        note: "This is for purchase estimations",
      },
            {
        icon: "pe-7s-home",
        label: "In-House Request",
        to: "/purchase/in-house-request",
        note: "This is for in-house stock requests",
      },
      */
      {
        icon: "pe-7s-note",
        label: "Create",
        to: "/purchase/create-purchase",
        note: "This is for creating purchase orders",
      },
      {
        icon: "pe-7s-note2",
        label: "Overview",
        to: "/purchase/overview",
      },
      /*
      {
        icon: "pe-7s-gleam",
        label: "Forecast",
        to: "/purchase/forecast",
      },
      */
      {
        icon: "pe-7s-wallet",
        label: "Invoices",
        to: "/purchase/invoices",
      },
    ],
  },
  {
    icon: "pe-7s-box2",
    label: "Orders",
    content: [
      {
        icon: "pe-7s-plus",
        label: "Add",
        to: "/orders/add-order",
        note: "This is for orders from clients to the commercial team",
      },
      /*
      {
        icon: "pe-7s-note2",
        label: "RFQ",
        to: "/orders/rfq-table",
      },
      */
      {
        icon: "pe-7s-display2",
        label: "BackOrder",
        to: "/orders/backorder",
      },
      /*
      {
        icon: "pe-7s-gleam",
        label: "Simulations",
        to: "/orders/simulation",
      },
      {
        icon: "pe-7s-wallet",
        label: "Order invoices",
        to: "/orders/invoices",
      },
      */
    ],
  },
  {
    icon: "pe-7s-cash",
    label: "Billing",
    content: [
      /*
      {
        icon: "pe-7s-plus",
        label: "Add Billing",
        to: "/billing/add-billing",
      },
      */
      {
        icon: "pe-7s-display2",
        label: "Status",
        to: "/billing/status",
      },
    ],
  },
  {
    icon: "pe-7s-car",
    label: "Deliveries",
    content: [
      /*
      {
        icon: "pe-7s-gleam",
        label: "Simulation",
        to: "/deliveries/simulation",
      },
      */
      {
        icon: "pe-7s-plus",
        label: "Schedule Delivery",
        to: "/deliveries/schedule",
      },
      {
        icon: "pe-7s-map-marker",
        label: "Track Delivery",
        to: "/deliveries/track",
      },
      {
        icon: "pe-7s-note2",
        label: "Delivery History",
        to: "/deliveries/history",
      },
    ],
  }
];

export const UtilsNav = [
  /*
  {
    icon: "pe-7s-car",
    label: "Fleet Cost",
    to: "/utils/fleet-cost",
  },
  */
  {
    icon: "pe-7s-cash",
    label: "Currencies",
    to: "/utils/currencies",
  },
  {
    icon: "pe-7s-search",
    label: "UserTrack",
    to: "/utils/user-track",
  },
];

export const StockNav = [
  /*
  {
    icon: "pe-7s-network",
    label: "Warehouse",
    content: [
      {
        icon: "pe-7s-display2",
        label: "Showcase",
        to: "/stock/warehouse/showcase",
      },
    ],
  },
  */
  {
    icon: "pe-7s-folder",
    label: "Catalog",
    content: [
      /*
      {
        icon: "pe-7s-plus",
        label: "Catalog Thing",
        to: "/catalog/thing",
      },
      {
        icon: "pe-7s-note2",
        label: "Catalog Thing2",
        to: "/catalog/thingtwo",
      },
      */
      {
        icon: "pe-7s-display2",
        label: "Showcase",
        to: "/stock/catalog/showcase",
      },
    ],
  },
  {
    icon: "pe-7s-box1",
    label: "Products",
    content: [
      {
        icon: "pe-7s-plus",
        label: "Add Product",
        to: "/stock/add-product",
      },
      /*
      {
        icon: "pe-7s-note2",
        label: "List of Products",
        to: "/stock/list-of-products",
        note: "This is for immediate orders from comercial to supplier",
      },
      */
    ],
  },
  /*
  {
    icon: "pe-7s-server",
    label: "Stock Management",
    content: [],
  },
  */
];

export const ComponentsNav = [
  {
    icon: "pe-7s-diamond",
    label: "Elements",
    content: [
      {
        label: "Standard Buttons",
        to: "/elements/buttons-standard",
      },
      {
        label: "Dropdowns",
        to: "/elements/dropdowns",
      },
      {
        label: "Icons",
        to: "/elements/icons",
      },
      {
        label: "Badges",
        to: "/elements/badges-labels",
      },
      {
        label: "Cards",
        to: "/elements/cards",
      },
      {
        label: "List Groups",
        to: "/elements/list-group",
      },
      {
        label: "Navigation Menus",
        to: "/elements/navigation",
      },
      {
        label: "Utilities",
        to: "/elements/utilities",
      },
    ],
  },
  {
    icon: "pe-7s-car",
    label: "Components",
    content: [
      {
        label: "Tabs",
        to: "/components/tabs",
      },
      {
        label: "Notifications",
        to: "/components/notifications",
      },
      {
        label: "Modals",
        to: "/components/modals",
      },
      {
        label: "Progress Bar",
        to: "/components/progress-bar",
      },
      {
        label: "Tooltips & Popovers",
        to: "/components/tooltips-popovers",
      },
      {
        label: "Carousel",
        to: "/components/carousel",
      },
      {
        label: "Maps",
        to: "/components/maps",
      },
    ],
  },
  {
    icon: "pe-7s-display2",
    label: "Regular Tables",
    to: "/tables/regular-tables",
  },
];
export const FormsNav = [
  {
    icon: "pe-7s-light",
    label: "Controls",
    to: "/forms/controls",
  },
  {
    icon: "pe-7s-eyedropper",
    label: "Layouts",
    to: "/forms/layouts",
  },
  {
    icon: "pe-7s-pendrive",
    label: "Validation",
    to: "/forms/validation",
  },
];
export const WidgetsNav = [
  {
    icon: "pe-7s-graph2",
    label: "Dashboard Boxes",
    to: "/widgets/chart-boxes-3",
  },
];
export const ChartsNav = [
  {
    icon: "pe-7s-graph2",
    label: "ChartJS",
    to: "/charts/chartjs",
  },
];

export const ETLNav = [
  {
    icon: "pe-7s-pendrive",
    label: "Submit Data",
    to: "/forms/dataform",
  },
];
