import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import Sidebar from '../components/Sidebar';
import { Alert, Box, DialogActions, Fab, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/material';
import { async } from '@firebase/util';
import { HydrationProvider, Client } from 'react-hydration-provider';
import { DataGrid } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material';
import { getAuth, deleteUser } from 'firebase/auth';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { timeStamp } from 'console';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

const getBackgroundColorForStatus = (queueStatus) => {
    if (queueStatus === 'available') {
        return 'green';
    } else if (queueStatus === 'used') {
        return 'blue';
    }
    else if (queueStatus === 'unusable') {
        return 'red';
    }
}

let selectedAmbId = null;

function ViewMedicine() {
    const [displayedAmbulance, setDisplayedAmbulance] = useState([]);
    const [usedAmbulance, setUsedAmbulance] = useState([]);
    const [dataChange, setDataChange] = useState(false);

    const [ambulanceDesc, setAmbulanceDesc] = useState("");
    const [ambulancePoliceNumber, setAmbulancePoliceNumber] = useState("");
    const [ambulanceStatus, setAmbulanceStatus] = useState("");
    const [ambulanceYear, setAmbulanceYear] = useState("");
    const [ambulanceType, setAmbulanceType] = useState("");
    const [selectedDriver, setSelectedDriver] = useState("");

    const [openForm1, setOpenForm1] = useState(false);
    const [openForm2, setOpenForm2] = useState(false);
    const [openForm3, setOpenForm3] = useState(false);

    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [clickedMedId, setClickedMedId] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [banReason, setBanReason] = useState("");

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState(null);
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const openDialog1 = () => {
        setOpenForm1(true);
    }

    const closeDialog1 = () => {
        setOpenForm1(false);
        setClickedMedId(null);
    }

    const openDialog2 = () => {
        fetchDriver();
        setOpenForm2(true);
    }

    const closeDialog2 = () => {
        setOpenForm2(false);
        setClickedMedId(null);
    }

    const openDialog3 = (ambId) => {
        selectedAmbId = ambId;
        setOpenForm3(true);
    }

    const closeDialog3 = () => {
        setOpenForm3(false);
        setClickedMedId(null);
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    // const handleSearch = (query) => {
    //     setSearchQuery(query);
    //     const formattedQuery = query.toLowerCase();
    //     const filteredMed = di.filter((med) =>
    //         med.data.medicineName.toLowerCase().includes(formattedQuery)
    //     );
    //     setSearchResults(filteredMed);
    // };

    const [openCheckEmergency, setOpenCheckEmergency] = useState(false);

    const handleOpenCheckEmegencyRoom = async () => {
        setOpenCheckEmergency(true);
    }

    const handleCloseCheckEmergencyRoom = async () => {
        setOpenCheckEmergency(false);
    }

    const registerNewPatient = async () => {
        fetchAvailableRooms();
        handleOpenCheckEmegencyRoom();
    };

    const [availableRooms, setAvailableRooms] = useState([]);

    const fetchAvailableRooms = async () => {
        try {
            const q = query(collection(db, 'room'), where('roomType', '==', "emergency"));
            const querySnapshot = await getDocs(q);
            const rooms = [];

            for (const doc1 of querySnapshot.docs) {
                const roomData = doc1.data();
                const bedsDocRef = roomData.bedCollection;
                const bedData = [];

                if (bedsDocRef && bedsDocRef.length > 0) {
                    for (const bedRef of bedsDocRef) {
                        const bedDocSnapshot = await getDoc(doc(db, 'bed', bedRef));

                        if (bedDocSnapshot.exists()) {
                            const bed = bedDocSnapshot.data();

                            if (bed.bedStatus === 'available') { // Check if bedStatus is "available"
                                bed.id = bedDocSnapshot.id; // Assign the id to the bed object
                                bedData.push(bed);
                            }
                        }
                    }
                }

                const room = {
                    id: doc1.id,
                    data: {
                        ...roomData,
                        bed: bedData,
                    },
                };

                rooms.push(room);
            }

            setAvailableRooms(rooms);
            console.log(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    const [driver, setDriver] = useState([]);

    const fetchDriver = async () => {
        const q = query(collection(db, 'registeredusers'), where('userRole', '==', 'driver'));
        const doctorSnapshot = await getDocs(q);
        const doctorData = doctorSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setDriver(doctorData);

    }

    const assignPatient = async (bedId1: string, roomId1: string) => {
        console.log(bedId1, roomId1);
        const patientRef = collection(db, 'patient');
        const timestampDob = Timestamp.fromDate(dob.toDate()); // Convert JavaScript Date to a Firestore Timestamp

        const newPatient = {
            patientName: name,
            patientPhone: phone,
            patientGender: gender,
            patientDob: timestampDob,
            patientEmail: email,
            patientAddress: address,
            patientSymptoms: null,
            isHandled: false,
            handledBy: [],
            isDone: false,
            bedID: null,
            isAssigned: false,
        };

        const newPatientId = await addDoc(patientRef, newPatient);

        await updateDoc(doc(db, 'patient', newPatientId.id), {
            bedId: bedId1,
            isAssigned: true,
            assignedDate: Timestamp.now(),
        });

        await updateDoc(doc(db, 'bed', bedId1), {
            bedStatus: "unusable",
        });

        try {
            const jobRef = collection(db, 'job');
            const currentTimestamp = serverTimestamp();

            // Determine the value for jobDue based on the current time
            const currentTime = new Date();
            const tenAM = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 10, 0, 0, 0);
            const twoPM = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 14, 0, 0, 0);
            const eightPM = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 20, 0, 0, 0);

            let jobDue;
            if (currentTime < tenAM) {
                jobDue = tenAM;
            } else if (currentTime < twoPM) {
                jobDue = twoPM;
            } else {
                jobDue = eightPM;
            }

            const newJob = {
                jobAssigned: currentTimestamp,
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Assign Patient Bed",
                jobStatus: "unfinished",
                patientId: newPatientId.id,
                roomId: roomId1,
                staffRole: "nurse",
                bedId: bedId1,
                isDone: false,
                jobType: 'auto-assign',
            };

            const newJob2 = {
                jobAssigned: currentTimestamp,
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Picking Up Patient",
                jobStatus: "unfinished",
                patientId: newPatientId.id,
                roomId: roomId1,
                staffRole: "driver",
                bedId: bedId1,
                isDone: false,
                ambulanceId: selectedAmbId,
                jobType: 'auto-assign',
            };

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "nurse",
                content: "Assign Patient",
                notifDate: Timestamp.now(),
            })

            await addDoc(notifRef, {
                userRole: "driver",
                content: "Picking Up Patient",
                notifDate: Timestamp.now(),
            })

            const ambDocRef = doc(db, 'ambulance', selectedAmbId);

            await updateDoc(ambDocRef, {
                ambulanceStatus: "used",
                patientId: newPatientId.id,
                ambulanceDesc: "On my way!!!",
                driverId: selectedDriver,
            })

            try {
                await addDoc(jobRef, newJob);
                await addDoc(jobRef, newJob2);
                handleSnackbar();
                setAlertMessage("Ambulance succesfully used!");
                handleCloseCheckEmergencyRoom();
                handleCloseBanAmbulance();
                closeDialog2();
                setDataChange(true);
            } catch (error) {
                console.log(error);
            }
        } catch (error) {
            console.error(error);
        }
    }


    const getAmbulance = async () => {
        try {
            const q = query(collection(db, 'ambulance'));
            const querySnapshot = await getDocs(q);
            const ambulanceData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                data: doc.data()
            }));
            setDisplayedAmbulance(ambulanceData);
        }
        catch {
            console.log("error");
        }
    }

    const getUsedAmbulance = async () => {
        try {
            const q = query(collection(db, 'ambulance'), where('ambulanceStatus', '==', 'used'));
            const querySnapshot = await getDocs(q);
            const usedAmbulance = [];

            for (const doc1 of querySnapshot.docs) {
                const ambulanceData = doc1.data();
                const patientDocRef = ambulanceData.patientId;
                const driverDocRef = ambulanceData.driverId;

                let patientData = null;
                let driverData = null;

                if (patientDocRef) {
                    const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                    if (patientDocSnapshot.exists()) {
                        patientData = patientDocSnapshot.data();
                    }
                }

                if (driverDocRef){
                    const driverDocSnapshot = await getDoc(doc(db, 'registeredusers', driverDocRef));
                    if (driverDocSnapshot.exists()){
                        driverData = driverDocSnapshot.data();
                    }
                }

                usedAmbulance.push({
                    id: doc1.id,
                    data: {
                        ...ambulanceData,
                        patient: patientData,
                        driver: driverData,
                    },
                });
            }

            setUsedAmbulance(usedAmbulance);
        }
        catch {
            console.log("error");
        }
    }

    const registerNewAmbulance = async () => {
        const ambulanceRef = collection(db, 'ambulance');
        const newAmbulance = {
            ambulancePoliceNumber: ambulancePoliceNumber,
            ambulanceStatus: "available",
            ambulanceType: ambulanceType,
            ambulanceYear: ambulanceYear,
            ambulanceDesc: "Ready to serve the nation!",
        };

        try {
            await addDoc(ambulanceRef, newAmbulance);
            handleSnackbar();
            setAlertMessage("Ambulance succesfully added!");
            closeDialog1();
            setDataChange(true);
            // Optionally, you can perform any additional logic or show a success message.
        } catch (error) {
            console.error('Error registering patient:', error);
            // Optionally, you can handle the error and show an error message to the user.
        }
    };

    const [openBanAmbulance, setOpenBanAmbulance] = useState(false);

    const handleOpenBanAmbulance = () => {
        setOpenBanAmbulance(true);
    }

    const handleCloseBanAmbulance = () => {
        setOpenBanAmbulance(false);
    }

    const banAmbulance = async (ambId: string) => {
        try {
            const docRef = doc(db, 'ambulance', ambId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    ambulanceStatus: 'unusable',
                    ambulanceDesc: banReason,
                });
                setAlertMessage("Ambulance succesfully banned!");
                handleSnackbar();
                handleCloseBanAmbulance();
                setDataChange(true);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    //Fetch for the first time
    useEffect(() => {
        getAmbulance();
        getUsedAmbulance();
    }, []);

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            getAmbulance();
            getUsedAmbulance();
            setClickedMedId(null);
            setDataChange(false);
        }
    }, [dataChange]);

    // const medicineList = searchQuery ? searchResults : displayedMedicine;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Ambulance List</h1>
                            {/* <TextField
                                label="Search Staff"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{width: '180px'}}
                            /> */}
                            <Button
                                variant="contained"
                                onClick={() => {
                                    openDialog1();
                                }}
                                style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                            >
                                Add Ambulance
                            </Button>
                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '50px' }}>
                                <DataGrid
                                    columns={[
                                        { field: 'ambulanceType', headerName: 'Ambulance Type', width: 200 },
                                        { field: 'ambulancePoliceNumber', headerName: 'Ambulance Police Number', width: 200 },
                                        { field: 'ambulanceYear', headerName: 'Ambulance Year', width: 160 },
                                        {
                                            field: 'ambulanceStatus', headerName: 'Ambulance Status', width: 180, renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColorForStatus(params.row.ambulanceStatus),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.ambulanceStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'ambulanceDesc', headerName: 'Ambulance Description', width: 210 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 400,
                                            renderCell: (params) => (
                                                <div>
                                                    {params.row.ambulanceStatus === 'available' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                selectedAmbId = params.row.id;
                                                                openDialog2();
                                                            }}
                                                        // disabled={approvedId === params.row.id}
                                                        >
                                                            {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                            Use Ambulance
                                                        </Button>

                                                    )}
                                                    {params.row.ambulanceStatus == 'available' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                selectedAmbId = params.row.id
                                                                handleOpenBanAmbulance();
                                                            }}
                                                            style={{ marginLeft: '50px' }}
                                                        >
                                                            Ban Ambulance
                                                        </Button>
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}

                                    rows={displayedAmbulance.map((med) => ({
                                        id: med.id,
                                        ambulanceType: med.data.ambulanceType,
                                        ambulancePoliceNumber: med.data.ambulancePoliceNumber,
                                        ambulanceYear: med.data.ambulanceYear,
                                        ambulanceStatus: med.data.ambulanceStatus,
                                        ambulanceDesc: med.data.ambulanceDesc,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                            <h1>Used Ambulance List</h1>
                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '20px' }}>
                                <DataGrid
                                    columns={[
                                        { field: 'ambulanceType', headerName: 'Ambulance Type', width: 200 },
                                        { field: 'ambulancePoliceNumber', headerName: 'Ambulance Police Number', width: 200 },
                                        { field: 'ambulanceYear', headerName: 'Ambulance Year', width: 160 },
                                        {
                                            field: 'ambulanceStatus', headerName: 'Ambulance Status', width: 180, renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColorForStatus(params.row.ambulanceStatus),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.ambulanceStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'ambulanceDesc', headerName: 'Ambulance Description', width: 210 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 400,
                                            renderCell: (params) => (
                                                <div>
                                                    {params.row.ambulanceStatus === 'available' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                selectedAmbId = params.row.id;
                                                                openDialog2();
                                                            }}
                                                        // disabled={approvedId === params.row.id}
                                                        >
                                                            {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                            Use Ambulance
                                                        </Button>

                                                    )}
                                                    {params.row.ambulanceStatus == 'available' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                selectedAmbId = params.row.id
                                                                handleOpenBanAmbulance();
                                                            }}
                                                            style={{ marginLeft: '50px' }}
                                                        >
                                                            Ban Ambulance
                                                        </Button>
                                                    )}
                                                </div>
                                            ),
                                        },
                                        { field: 'handledBy', headerName: 'Handled By', width: 210 },
                                    ]}

                                    rows={usedAmbulance.map((med) => ({
                                        id: med.id,
                                        ambulanceType: med.data.ambulanceType,
                                        ambulancePoliceNumber: med.data.ambulancePoliceNumber,
                                        ambulanceYear: med.data.ambulanceYear,
                                        ambulanceStatus: med.data.ambulanceStatus,
                                        ambulanceDesc: med.data.ambulanceDesc,
                                        handledBy: med.data.driver ? med.data.driver.userName: "No Driver",
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openForm1} onClose={closeDialog1}>
                        <DialogTitle>Add New Ambulance</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineType"
                                label="Ambulance Police Number"
                                type="text"
                                id="medicineType"
                                value={ambulancePoliceNumber}
                                onChange={(e) => setAmbulancePoliceNumber(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />

                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicinePrice"
                                label="Ambulance Year"
                                type="medicinePrice"
                                id="medicinePrice"
                                value={ambulanceYear}
                                onChange={(e) => setAmbulanceYear(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Type:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAmbulanceType(e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="type1">Type 1</MenuItem>
                                <MenuItem value="type2">Type 2</MenuItem>
                                <MenuItem value="type3">Type 3</MenuItem>
                            </Select>
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={registerNewAmbulance} fullWidth>
                                    Register New Ambulance
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openBanAmbulance} onClose={handleCloseBanAmbulance}>
                        <DialogTitle>Ban Ambulance </DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="name"
                                label="Ban Reason"
                                type="text"
                                id="name"
                                autoFocus
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />

                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={(e) => banAmbulance(selectedAmbId)} fullWidth>
                                    Ban Ambulance
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm2} onClose={closeDialog2}>
                        <DialogTitle>Using Ambulance</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="name"
                                label="Name"
                                type="text"
                                id="name"
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="phone"
                                label="Phone"
                                type="text"
                                id="name"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Gender:
                            </Typography>
                            <Select defaultValue="default" onChange={(e) => setGender(e.target.value)} style={{ width: '100%' }}>
                                <MenuItem value="default">Select Gender</MenuItem>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                            </Select>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="DOB"
                                    value={dob}
                                    onChange={(newValue) => setDob(newValue)}
                                    sx={{ width: '100%', marginTop: '28px' }}
                                />
                            </LocalizationProvider>

                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="email"
                                label="Email"
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="address"
                                label="Address"
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Driver:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                fullWidth
                            >
                                {driver.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.userName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={registerNewPatient} fullWidth>
                                    Register New Patient
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openCheckEmergency} onClose={handleCloseCheckEmergencyRoom} maxWidth={false} fullWidth>
                        <DialogTitle>Move Bed</DialogTitle>
                        <DialogContent>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <h2>Choose rooms!</h2>
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'stretch' }}>
                                    {availableRooms
                                        .sort((a, b) => a.data.roomNumber.localeCompare(b.data.roomNumber))
                                        .map((room) => {
                                            return (
                                                <div
                                                    key={room.id}
                                                    style={{
                                                        display: 'flex',
                                                        width: '350px',
                                                        backgroundColor: '#5c74ec',
                                                        flexDirection: 'column',
                                                        margin: '55px',
                                                        alignItems: 'center',
                                                        textAlign: 'center',
                                                        color: 'black'
                                                    }}
                                                >
                                                    <h3>{room.data.roomNumber}</h3>
                                                    <h3>{room.data.roomType}</h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                                        {room.data.bed.length === 0 ? (
                                                            <Typography variant='h6'>
                                                                No Available Beds in this emergency {room.data.roomNumber} room
                                                            </Typography>
                                                        ) : (
                                                            room.data.bed.map((bed) => (
                                                                <Button
                                                                    onClick={() =>
                                                                        assignPatient(bed.id, room.id)}
                                                                >
                                                                    <div
                                                                        key={bed.bedNumber}
                                                                        style={{
                                                                            backgroundColor: bed.bedStatus === 'used' ? '#d9740f' : bed.bedStatus === 'unusable' ? '#0055de' : 'green',
                                                                            margin: '10px',
                                                                            width: '100px',
                                                                            color: 'white',
                                                                        }}
                                                                    >
                                                                        <p>{bed.bedNumber}</p>
                                                                        <p>{bed.bedStatus}</p>
                                                                    </div>
                                                                </Button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Box>
                        </DialogContent>
                    </Dialog>
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
                </React.Fragment>
            </Client>
        </HydrationProvider >

    );
}

export default ViewMedicine;
