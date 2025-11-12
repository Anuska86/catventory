import { useState } from "react";
import "./MicroCalendar.css";
import Calendar from "react-calendar";

export default function MicroCalendar({ onDateSelected }) {
  const [value, setValue] = useState(new Date());

  const handleChange = (date) => {
    setValue(date);
    if (onDateSelected) {
      onDateSelected(date);
    }
  };

  return (
    <div>
      <Calendar onChange={handleChange} value={value} />
    </div>
  );
}
