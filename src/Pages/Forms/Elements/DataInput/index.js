import React, { Fragment } from "react";
import { CSSTransition, TransitionGroup } from '../../../../utils/TransitionWrapper';
import { Col, Row, Card, CardBody } from "reactstrap";
import DataForm from "../../Components/DataForm";

class FormDataInput extends React.Component {
  render() {
    return (
      <Fragment>
        <TransitionGroup>
          <CSSTransition component="div" classNames="TabsAnimation" appear={true}
            timeout={1500} enter={false} exit={false}>
            <Row>
              <Col lg="12">
                <Card className="main-card mb-3">
                  <CardBody>
                  <DataForm />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </TransitionGroup>
      </Fragment >
    );
  }
}

export default FormDataInput;
