// src/api/fetchCurrentUser.js

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const fetchCurrentUser = async () => {
  const response = await fetch(`${BACKEND_URL}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Error fetching user");
  }

  return response.json();
};

export default fetchCurrentUser; // Ensure this matches your import
