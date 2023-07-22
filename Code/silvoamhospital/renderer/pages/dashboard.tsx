import React, { useEffect, useState } from "react";
import { DialogContentText, Box, Button } from "@mui/material";
import { auth } from "../../firebase/clientApp";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import Router from "next/router";
import Sidebar from "../components/Sidebar";


function Dashboard() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [isVerified, setIsVerified] = useState(false); // Add state for verification status

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // User is logged in
        setUser(currentUser);
        getUserRole(currentUser.uid);
      } else {
        // User is not logged in
        setUser(null);
        setUserRole("");
      }
      getNotif();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [notifUser, setNotifUser] = useState([]);

  const getNotif = async () => {
    const q = query(collection(db, 'notification'), where('userRole', '==', localStorage.getItem('role')));
    const querySnapshot = await getDocs(q);

    const notif = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    setNotifUser(notif);

  };

  const getUserRole = async (uid) => {
    const userRef = doc(collection(db, "registeredusers"), uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUserRole(userData.userRole);
      setIsVerified(userData.isAuth || userData.userRole === "admin"); // Check if userRole is "admin"
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserRole("");
      Router.push('/home');
    } catch (error) {
      console.log("Error logging out:", error.message);
    }
  };

  // Access user credentials
  const { displayName, email } = user || {};

  return (
    <React.Fragment>
      <Box sx={{ display: "flex", marginTop: '75px' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <h1>Hi, {localStorage.getItem('name')}</h1>
            <h1>You're logged in as {localStorage.getItem('role')}</h1>
            <h1>Welcome to siLVoam hospital</h1>
            <br></br>
            {isVerified ? (
              <div>
                <h1>
                  You are verified, now you have access to our application! Use your rights wisely!
                </h1></div>
            ) : (
              <div>
                <h1>You are not verified!<br></br>Please wait until our admin approve yours.</h1>
              </div>
            )}
          </div>
        </Box>
      </Box>
    </React.Fragment>
  );
}

export default Dashboard;
