import React from "react";
import { Table, Button, Input } from "reactstrap";

/**
 * A reusable table component that gets its data and columns from props.
 * @param {object} props
 * @param {Array<string>} props.columns - An array of strings for the table headers.
 * @param {Array<object>} props.data - An array of objects for the table rows. Each object must have a unique 'id' and keys that match the column names.
 * @param {function} [props.handleEdit] - Optional function to handle the edit action.
 * @param {function} [props.handleDelete] - Optional function to handle the delete action.
 * @param {function} [props.onPriceChange] - Optional function to handle changes in unitPrice.
 */
export default class TableHover extends React.Component {
  render() {
    const {
      columns,
      data,
      handleEdit,
      handleDelete,
      onPriceChange,
      rowStyleFunction,
    } = this.props;

    return (
      <Table hover className="mb-0">
        <thead>
          <tr>
            {columns.map((columnName, index) => {
              const style = columnName === "unitPrice" ? { width: "10%" } : {};
              return (
                <th key={index} style={style}>
                  {columnName}
                </th>
              );
            })}
            {(handleEdit || handleDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => {
            const cellBackground = rowIndex % 2 === 0 ? "#f8f9fa" : "white";

            return (
              <tr key={item.id}>
                {columns.map((columnName, index) => {
                  const value = item[columnName];
                  const style = {
                    backgroundColor: cellBackground,
                    ...(columnName === "unitPrice" ? { width: "10%" } : {}),
                  };

                  // ... your existing cell rendering logic ...
                  return (
                    <td key={index} style={style}>
                      {value}
                    </td>
                  );
                })}
                {(handleEdit || handleDelete) && (
                  <td style={{ backgroundColor: cellBackground }}>
                    {handleEdit && (
                      <Button
                        color="info"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                    )}
                    {handleDelete && (
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }
}
