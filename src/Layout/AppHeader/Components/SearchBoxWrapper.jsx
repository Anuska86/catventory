import React from "react";
import { useAuth } from "../../../context/AuthContext";
import SearchBox from "./SearchBox";

const SearchBoxWrapper = () => {
  const { currentUser, loading } = useAuth();

  if (loading || !currentUser) return null;

  return <SearchBox />;
};

export default SearchBoxWrapper;
