import React, { useState, useEffect } from 'react';
import Router from "next/router";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { auth } from "../../firebase/clientApp";
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/clientApp";
import NextLink from 'next/link';
import Link from 'next/link';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MedicationIcon from '@mui/icons-material/Medication';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WorkIcon from '@mui/icons-material/Work';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardShortcutHandler from './KeyboardShortcutHandler';
import { Badge, Button, ListItem, Popover } from '@mui/material';
import { Client, HydrationProvider } from 'react-hydration-provider';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, DialogActions, FormHelperText, MenuItem, Select, Snackbar, TextField } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { grey } from '@mui/material/colors';
import ReportIcon from '@mui/icons-material/Report';
import PermContactCalendarIcon from '@mui/icons-material/PermContactCalendar';
import NoteIcon from '@mui/icons-material/Note';

let userRoleCheck = null;

const Sidebar = () => {

  const [role, setRole] = useState("");
  const [id, setId] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [openSnackBar, setOpenSnackbar] = useState(false);


  const handleSnackbar = () => {
    setOpenSnackbar(true);
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  }
  React.useEffect(() => {
    const storedRole = localStorage.getItem('role');

    const storedId = localStorage.getItem('id');
    userRoleCheck = localStorage.getItem('role');
    console.log("coba", userRoleCheck);
    setRole(storedRole);
    setId(storedId);
    getUserRole(storedId);
    getNotif();
  }, []);

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [isVerified, setIsVerified] = useState(false); // Add state for verification status

  const [notifUser, setNotifUser] = useState([]);

  const getUserRole = async (uid) => {
    const userRef = doc(collection(db, "registeredusers"), uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUserRole(userData.userRole);
      setIsVerified(userData.isAuth || userData.userRole === "admin"); // Check if userRole is "admin"
    }
  };

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  // Handler to open popover
  const handleOpenNotif = () => {
    setAnchorEl(event.currentTarget);
    setIsPopoverOpen(true);
  };

  // Handler to close popover
  const handleClosePopover = () => {
    setIsPopoverOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // setUser(null);
      // setUserRole("");
      localStorage.clear();
      userRoleCheck = null;
      Router.push('/home');
    } catch (error) {
      console.log("Error logging out:", error.message);
    }
  };

  // Access user credentials
  // const { displayName, email } = user || {};
  const handleLogAwikwok = () => {
    console.log('Awikwok');
  };

  const handleLogoutShortcut = () => {
    // Implement your logout logic here
    console.log('Logout');
  };

  const handleOpenAwikwok = () => {
    console.log('Open Awikwok');
  };

  const getNotif = async () => {
    const q = query(collection(db, 'notification'), where('userRole', '==', localStorage.getItem('role')));
    const querySnapshot = await getDocs(q);

    const notif = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    setNotifUser(notif);

  };

  const shortcuts = [
    { key: 'k', action: handleLogAwikwok },
    { key: 'l', action: handleLogoutShortcut },
    { key: 'o', action: handleOpenAwikwok, ctrlKey: true, shiftKey: true },
  ];

  const deleteNotif = async (jobId) => {
    await deleteDoc(doc(db, 'notification', jobId));
    handleSnackbar();
    setAlertMessage("Notifications succesfully deleted!");
    getNotif();
  }
  const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Search Bar
      if (event.altKey && event.key === 'w') {
        console.log("awikwok coba aja");
      }
      // Logout
      else if (event.ctrlKey && event.key === "s") {
        handleLogout();
      }
      // Show Current User Information
      else if (event.altKey && event.key === 'a') {
        setIsSpotlightVisible((prevState) => !prevState);
      }
      //My Job
      else if (event.altKey && event.key === 'd') {
        window.location.href = '/job';
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <HydrationProvider>
      <Client>
        <React.Fragment>
          <AppBar position="fixed">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                <Link href="/dashboard" style={{
                  color: 'white',
                  backgroundColor: 'gainsboro',
                  cursor: 'pointer',
                }}>
                  <ListItemText
                    style={{
                      cursor: 'pointer'
                    }}
                    primary="siLVoam hospital" />
                </Link>
              </Typography>
              <Badge sx={{ mr: 5 }} badgeContent={notifUser.length} color="error">
                <NotificationsIcon sx={{ cursor: 'pointer', height: '25px', width: '25px' }} onClick={handleOpenNotif} />
              </Badge>
              <Popover
                open={isPopoverOpen}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                style={{
                  left: '-295px',
                  top: '-30px',
                }}
              >
                <List>
                  {notifUser.length === 0 ? (
                    <Typography
                      style={{
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                      }}
                    >No notifications</Typography>
                  ) : (
                    <List>
                      {notifUser.map((job, index) => (
                        <ListItem key={index}>
                          <Typography>
                            {job.data.content} ({job.data.notifDate.toDate().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                              second: 'numeric',
                            })})
                          </Typography>
                          <Button onClick={() => {
                            deleteNotif(job.id);
                          }}>
                            <DeleteIcon />
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </List>
              </Popover>
              <Button color="inherit">Hi, {localStorage.getItem('name')} (Role: {localStorage.getItem('role')})</Button>
            </Toolbar>
          </AppBar>
          <Snackbar
            open={openSnackBar}
            autoHideDuration={2000}
            onClose={handleCloseSnackbar}
            ContentProps={{ style: { backgroundColor: 'green' } }}
          >
            <Typography style={{ backgroundColor: '#edf7ed', color: '#2c512d', alignItems: 'center', display: 'flex', flexDirection: 'row', padding: '20px' }}>
              <DoneOutlineIcon style={{ marginRight: '50px' }} />
              {alertMessage}
            </Typography>
          </Snackbar>
          <div style={{}}>
            <KeyboardShortcutHandler shortcuts={shortcuts} />
            {isVerified ? (
              <List>
                <Link href="/job">
                  <ListItemButton>
                    <ListItemIcon>
                      <WorkIcon />
                    </ListItemIcon>
                    <ListItemText primary="My Job" />
                  </ListItemButton>
                </Link>
                <Link href="/report">
                  <ListItemButton>
                    <ListItemIcon>
                      <ReportIcon />
                    </ListItemIcon>
                    <ListItemText primary="Reports" />
                  </ListItemButton>
                </Link>
                <Divider />
                <Link href="/room">
                  <ListItemButton>
                    <ListItemIcon>
                      <MeetingRoomIcon />
                    </ListItemIcon>
                    <ListItemText primary="See All Rooms" />
                  </ListItemButton>
                </Link>
                <Divider />
                {userRoleCheck === 'doctor' && (
                  <>
                    <Link href="/appointment">
                      <ListItemButton>
                        <ListItemIcon>
                          <PermContactCalendarIcon />
                        </ListItemIcon>
                        <ListItemText primary="Appointments" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/pharmacist/viewprescriptions">
                      <ListItemButton>
                        <ListItemIcon>
                          <ReceiptLongIcon />
                        </ListItemIcon>
                        <ListItemText primary="Prescription" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/admin/managepatient">
                      <ListItemButton>
                        <ListItemIcon>
                          <PeopleAltIcon />
                        </ListItemIcon>
                        <ListItemText primary="Manage Patients" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Divider />
                    <Link href="/certificate">
                      <ListItemButton>
                        <ListItemIcon>
                          <NoteIcon />
                        </ListItemIcon>
                        <ListItemText primary="Certificate" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                  </>
                )}
                {userRoleCheck === 'nurse' && (
                  <>
                    <Link href="/appointment">
                      <ListItemButton>
                        <ListItemIcon>
                          <PermContactCalendarIcon />
                        </ListItemIcon>
                        <ListItemText primary="Appointments" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/pharmacist/viewprescriptions">
                      <ListItemButton>
                        <ListItemIcon>
                          <ReceiptLongIcon />
                        </ListItemIcon>
                        <ListItemText primary="Prescription" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/admin/managepatient">
                      <ListItemButton>
                        <ListItemIcon>
                          <PeopleAltIcon />
                        </ListItemIcon>
                        <ListItemText primary="Manage Patients" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Divider />
                    <Link href="/certificate">
                      <ListItemButton>
                        <ListItemIcon>
                          <PermContactCalendarIcon />
                        </ListItemIcon>
                        <ListItemText primary="Certificate" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                  </>
                )}
                {userRoleCheck === 'admin' && (
                  <>
                    <Link href="/admin/managestaff">
                      <ListItemButton>
                        <ListItemIcon>
                          <DoneOutlineIcon />
                        </ListItemIcon>
                        <ListItemText primary="Manage Staff" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/admin/managepatient">
                      <ListItemButton>
                        <ListItemIcon>
                          <PeopleAltIcon />
                        </ListItemIcon>
                        <ListItemText primary="Manage Patients" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/certificate">
                      <ListItemButton>
                        <ListItemIcon>
                          <PermContactCalendarIcon />
                        </ListItemIcon>
                        <ListItemText primary="Certificate" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/ambulance">
                      <ListItemButton>
                        <ListItemIcon>
                          <DirectionsCarIcon />
                        </ListItemIcon>
                        <ListItemText primary="Ambulance" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                  </>
                )}
                {userRoleCheck === 'pharmacist' && (
                  <>
                    <Link href="/pharmacist/viewprescriptions">
                      <ListItemButton>
                        <ListItemIcon>
                          <ReceiptLongIcon />
                        </ListItemIcon>
                        <ListItemText primary="Prescription" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                    <Link href="/pharmacist/viewmedicine">
                      <ListItemButton>
                        <ListItemIcon>
                          <MedicationIcon />
                        </ListItemIcon>
                        <ListItemText primary="Medicine" />
                      </ListItemButton>
                    </Link>
                    <Divider />
                  </>
                )}
                <Divider />
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToAppIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </List>
            ) : (
              <List>
                <Divider />
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToAppIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </List>
            )

            }
            {isSpotlightVisible && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backdropFilter: 'blur(5px)', // Apply blur filter to the background
                  zIndex: 9999,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'gainsboro', // Example background color for the spotlight
                    padding: '30px',
                    borderRadius: '15px',
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '0.5px solid grey',
                  }}
                >
                  <h1>Detailed Current User Information</h1>
                  <h1>Current User: {localStorage.getItem('name')}</h1>
                  <h1>Current Role: {localStorage.getItem('role')}</h1>
                  <h1>Current Id: {localStorage.getItem('id')}</h1>
                </div>
              </div>
            )}
          </div>
        </React.Fragment >
      </Client>
    </HydrationProvider>
  );
};

export default Sidebar;