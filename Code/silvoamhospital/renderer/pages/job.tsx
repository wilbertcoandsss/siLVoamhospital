import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, FieldPath, Timestamp, arrayRemove, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import Sidebar from '../components/Sidebar';
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
import { RenderCellExpand } from '../components/RenderCellExpand';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Link from '../components/Link';

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

function SeeJob() {

    const [dataChange, setDataChange] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [myJob, setMyJob] = useState([]);
    const [myCompleteJob, setMyCompleteJob] = useState([]);

    const [id, setId] = useState("");
    const [role, setRole] = useState("");

    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    useEffect(() => {
        const storedId = localStorage.getItem('id');
        setId(storedId);
        setRole(localStorage.getItem('role'));
    }, []);


    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredResults = myCompleteJob.filter((job) =>
            job.data.jobName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredResults);
        setDataChange(true);
    };

    const filterJobs = () => {
        setSearchQuery("awikwok");
        const filteredResults = myCompleteJob.filter((job) => {
            const jobDate = job.data.jobAssigned.toDate();
            return jobDate >= startDate.toDate() && jobDate <= endDate.toDate();
        });

        // const formattedQuery = searchQuery.toLowerCase();
        // const searchedAndFilteredResults = filteredResults.filter((job) =>
        //     job.data.jobName.toLowerCase().includes(formattedQuery)
        // );

        setSearchResults(filteredResults);
        setDataChange(true);
    };

    const getCompleteJob = async () => {
        try {
            const q = query(collection(db, 'job'), where('doneBy', '==', localStorage.getItem('id')), where('isDone', '==', true));
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


    const getJob = async () => {
        try {
            const q = query(collection(db, 'job'), where('staffRole', '==', localStorage.getItem('role')), where('isDone', '==', false));
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
            setMyJob(jobs);
        } catch (error) {
            console.log(error);
        }
    };

    const setCompleteJob = async (jobId: string) => {
        try {
            const docRef = doc(db, 'job', jobId);
            const querySnapshot = await getDoc(docRef);

            let jobStat = null;

            if (querySnapshot.exists()) {
                const jobDetails = querySnapshot.data();

                if (jobDetails.jobStatus == "late") {
                    jobStat = "late";
                }
                else if (jobDetails.jobStatus == "unfinished") {
                    jobStat = "completed";
                }

                // Handle Bed 
                if (jobDetails.bedId != "" && jobDetails.jobName == "Add Bed") {
                    await updateDoc(doc(db, 'bed', jobDetails.bedId), {
                        bedStatus: "available"
                    });
                }

                if (jobDetails.bedId != "" && jobDetails.jobName == "Remove Bed") {
                    await deleteDoc(doc(db, 'bed', jobDetails.bedId));

                    const roomDocRef = doc(db, 'room', jobDetails.roomId);
                    await updateDoc(roomDocRef, {
                        bedCollection: arrayRemove(jobDetails.bedId),
                    });
                }

                if (jobDetails.bedId != "" && jobDetails.jobName == "Making Bed") {
                    await updateDoc(doc(db, 'bed', jobDetails.bedId), {
                        bedStatus: "available"
                    });
                }


                if (jobDetails.bedId != "" && jobDetails.jobName == "Move Available Bed") {
                    await updateDoc(doc(db, 'bed', jobDetails.bedId), {
                        bedStatus: "available"
                    });
                }

                // Handle Patients
                if (jobDetails.bedId != "" && jobDetails.jobName == "Assign Patient Bed") {
                    await updateDoc(doc(db, 'bed', jobDetails.bedId), {
                        bedStatus: "used"
                    });
                }

                if (jobDetails.bedId != "" && jobDetails.jobName == "Move Patient Bed") {
                    await updateDoc(doc(db, 'bed', jobDetails.bedId), {
                        bedStatus: "used"
                    });
                }

                // Nurse
                if (jobDetails.jobName == "Delivering Medicine") {

                }

                // Driver
                if (jobDetails.jobName == "Picking Up Patient") {
                    console.log(jobDetails.ambulanceId);
                    await updateDoc(doc(db, 'ambulance', jobDetails.ambulanceId), {
                        ambulanceStatus: "available",
                        patientId: null,
                    });

                    // Pick Up Fee
                    const billsRef = collection(db, 'bills');

                    const newBill = {
                        billDate: serverTimestamp(),
                        billName: "Pick Up Fee",
                        billStatus: "unpaid",
                        billPrice: 250000,
                    };

                    const newBillId = await addDoc(billsRef, newBill);

                    const patientRef = doc(db, 'patient', jobDetails.patientId);
                    const patientSnapshot = await getDoc(patientRef);

                    if (patientSnapshot.exists()) {
                        const patientData = patientSnapshot.data();
                        const billCollectionArray = patientData.billCollection || [];

                        if (billCollectionArray.length === 0) {
                            await updateDoc(patientRef, {
                                billCollection: [newBillId.id],
                            });
                        } else {
                            const updatedBillCollectionArray = [...billCollectionArray, newBillId.id];
                            await updateDoc(patientRef, {
                                isHandled: true,
                                billCollection: updatedBillCollectionArray,
                            });
                        }
                    }
                }

                // NonRoutine
                if (jobDetails.jobType == "non-routine"){

                }

                await updateDoc(docRef, {
                    jobDone: serverTimestamp(),
                    jobStatus: jobStat,
                    isDone: true,
                    doneBy: localStorage.getItem('id'),
                });

                handleSnackbar();
                setAlertMessage("Job Succesfully Updated!");
                setDataChange(true);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getJob();
        getCompleteJob();
    }, []);

    useEffect(() => {
        if (dataChange) {
            getJob();
            getCompleteJob();
            setDataChange(false);
        }
    }, [dataChange]);

    const displayedJobs = searchQuery ? searchResults : myCompleteJob;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '25px', marginTop: '55px' }}>
                            <h1>Ongoing Job Request</h1>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <DataGrid
                                    style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    columns={[
                                        { field: 'jobName', headerName: 'Job Name', width: 200, renderCell: RenderCellExpand },
                                        { field: 'jobCategory', headerName: 'Job Category', width: 200 },
                                        { field: 'jobAssigned', headerName: 'Job Assigned', width: 180 },
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
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.jobStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'patientName', headerName: 'Patient Name', width: 150 },
                                        { field: 'jobType', headerName: 'Job Type', width: 180},
                                        { field: 'roomNumber', headerName: 'Room Number', width: 160 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 250,
                                            renderCell: (params) => {
                                                if (params.row.jobName === 'Preparing Medicine') {
                                                    return (
                                                        <Link href="../pharmacist/viewprescriptions">
                                                            <Button variant="contained">
                                                                Complete Prescriptions
                                                            </Button>
                                                        </Link>
                                                    );
                                                } else {
                                                    return (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                setCompleteJob(params.row.id);
                                                            }}
                                                        >
                                                            Set Complete
                                                        </Button>
                                                    );
                                                }
                                            }
                                        },
                                    ]}
                                    rows={myJob.map((job) => ({
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
                                        }) : "No Due",
                                        jobStatus: job.data.jobStatus,
                                        patientName: job.data.patient ? job.data.patient.patientName : 'No Patients',
                                        roomNumber: job.data.room ? job.data.room.roomNumber : 'No Room',
                                        jobType: job.data.jobType ? job.data.jobType : "No Type",
                                    }))}
                                    autoHeight
                                />
                            </Box>

                            <h1>Completed Job</h1>
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
                                onClick={filterJobs}>Search Jobs</Button>
                            <TextField
                                label="Search Done Jobs"
                                onChange={(e) => handleSearch(e.target.value)}
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
                                        { field: 'jobType', headerName: 'Job Type', width: 180},
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
                                        jobDone: job.data.jobDone.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }),
                                        doneBy: job.data.staff.userName,
                                        jobType: job.data.jobType ? job.data.jobType : "No Type",
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
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

export default SeeJob;
