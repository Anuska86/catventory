import React, { Fragment } from "react";
import "../style/FormOrder.css";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../utils/TransitionWrapper";
import { Row, Col, Card, CardBody } from "reactstrap";
import FormOrders from "../Form/FormOrders";
import DataForm from "../../../Pages/Forms/Elements/DataInput";
import Tabs, {
  TabPane,
  TabContent,
  ScrollableInkTabBar,
} from "../../../utils/TabsWrapper";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import PageTitle from "../../../Layout/AppMain/PageTitle";

const FormComponent = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState(null);
  const [data, setData] = useState([]);

  const toggleModal = () => setModalOpen(!modalOpen);

  const handleEdit = (item) => {
    setCurrentItem(item); // Establece el elemento a editar
    toggleModal(); // Abre el modal
  };

  const handleDelete = (item) => {
    // Lógica para eliminar el elemento
    alert(`Deleting item with id: ${item.id}`);
    const updatedProducts = data.filter((p) => p.id !== item.id);
    setData(updatedProducts);
  };

  const handleSave = (updatedItem) => {
    // Lógica para guardar los cambios
    console.log("Saving changes for item:", updatedItem);
    const updatedProducts = data.map((p) =>
      p.id === updatedItem.id ? updatedItem : p
    );
    setData(updatedProducts);
  };

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
      console.log("Fetched data:", items);
    };

    fetchData();
  }, []);
  return (
    <Fragment>
      <TransitionGroup>
        <CSSTransition
          component="div"
          classNames="TabsAnimation"
          appear={true}
          timeout={1500}
          enter={false}
          exit={false}
        >
          <div className="centered-container">
            <div className="content-wrapper">
              <PageTitle
                heading="Form"
                subheading="Update your data to the Extract, Transform, Load (ETL) process."
                icon="pe-7s-display1 icon-gradient bg-premium-dark"
              />
              <Tabs
                defaultActiveKey="1"
                renderTabBar={() => <ScrollableInkTabBar />}
                renderTabContent={() => <TabContent />}
              >
                <TabPane tab="Upload" key="1">
                  <DataForm />
                </TabPane>
                <TabPane tab="Manual" key="2">
                  <Row>
                    <Col lg="12">
                      <Card className="main-card mb-3">
                        <CardBody>
                          <FormOrders clientsData={data} />
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </Fragment>
  );
};

export default FormComponent;
