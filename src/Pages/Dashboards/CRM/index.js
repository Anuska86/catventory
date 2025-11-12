import React, { Component, Fragment } from "react";
import { CSSTransition, TransitionGroup  } from '../../../utils/TransitionWrapper';

import PageTitleAlt2 from "../../../Layout/AppMain/PageTitleAlt2";

import Tabs, { TabPane } from '../../../utils/TabsWrapper';
import { TabContent } from '../../../utils/TabsWrapper';
import { ScrollableInkTabBar } from '../../../utils/TabsWrapper';

// Examples
import CRMDashboard1 from "./Examples/Variation1";
import CRMDashboard2 from "./Examples/Variation2";

export default class CRMDashboard extends Component {
  render() {
    return (
      <Fragment>
        <TransitionGroup>
          <CSSTransition component="div" classNames="TabsAnimation" appear={true}
            timeout={1500} enter={false} exit={false}>
            <div>
              <PageTitleAlt2 heading="Overview"
                subheading="Company status"
                icon="pe-7s-graph icon-gradient bg-ripe-malin"/>
              <Tabs defaultActiveKey="1"
                renderTabBar={() => <ScrollableInkTabBar />}
                renderTabContent={() => <TabContent />}>
                <TabPane tab="KPIs" key="1">
                  <CRMDashboard2 />
                </TabPane>
                <TabPane tab="Orders" key="2">
                  <CRMDashboard1 />
                </TabPane>
                <TabPane tab="Billing" key="3">
                  <CRMDashboard1 />
                </TabPane>
                <TabPane tab="Warehouses" key="4">
                  <CRMDashboard1 />
                </TabPane>
              </Tabs>
            </div>
          </CSSTransition>
        </TransitionGroup>
      </Fragment>
    );
  }
}
