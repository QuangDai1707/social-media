import React, { useEffect, useState } from 'react';
import fetchCurrentUser from '~/apis/home-api.js';

export default function HomeLayout() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const data = await fetchCurrentUser();
        setUsername(data.username);
        console.log(data?data:123)
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };

    fetchUsername();
  }, []); // Empty dependency array means this effect runs once on mount
  return (
    <>
    <h1>Username: {username}</h1>
    </>
  )
}
