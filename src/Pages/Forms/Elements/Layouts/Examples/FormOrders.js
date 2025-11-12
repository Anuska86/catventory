/*

import React, { Component } from "react";
import ProductSearch from "../../../../Orders/ProductSearch";

import {
  Container,
  Card,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  ListGroup,
  ListGroupItem,
} from "reactstrap";

class CreateOrderForm extends Component {
  state = {
    client: "",
    searchType: "SKU",
    searchQuery: "",
    eanSku: "",
    description: "",
    quantity: 1,
    submitting: false,
    filteredEanSkus: [],
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value }, () => {
      if (name === "searchQuery") {
        this.filterEanSkus(value);
      }
    });
  };

  filterEanSkus = (query) => {
    const allPairs = ["123456", "789012", "345678"];
    const filtered = allPairs.filter((pair) =>
      pair.toLowerCase().includes(query.toLowerCase())
    );
    this.setState({ filteredEanSkus: filtered });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitting: true });

    // Simulate submission
    setTimeout(() => {
      console.log("Form submitted:", this.state);
      this.setState({ submitting: false });
    }, 1000);
  };

  render() {
    const {
      client,
      searchType,
      searchQuery,
      description,
      quantity,
      submitting,
      filteredEanSkus,
    } = this.state;

    const uniqueClientIds = ["ClientA", "ClientB", "ClientC"];

    return (
      <Container fluid>
        <Card className="main-card mb-3">
          <CardBody>
            <CardTitle tag="h5">Create an Order</CardTitle>
            <Form onSubmit={this.handleSubmit}>
              //Client Selector
              <FormGroup className="row mb-3">
                <Label for="clientSelect" className="col-md-3 col-form-label">
                  Client
                </Label>
                <div className="col-md-9">
                  <Input
                    type="select"
                    name="client"
                    id="clientSelect"
                    value={client}
                    onChange={this.handleChange}
                    required
                  >
                    <option value="">Select a client...</option>
                    {uniqueClientIds.map((clientId) => (
                      <option key={clientId} value={clientId}>
                        {clientId}
                      </option>
                    ))}
                  </Input>
                </div>
              </FormGroup>
              <FormGroup className="row mb-3">
                <Label className="col-md-3 col-form-label">Product</Label>
                <div className="col-md-9">
                  <ProductSearch
                    searchType={this.state.searchType}
                    onSelect={(selectedSkuOrEan) =>
                      this.setState({
                        eanSku: selectedSkuOrEan,
                        searchQuery: selectedSkuOrEan,
                      })
                    }
                    onSearchTypeChange={(type) =>
                      this.setState({ searchType: type })
                    }
                  />
                </div>
              </FormGroup>
              //Description
              <FormGroup className="row mb-3">
                <Label
                  for="descriptionInput"
                  className="col-md-3 col-form-label"
                >
                  Description
                </Label>
                <div className="col-md-9">
                  <Input
                    type="text"
                    name="description"
                    id="descriptionInput"
                    placeholder="Automatic food dispenser for ..."
                    value={description}
                    onChange={this.handleChange}
                    required
                  />
                </div>
              </FormGroup>
              //Quantity
              <FormGroup className="row mb-3">
                <Label for="quantityInput" className="col-md-3 col-form-label">
                  Quantity
                </Label>
                <div className="col-md-9">
                  <Input
                    type="number"
                    name="quantity"
                    id="quantityInput"
                    placeholder="Set an amount"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={this.handleChange}
                    required
                  />
                </div>
              </FormGroup>
              //Submit Button
              <FormGroup className="row">
                <div className="col-md-9 offset-md-3">
                  <Button color="primary" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </Container>
    );
  }
}

export default CreateOrderForm;

*/
