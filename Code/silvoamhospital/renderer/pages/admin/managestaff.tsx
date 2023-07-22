import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, FieldPath, Timestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/clientApp';
import Sidebar from '../../components/Sidebar';
import { Box, DialogActions, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
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
import { documentId } from 'firebase/firestore';
import MuiAlert, { AlertProps } from '@mui/lab/Alert';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugion from "@fullcalendar/interaction";
import listPlugin from "@fullCalendar/list"
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { RenderCellExpand } from '../../components/RenderCellExpand';

// import { format } from 'date-fns';

const getBackgroundColor = (jobStatus) => {
    if (jobStatus === 'unfinished') {
        return 'darkblue';
    } else if (jobStatus === 'late') {
        return 'red';
    } else if (jobStatus === 'completed') {
        return 'green';
    }

    return '';
}

function ManageStaff() {
    const [unregisteredUsers, setUnregisteredUsers] = useState([]);
    const [dataChange, setDataChange] = useState(false);
    const [approvedId, setApprovedId] = useState("NONE");
    const [userId, setUserId] = useState("");

    const [alertMessage, setAlertMessage] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [open, setOpen] = React.useState(false);
    const [user, setUser] = useState(null);
    const [shifts, setShifts] = useState([]);


    const [allJob, setAllJob] = useState([]);

    const [sameShiftRole, setSameShiftRole] = useState([]);

    const [registeredStaff, setRegisteredStaff] = useState([]);

    const [openDialog2, setOpenDialog2] = useState(false)

    const [openDialog3, setOpenDialog3] = useState(false)

    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [selectedNewRoles, setSelectedNewRoles] = useState('');

    const [clickedUserId, setClickedUserId] = useState("");

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [searchQuery1, setSearchQuery1] = useState('');
    const [searchResults1, setSearchResults1] = useState([]);

    const [openAddRoutine, setOpenAddRoutine] = useState(false);

    const handleOpenAddRoutine = async () => {
        setOpenAddRoutine(true);
    }

    const handleCloseAddRoutine = async () => {
        setOpenAddRoutine(false);
    }

    const handleSearch1 = (query) => {
        setSearchQuery1(query);
        const formattedQuery = query.toLowerCase();
        const filteredResults = myCompleteJob.filter((job) =>
            job.data.jobName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults1(filteredResults);
        setDataChange(true);
    };

    // Job
    const [jobCategory, setJobCategory] = useState("");
    const [jobDue, setJobDue] = useState(null);
    const [jobName, setJobName] = useState("");
    const [jobRole, setJobRole] = useState("");
    const [jobTime, setJobTime] = useState(null);
    const [myCompleteJob, setMyCompleteJob] = useState([]);

    const getCompleteJob = async () => {
        try {
            const q = query(collection(db, 'job'));
            const querySnapshot = await getDocs(q);
            const finishedJobs = [];

            for (const doc1 of querySnapshot.docs) {
                const jobData = doc1.data();
                const patientDocRef = jobData.patientId;
                const roomDocRef = jobData.roomId;
                const staffDocRef = jobData.doneBy;

                let patientData = null;
                let roomData = null;
                let staffData = null;

                if (patientDocRef) {
                    const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                    if (patientDocSnapshot.exists()) {
                        patientData = patientDocSnapshot.data();
                    }
                }

                if (roomDocRef) {
                    const roomDocSnapshot = await getDoc(doc(db, 'room', roomDocRef));
                    if (roomDocSnapshot.exists()) {
                        roomData = roomDocSnapshot.data();
                    }
                }

                if (staffDocRef) {
                    const staffDocSnapshot = await getDoc(doc(db, 'registeredusers', staffDocRef));
                    if (staffDocSnapshot.exists()) {
                        staffData = staffDocSnapshot.data();
                    }
                }
                finishedJobs.push({
                    id: doc1.id,
                    data: {
                        ...jobData,
                        patient: patientData,
                        room: roomData,
                        staff: staffData,
                    },
                });
            }
            setMyCompleteJob(finishedJobs);
        } catch (error) {
            console.log(error);
        }
    }



    function Alert(props: AlertProps) {
        return <MuiAlert elevation={6} variant="filled" {...props} />;
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleOpenModal = async (userRole: string, userId: string) => {
        setOpen(true);
        getSameShiftRole(userRole, userId);
    };

    const handleOpenDialog2 = async (userId: string) => {
        setOpenDialog2(true);
    }

    const handleOpenDialog3 = async (userId: string) => {
        setOpenDialog3(true);
    }

    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredStaff = registeredStaff.filter((staff) =>
            staff.data.userName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredStaff);
    };

    const getSameShiftRole = async (userRole: string, userIdExclue: string) => {
        console.log(userRole);
        try {
            const q = query(collection(db, 'registeredusers'), where('userRole', '==', userRole), where(documentId(), '!=', userIdExclue));
            const querySnapshot = await getDocs(q);
            const sameRoleUser = [];

            for (const doc1 of querySnapshot.docs) {
                const userData = doc1.data();
                const shiftDocRef = userData.userShift; // Assuming userShift is a reference to a shift document
                let shiftData = null;
                if (shiftDocRef) {
                    const shiftDocSnapshot = await getDoc(doc(db, 'shift', shiftDocRef));
                    if (shiftDocSnapshot.exists()) {
                        shiftData = shiftDocSnapshot.data();
                        console.log(shiftData);
                    }
                }

                sameRoleUser.push({
                    id: doc1.id,
                    data: {
                        ...userData,
                        userShift: shiftData,
                    },
                });
            }

            setSameShiftRole(sameRoleUser);
        } catch (error) {
            console.log('Error fetching same role users:', error);
        }
    }

    const getJob = async () => {
        try {
            const q = query(collection(db, 'job'));
            const querySnapshot = await getDocs(q);
            const jobs = [];
            const currentTimestamp = new Date();

            for (const doc1 of querySnapshot.docs) {
                const jobData = doc1.data();
                const patientDocRef = jobData.patientId;
                const roomDocRef = jobData.roomId;

                let patientData = null;
                let roomData = null;

                if (patientDocRef) {
                    const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                    if (patientDocSnapshot.exists()) {
                        patientData = patientDocSnapshot.data();
                    }
                }

                if (roomDocRef) {
                    const roomDocSnapshot = await getDoc(doc(db, 'room', roomDocRef));
                    if (roomDocSnapshot.exists()) {
                        roomData = roomDocSnapshot.data();
                    }
                }

                if (jobData.jobDue) {
                    if (Timestamp.now().toMillis() > jobData.jobDue.toMillis()) {
                        jobData.jobStatus = 'late';
                        await updateDoc(doc(db, 'job', doc1.id), { jobStatus: 'late' });
                    }
                }

                jobs.push({
                    id: doc1.id,
                    data: {
                        ...jobData,
                        patient: patientData,
                        room: roomData,
                    },
                });
            }
            setAllJob(jobs);
        } catch (error) {
            console.log(error);
        }
    };



    // Get Shift
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'shift'));
                const shiftData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    data: doc.data(),
                }));
                setShifts(shiftData);
            } catch (error) {
                console.error('Error fetching shifts:', error);
            }
        };
        getCompleteJob();
        fetchShifts();
        getJob();
    }, []);

    const handleCloseModal = () => {
        setOpen(false); // Close the modal
        setClickedUserId(null);
    };

    const handleCloseModal2 = () => {
        setOpenDialog2(false);
        setClickedUserId(null);
    }

    const filterJobs1 = () => {
        setSearchQuery1("awikwok");
        const filteredResults1 = myCompleteJob.filter((job) => {
            const jobDate = job.data.jobAssigned.toDate();
            return jobDate >= startDate.toDate() && jobDate <= endDate.toDate();
        });

        setSearchResults1(filteredResults1);
        setDataChange(true);
    };

    const handleCloseModal3 = () => {
        setOpenDialog3(false);
        setClickedUserId(null);
    }

    const handleAssignShift = (shiftId: string) => {
        handleApprove(userId, shiftId);
        handleCloseModal(); // Close the modal after assigning the shift
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleClose = (event: any, reason: any) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            fetchUnregisteredUsers();
            fetchAllStaff();
            getCompleteJob();
            setDataChange(false);
        }
    }, [dataChange]);

    //Fetch for the first time
    useEffect(() => {
        fetchUnregisteredUsers();
        fetchAllStaff();
        getCompleteJob();
    }, []);

    const fetchUnregisteredUsers = async () => {
        try {
            const q = query(collection(db, 'registeredusers'), where('isAuth', '==', false));
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                data: doc.data(),
            }));
            // setUnregisteredUsers([]);
            setUnregisteredUsers(users);
        } catch (error) {
            console.log('Error fetching unregistered users:', error);
        }
        setApprovedId("NONE");

    };

    const fetchAllStaff = async () => {
        try {
            const q = query(collection(db, 'registeredusers'), where('isAuth', '==', true));
            const querySnapshot = await getDocs(q);
            const staff = [];

            for (const doc1 of querySnapshot.docs) {
                const userData = doc1.data();
                const shiftDocRef = userData.userShift; // Assuming userShift is a reference to a shift document
                let shiftData = null;
                if (shiftDocRef) {
                    const shiftDocSnapshot = await getDoc(doc(db, 'shift', shiftDocRef));
                    if (shiftDocSnapshot.exists()) {
                        shiftData = shiftDocSnapshot.data();
                    }
                }

                staff.push({
                    id: doc1.id,
                    data: {
                        ...userData,
                        userShift: shiftData,
                    },
                });
            }

            setRegisteredStaff(staff);
        } catch (error) {
            console.log('Error fetching registered users:', error);
        }

    }

    const handleApprove = async (uuid: string, shiftId: string) => {
        setApprovedId(uuid);
        console.log(shiftId);

        const notifRef = collection(db, 'notification');


        try {
            const docRef = doc(db, 'registeredusers', uuid);
            const docSnapshot = await getDoc(docRef);

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: docSnapshot.data().userRole,
                content: "Account succesfully approved!",
                notifDate: Timestamp.now(),
            })

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    isAuth: true,
                    userShift: shiftId,
                    approved_at: serverTimestamp()
                });
                setAlertMessage("Staff succesfully approved!");
                handleSnackbar();
                setApprovedId("NONE");
                setDataChange(true);
            } else {
                console.log('User not found!');
            }
        } catch (error) {
            console.error('Error updating user approval status:', error);
        }
    };

    const addNonRoutine = async () => {
        try {
            const jobRef = collection(db, 'job');

            const combinedDateTime = new Date(jobDue);
            combinedDateTime.setHours(parseInt(jobTime.substr(0, 2)));
            combinedDateTime.setMinutes(parseInt(jobTime.substr(3, 2)));

            const timestamp = Timestamp.fromDate(combinedDateTime);

            const newJob = {
                jobAssigned: serverTimestamp(),
                jobCategory: jobCategory,
                jobDone: null,
                jobDue: timestamp,
                jobName: jobName,
                jobStatus: "unfinished",
                staffRole: jobRole,
                isDone: false,
                jobType: 'non-routine',
            }

            await addDoc(jobRef, newJob);
            handleSnackbar();
            setAlertMessage("Non-Routine Job Succesfully Added!");
            handleCloseAddRoutine();
            setDataChange(true);
        } catch (error) {
            console.log(error);
        }
    }

    const updateStaffRoles = async (uuid: string) => {
        setApprovedId(uuid);
        try {
            const docRef = doc(db, 'registeredusers', uuid);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    userRole: selectedNewRoles
                });
                handleSnackbar();
                setAlertMessage("Roles succesfully updated!");
                setDataChange(true);
                setApprovedId("NONE");
            }
        }
        catch (error) {
            console.error('Error');
        }
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                // User is logged in
                setUser(currentUser);
            } else {
                // User is not logged in
                setUser(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            handleCloseSnackbar();
        }, 2000); // Close after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, []);

    const handleDeleteAccount = async (uuid: string) => {
        setApprovedId(uuid);
        console.log(uuid);
        try {
            // Perform any additional actions after user deletion
            const docRef = doc(db, 'registeredusers', uuid);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await deleteDoc(docRef);
                handleSnackbar();
                setAlertMessage("Staff succesfully deleted!");
                setDataChange(true);
                setApprovedId("NONE");
                console.log('User document deleted successfully.');
            }
        } catch (error) {
            // Handle error
            console.log('Error deleting current user:', error);
        }
    }

    const displayedStaff = searchQuery ? searchResults : registeredStaff;

    const displayedJobs = searchQuery1 ? searchResults1 : myCompleteJob;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <Button
                                variant='contained'
                                style={{
                                    width: '250px'
                                }}
                                onClick={handleOpenAddRoutine}
                            >
                                Add New Non-Routine Job
                            </Button>
                            <h1>Approve Staff Request</h1>
                            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                                <DataGrid
                                    columns={[
                                        { field: 'uuid', headerName: 'UUID', width: 250 },
                                        { field: 'userName', headerName: 'Name', width: 250 },
                                        { field: 'userEmail', headerName: 'Email', width: 250 },
                                        { field: 'userRole', headerName: 'Roles', width: 200 },
                                        { field: 'created_at', headerName: 'Request Data', width: 320 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 150,
                                            renderCell: (params) => (
                                                <Button
                                                    variant="contained"
                                                    onClick={() => {
                                                        handleOpenModal(params.row.userRole, params.row.id);
                                                        setUserId(params.row.id);
                                                    }}
                                                    disabled={approvedId === params.row.id}
                                                >
                                                    {approvedId === params.row.id ? 'Approving...' : 'Approve'}
                                                </Button>
                                            ),
                                        },
                                    ]}
                                    rows={unregisteredUsers.map((user) => ({
                                        id: user.id,
                                        userName: user.data.userName,
                                        userEmail: user.data.userEmail,
                                        userRole: user.data.userRole,
                                        created_at: user.data.created_at.toDate(),
                                        uuid: user.id,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                            <h1>View Staff List</h1>
                            <TextField
                                label="Search Staff"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                                <DataGrid
                                    columns={[
                                        { field: 'uuid', headerName: 'UUID', width: 250 },
                                        { field: 'userName', headerName: 'Name', width: 250 },
                                        { field: 'userEmail', headerName: 'Email', width: 250 },
                                        { field: 'userRole', headerName: 'Roles', width: 200 },
                                        { field: 'userShift', headerName: 'Shift', width: 200 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 350,
                                            renderCell: (params) => (
                                                <div>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            handleOpenDialog2(params.row.uuid);
                                                            setClickedUserId(params.row.uuid);
                                                            setUserId(params.row.id);
                                                        }}
                                                        disabled={approvedId === params.row.id}
                                                    >
                                                        {approvedId === params.row.id ? 'Updating...' : 'Update Roles'}
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            handleOpenDialog3(params.row.uuid);
                                                            setClickedUserId(params.row.uuid);
                                                            setUserId(params.row.id);
                                                        }}
                                                        disabled={approvedId === params.row.id}
                                                        style={{ marginLeft: '50px' }}
                                                    >
                                                        {approvedId === params.row.id ? 'Deleting...' : 'Delete Roles'}
                                                    </Button>
                                                </div>
                                            ),
                                        },
                                    ]}

                                    rows={displayedStaff.map((user) => ({
                                        id: user.id,
                                        userName: user.data.userName,
                                        userEmail: user.data.userEmail,
                                        userShift: user.data.userShift.shiftName,
                                        userRole: user.data.userRole,
                                        uuid: user.id,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                            <div style={{
                                marginTop: '50px',
                                marginBottom: '90px',
                                marginRight: '50px'
                            }}>
                                <h1>Staff Job Calendar</h1>
                                <FullCalendar
                                    // dateClick={handleDateClick}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugion, listPlugin]}
                                    initialView={"dayGridMonth"}
                                    events={allJob.map((job) => ({
                                        title: job.data.jobName,
                                        start: job.data.jobAssigned.toDate(),
                                        allDay: false,
                                    }))}
                                    height={800}
                                    headerToolbar={{
                                        start: "today prev, next",
                                        center: "title",
                                        end: "dayGridMonth, timeGridWeek, timeGridDay, listWeek",
                                    }}
                                    views={{
                                        listWeek: { buttonText: 'List' }, // Customize the list view button text
                                    }}
                                    contentHeight="auto"
                                    aspectRatio={2}
                                />
                            </div>
                            <h1>Staff Schedule List </h1>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                />
                            </LocalizationProvider>
                            <Button
                                onClick={filterJobs1}>Search Jobs</Button>
                            <TextField
                                label="Search Done Jobs"
                                onChange={(e) => handleSearch1(e.target.value)}
                                style={{ width: '350px' }}
                            />
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <DataGrid
                                    style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    columns={[
                                        { field: 'jobName', headerName: 'Job Name', width: 200, renderCell: RenderCellExpand },
                                        { field: 'jobCategory', headerName: 'Job Category', width: 200 },
                                        { field: 'jobAssigned', headerName: 'Job Assigned', width: 180, renderCell: RenderCellExpand },
                                        {
                                            field: 'jobDue', headerName: 'Job Due', width: 200, renderCell: (params) => (
                                                params.value ? params.value : null
                                            ),
                                        },
                                        {
                                            field: 'jobStatus',
                                            headerName: 'Job Status',
                                            width: 150,
                                            renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColor(params.row.jobStatus),
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    {params.row.jobStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'patientName', headerName: 'Patient Name', width: 150, renderCell: RenderCellExpand },
                                        { field: 'jobType', headerName: 'Job Type', width: 180 },
                                        { field: 'roomNumber', headerName: 'Room Number', width: 160, renderCell: RenderCellExpand },
                                        { field: 'jobDone', headerName: 'Job Done', width: 150, renderCell: RenderCellExpand },
                                        { field: 'doneBy', headerName: 'Done By', width: 180, renderCell: RenderCellExpand },
                                    ]}
                                    rows={displayedJobs.map((job) => ({
                                        id: job.id,
                                        jobName: job.data.jobName,
                                        jobCategory: job.data.jobCategory,
                                        jobAssigned: job.data.jobAssigned.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }),
                                        jobDue: job.data.jobDue ? job.data.jobDue.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }) : null,
                                        jobStatus: job.data.jobStatus ? job.data.jobStatus : 'No Status',
                                        patientName: job.data.patient ? job.data.patient.patientName : 'No Patients',
                                        roomNumber: job.data.room ? job.data.roomNumber : 'No Room',
                                        jobDone: job.data.jobDone ? job.data.jobDone.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }) : null,
                                        doneBy: job.data.staff ? job.data.staff.userName : null,
                                        jobType: job.data.jobType ? job.data.jobType : "No Type",
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={open} onClose={handleCloseModal} PaperProps={{ style: { width: '1000px', height: '850px' } }}>
                        <DialogTitle>Select Shift</DialogTitle>
                        <DialogContent>
                            <h2 style={{ textAlign: 'center' }}>Same Role Staff Shift</h2>
                            <table style={{ width: '100%', margin: '0 auto', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Staff Name</th>
                                        <th>Staff Roles</th>
                                        <th>Staff Shift</th>
                                        <th>Start Shift</th>
                                        <th>End Shift</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sameShiftRole.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.data.userName}</td>
                                            <td>{user.data.userRole}</td>
                                            {user.data.userShift ? (
                                                <>
                                                    <td>{user.data.userShift.shiftName}</td>
                                                    <td>{user.data.userShift.startShift.toDate().toLocaleTimeString()}</td>
                                                    <td>{user.data.userShift.endShift.toDate().toLocaleTimeString()}</td>
                                                </>
                                            ) : (
                                                <td colSpan={3}>none</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <h2>Select Shift</h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                {shifts.map((shift) => (
                                    <div key={shift.id}>
                                        <p>{shift.data.shiftName}</p>
                                        <p>Start: {shift.data.startShift.toDate().toLocaleTimeString()}</p>
                                        <p>End: {shift.data.endShift.toDate().toLocaleTimeString()}</p>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                handleAssignShift(shift.id);
                                                handleCloseModal();
                                            }}
                                        >
                                            Assign Shift
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openDialog2} onClose={handleCloseModal2} PaperProps={{ style: { width: '400px', height: '300px' } }}>
                        <DialogTitle>Select New Roles</DialogTitle>
                        <DialogContent>
                            <h2>Select New Roles</h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Select defaultValue="default" onChange={(e) => setSelectedNewRoles(e.target.value)}>
                                    <MenuItem value="default">Select Roles</MenuItem>
                                    <MenuItem value="doctor">Doctor</MenuItem>
                                    <MenuItem value="nurse">Nurse</MenuItem>
                                    <MenuItem value="pharmacist">Pharmacist</MenuItem>
                                    <MenuItem value="kitchen">Kitchen</MenuItem>
                                    <MenuItem value="cleaningservice">Cleaning Service</MenuItem>
                                    <MenuItem value="ambulance">Ambulance Driver</MenuItem>
                                </Select>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        updateStaffRoles(clickedUserId);
                                        handleCloseModal2();
                                    }}
                                    disabled={!setSelectedNewRoles}
                                >
                                    Update Shift
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openDialog3} onClose={handleCloseModal3} PaperProps={{ style: { width: '400px', height: '300px' } }}>
                        <DialogTitle>Confirmation</DialogTitle>
                        <DialogContent>
                            <p>Are you sure you want to delete this account?</p>
                            <Button onClick={() => setOpenDialog3(false)}>No</Button>
                            <Button
                                onClick={() => {
                                    handleDeleteAccount(clickedUserId);
                                    handleCloseModal3();
                                }}
                                color="primary"
                            >
                                Yes
                            </Button>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openAddRoutine} onClose={handleCloseAddRoutine}>
                        <DialogTitle>Add New Non-Routine Job</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="name"
                                label="Non-Routine Job Name"
                                type="text"
                                id="name"
                                autoFocus
                                value={jobName}
                                onChange={(e) => setJobName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="name"
                                label="Non-Routine Job Category"
                                type="text"
                                id="name"
                                value={jobCategory}
                                onChange={(e) => setJobCategory(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Job Role:
                            </Typography>
                            <Select defaultValue="default" onChange={(e) => setJobRole(e.target.value)} style={{ width: '100%' }}>
                                <MenuItem value="default">Select Roles</MenuItem>
                                <MenuItem value="doctor">Doctor</MenuItem>
                                <MenuItem value="nurse">Nurse</MenuItem>
                                <MenuItem value="pharmacist">Pharmacist</MenuItem>
                                <MenuItem value="kitchen">Kitchen</MenuItem>
                                <MenuItem value="cleaningservice">Cleaning Service</MenuItem>
                                <MenuItem value="driver">Ambulance Driver</MenuItem>
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Job Due Date:
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Job Due"
                                    value={jobDue}
                                    onChange={(newValue) => setJobDue(newValue)}
                                    sx={{ width: '100%', marginTop: '28px' }}
                                />
                            </LocalizationProvider>
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Job Due Time:
                            </Typography>
                            <input type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)}
                                style={{ width: '210px', height: '50px', backgroundColor: 'gainsboro', borderRadius: '15px', fontSize: '20px', fontFamily: 'arial', paddingLeft: '10px' }}
                            />

                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={addNonRoutine} fullWidth>
                                    Add Non-Routine Job
                                </Button>
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

export default ManageStaff;
