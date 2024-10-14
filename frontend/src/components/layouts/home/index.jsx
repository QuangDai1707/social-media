import React, { useEffect, useState } from 'react';
import fetchCurrentUser from '~/apis/home-api.js';

export default function HomeLayout() {
  // const [username, setUsername] = useState('');

  // useEffect(() => {
  //   const fetchUsername = async () => {
  //     try {
  //       const data = await fetchCurrentUser();
  //       setUsername(data.username);
  //       console.log(data?data:123)
  //     } catch (error) {
  //       console.error('Error fetching username:', error);
  //     }
  //   };

  //   fetchUsername();
  // }, []); // Empty dependency array means this effect runs once on mount
  // return (
  //   <>
  //   <h1>Username: {username}</h1>
  //   </>
  // )
  const [streamData, setStreamData] = useState([]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:7000');

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        socket.onmessage = (event) => {
            // const newData = JSON.parse(event.data);
            const newData = event.data;
            setStreamData((prevData) => [...prevData, newData]);
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socket.close();
        };
    }, []);

    return (
        <div>
            <h1>Recent Wikipedia Changes</h1>
            <ul>
                {streamData.map((data, index) => (
                    <li key={index}>{data || "No comment available"}</li>
                ))}
            </ul>
        </div>
    );
}
