import React from "react";
import NotificationCard from "./NotificationCard";
import { fetchNotifications } from "../../utils/notificationService";
import { Button } from "reactstrap";

class NotificationsPage extends React.Component {
  state = {
    notifications: [],
    visibleCount: 9,
    loading: true,
  };

  async componentDidMount() {
    const notifications = await fetchNotifications();

    const sortedNotifications = notifications.sort(
      (a, b) => b.date.seconds - a.date.seconds
    );

    this.setState({ notifications: sortedNotifications, loading: false });
  }

  loadMore = () => {
    this.setState((prevState) => ({
      visibleCount: prevState.visibleCount + 9,
    }));
  };

  render() {
    const { notifications, loading, visibleCount } = this.state;
    const visibleNotifications = notifications.slice(0, visibleCount);

    return (
      <div className="text-center mb-4">
        <h2 style={{ marginBottom: "20px" }}>All Notifications</h2>

        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          <>
            <div className="row g-4 notifications-list">
              {visibleNotifications.map((notification) => (
                <div className="col-md-4 h-60" key={notification.id}>
                  <NotificationCard data={notification} />
                </div>
              ))}
            </div>

            {visibleCount < notifications.length && (
              <div className="text-center mt-3">
                <Button color="primary" onClick={this.loadMore}>
                  View More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
}

export default NotificationsPage;
