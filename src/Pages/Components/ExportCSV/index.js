import React from 'react';
import { Button } from 'reactstrap';

// Funciones de utilidad para CSV
const convertArrayOfObjectsToCSV = (array) => {
    if (!array || array.length === 0) {
        return '';
    }

    // Obtener los encabezados de las columnas del primer objeto
    const headers = Object.keys(array[0]);
    const csvHeaders = headers.join(',');

    // Mapear los datos para crear las filas del CSV
    const csvBody = array.map(row =>
        headers.map(header => {
            let value = row[header];
            if (typeof value === 'object' && value !== null) {
                // Manejar valores de tipo objeto, como fechas de Firebase
                if (value.toDate) {
                    value = value.toDate().toLocaleDateString();
                } else {
                    // O, si es otro objeto, lo convertimos a una representación de string
                    value = JSON.stringify(value);
                }
            }
            
            // Asegurarse de que el valor es un string y manejar comillas dobles
            const processedValue = String(value || '').replace(/"/g, '""');
            return `"${processedValue}"`;
        }).join(',')
    ).join('\n');

    return `${csvHeaders}\n${csvBody}`;
};

// Función para descargar el archivo CSV
const downloadCSV = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Componente para el botón de descarga
const ExportCSV = ({ data, fileName }) => {
    const handleExport = () => {
        if (!data || data.length === 0) {
            console.error("No hay datos para exportar.");
            return;
        }
        const csvContent = convertArrayOfObjectsToCSV(data);
        downloadCSV(csvContent, fileName || 'export.csv');
    };

    return (
        <Button color="primary" style={{float: "inline-end"}} onClick={handleExport}>
            Download CSV
        </Button>
    );
};

export default ExportCSV;