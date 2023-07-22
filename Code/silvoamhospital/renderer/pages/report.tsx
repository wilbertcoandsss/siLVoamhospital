import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, setDoc, addDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import Sidebar from '../components/Sidebar';
import { Alert, Box, Chip, DialogActions, Fab, Input, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
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

const getBackgroundColor = (reportStatus) => {
    if (reportStatus === 'none') {
        return 'darkblue';
    } else if (reportStatus === 'follow-up') {
        return 'orange';
    } else if (reportStatus === 'resolved') {
        return 'green';
    }

    return '';
}

let isReportResolved = null;

function ViewReports() {

    const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredReport = reportList.filter((rep) =>
            rep.data.reportName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredReport);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.altKey && event.key === 'w') {
                setIsSpotlightVisible((prevState) => !prevState);
                console.log("awikwok coba aja");
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const [dataChange, setDataChange] = useState(false);

    const [openForm1, setOpenForm1] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [openReportDetail, setOpenReportDetail] = useState(false);
    const [createReport, setCreateReport] = useState(false);

    const [reportList, setReportList] = useState([]);
    const [reportDetail, setReportDetail] = useState([]);


    const [reportDate, setReportDate] = useState(null);
    const [reportDescription, setReportDescription] = useState("");
    const [reportName, setReportName] = useState("");
    const [reportStatus, setReportStatus] = useState("");
    const [reportedBy, setReportedBy] = useState("");
    const [divisionsRelated, setDivisionsRelated] = useState([]);


    // fetch DB
    const [rooms, setRooms] = useState([]);

    const [patients, setPatients] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');

    // Fetch patients from Firestore based on selected rooms
    const fetchPatients = async () => {
        const patientSnapshot = await getDocs(collection(db, 'patient'));
        const patientData = patientSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setPatients(patientData);
    };

    const fetchRooms = async () => {
        const roomSnapshot = await getDocs(collection(db, 'room'));
        const roomData = roomSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setRooms(roomData);
    };

    const handleDivisionsChanged = (event) => {
        const { value } = event.target;
        setDivisionsRelated(value);
    };

    const [roomId, setRoomId] = useState("");

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleOpenReportDetail = (reportId: string) => {
        setOpenReportDetail(true);
        getReportDetail(reportId);
    }

    const handleCloseCreateReport = () => {
        setCreateReport(false);
    }

    const handleOpenCreateReport = () => {
        setCreateReport(true);
    }

    const handleCloseReportDetail = () => {
        setOpenReportDetail(false);
    }


    const getReport = async () => {
        try {
            const q = query(collection(db, 'report'), where('divisionsRelated', 'array-contains', localStorage.getItem('role')));
            const querySnapshot = await getDocs(q);
            const reports = [];

            for (const doc1 of querySnapshot.docs) {
                const reportData = doc1.data();
                const patientDocRef = reportData.patientId;
                const roomDocRef = reportData.roomId;
                const staffDocRef = reportData.reportedBy;
                const divisionDocRef = reportData.divisionsRelated;

                let patientData = null;
                let roomData = null;
                let staffData = null;
                const divisionData = [];

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

                const report = {
                    id: doc1.id,
                    data: {
                        ...reportData,
                        patient: patientData,
                        room: roomData,
                        staff: staffData,
                        division: divisionDocRef,
                    },
                };

                reports.push(report);
            }
            setReportList(reports);
        } catch (error) {
            console.log(error);
        }
    };

    const getReportDetail = async (reportId: string) => {
        const reportSnapshot = await getDoc(doc(db, 'report', reportId));
        const reports = [];

        const reportData = reportSnapshot.data();
        const patientDocRef = reportData.patientId;
        const roomDocRef = reportData.roomId;
        const staffDocRef = reportData.reportedBy;
        const divisionDocRef = reportData.divisionsRelated;

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

        const report = {
            id: reportSnapshot.id,
            data: {
                ...reportData,
                patient: patientData,
                room: roomData,
                staff: staffData,
                division: divisionDocRef,
            },
        };

        reports.push(report);
        setReportDetail(reports);
    }

    const insertReport = async () => {
        try {
            const reportRef = collection(db, 'report');
            const timestampReportDate = Timestamp.fromDate(reportDate.toDate());
            const newReport = {
                divisionsRelated: divisionsRelated,
                patientId: selectedPatient,
                reportDate: timestampReportDate,
                reportDescription: reportDescription,
                reportName: reportName,
                reportStatus: "none",
                reportedBy: localStorage.getItem('id'),
                roomId: selectedRooms,
            }
            await addDoc(reportRef, newReport);
            handleSnackbar();
            setAlertMessage("Report succesfully inserted!");
            handleCloseCreateReport();
            setDataChange(true);
        } catch (error) {
            console.log(error);
        }
    }

    const setFollowUp = async (reportId: string) => {
        try {
            const reportRef = doc(db, 'report', reportId);

            const reportSnapshot = await getDoc(reportRef);
            const reportData = reportSnapshot.data();

            const followUpDetails = reportData.followUpDetails;

            if (followUpDetails) {
                await updateDoc(reportRef, {
                    reportStatus: 'follow-up',
                    followUpDetails: arrayUnion({
                        followUpName: localStorage.getItem('name'),
                        followUpRole: localStorage.getItem('role'),
                        followUpDate: Timestamp.now(),
                    }),
                });
            } else {
                await setDoc(reportRef, {
                    reportStatus: 'follow-up',
                    followUpDetails: [
                        {
                            followUpName: localStorage.getItem('name'),
                            followUpRole: localStorage.getItem('role'),
                            followUpDate: Timestamp.now(),
                        },
                    ],
                }, { merge: true });
            }

            handleSnackbar();
            setAlertMessage("Report successfully followed up!");
            handleCloseReportDetail();
            setDataChange(true);
            console.log('Follow-up details updated successfully.');
        } catch (error) {
            console.log('Error updating follow-up details:', error);
        }
    };

    const setResolved = async (reportId: string) => {
        try {
            const reportRef = doc(db, 'report', reportId);

            const reportSnapshot = await getDoc(reportRef);
            const reportData = reportSnapshot.data();

            await setDoc(reportRef, {
                reportStatus: 'resolved',
                resolvedDetails: [
                    {
                        resolvedName: localStorage.getItem('name'),
                        resolvedRole: localStorage.getItem('role'),
                        resolvedDate: Timestamp.now(),
                    },
                ],
            }, { merge: true });

            handleSnackbar();
            setAlertMessage("Report successfully resolved!");
            handleCloseReportDetail();
            setDataChange(true);
            console.log('Follow-up details updated successfully.');
        } catch (error) {
            console.log('Error updating follow-up details:', error);
        }
    }

    useEffect(() => {
        getReport();
        fetchRooms();
        fetchPatients();
    }, []);

    useEffect(() => {
        if (dataChange) {
            getReport();
            fetchRooms();
            fetchPatients();
            setDataChange(false);
        }
    }, [dataChange]);

    const reportLists = searchQuery ? searchResults : reportList;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Report List</h1>
                            <div>
                                {isSpotlightVisible && (
                                    <TextField
                                        label="Search Reports"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        style={{
                                            position: 'fixed',
                                            top: '8%',
                                            left: '82%',
                                            width: '250px',
                                            backgroundColor: 'gainsboro',
                                        }}
                                    />
                                )}
                                {/* Rest of your component */}
                            </div>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    handleOpenCreateReport();
                                }}
                                style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                            >
                                Add Reports
                            </Button>
                            {/* <TextField
                                label="Search Patients"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            /> */}
                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '50px' }}>
                                <DataGrid

                                    columns={[
                                        { field: 'reportName', headerName: 'Report Name', width: 240 },
                                        { field: 'roomNumber', headerName: 'Room Number', width: 180 },
                                        { field: 'patientName', headerName: 'Patient Name', width: 200 },
                                        { field: 'reportTime', headerName: 'Report Time', width: 240 },
                                        { field: 'reportedBy', headerName: 'Reported By', width: 230 },
                                        {
                                            field: 'reportStatus', headerName: 'Report Status', width: 240,
                                            renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColor(params.row.reportStatus),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.reportStatus}
                                                </div>
                                            ),

                                        },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 240,
                                            renderCell: (params) => (
                                                <div
                                                >
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            handleOpenReportDetail(params.row.id);
                                                        }}
                                                    >
                                                        Report Details
                                                    </Button>
                                                </div>
                                            ),
                                        },
                                    ]}

                                    rows={reportLists.map((report) => ({
                                        id: report.id,
                                        reportName: report.data.reportName,
                                        roomNumber: report.data.room.roomNumber,
                                        patientName: report.data.patient.patientName,
                                        reportTime: report.data.reportDate.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }),
                                        reportedBy: `${report.data.staff.userName} (${report.data.staff.userRole})`,
                                        reportStatus: report.data.reportStatus,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openReportDetail} onClose={handleCloseReportDetail} fullWidth maxWidth={false}>
                        <DialogTitle>Report Detail</DialogTitle>
                        <DialogContent>
                            {reportDetail.map((report) => {
                                const isReportDone = report.data.reportStatus === 'resolved';
                                isReportResolved = isReportDone;
                                return isReportDone;
                            })}
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Report Name</th>
                                        <th>Report Description</th>
                                        <th>Related Divisions</th>
                                        <th colSpan={2}>Follow Up By</th>
                                        <th>Resolved By</th>
                                        {!isReportResolved && (
                                            <th colSpan={2}>Action</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportDetail.map((report) => {
                                        return (
                                            <tr key={report.id}>
                                                <td>{report.data.reportName}</td>
                                                <td>{report.data.reportDescription}</td>
                                                <td style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {report.data.division.map((division, index) => (
                                                        <span key={index} style={{ marginBottom: '10px' }}>
                                                            {division}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td></td>
                                                <td style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {report.data.followUpDetails ? (
                                                        report.data.followUpDetails.map((detail, index) => (
                                                            <div key={index}>
                                                                <span>{`${detail.followUpName} (${detail.followUpRole}) on ${detail.followUpDate.toDate().toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: 'numeric',
                                                                    second: 'numeric',
                                                                })}`}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>None</div>
                                                    )}
                                                </td>
                                                <td>
                                                    {report.data.resolvedDetails ? (
                                                        report.data.resolvedDetails.map((resolved, index) => (
                                                            <div key={index}>
                                                                <span>{`${resolved.resolvedName} (${resolved.resolvedRole}) on ${resolved.resolvedDate.toDate().toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: 'numeric',
                                                                    second: 'numeric',
                                                                })}`}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>None</div>
                                                    )}
                                                </td>
                                                {!isReportResolved && (
                                                    <div>
                                                        <td>
                                                            <Button
                                                                onClick={() => {
                                                                    setFollowUp(report.id);
                                                                }}
                                                            >
                                                                Set Follow Up
                                                            </Button>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                onClick={() => {
                                                                    setResolved(report.id);
                                                                }}
                                                            >
                                                                Set Resolved
                                                            </Button>
                                                        </td>
                                                    </div>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={createReport} onClose={handleCloseCreateReport} fullWidth>
                        <DialogTitle>Create New Report</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="reportName"
                                label="Report Name"
                                type="text"
                                id="reportName"
                                autoFocus
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="reportDesc"
                                label="Report Description"
                                type="text"
                                id="medicineType"
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Report Date"
                                    value={reportDate}
                                    onChange={(newValue) => setReportDate(newValue)}
                                    sx={{ width: '100%', marginTop: '28px' }}
                                />
                            </LocalizationProvider>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Divisions:
                            </Typography>
                            <Select
                                label="Select Divisions"
                                multiple
                                value={divisionsRelated}
                                onChange={handleDivisionsChanged}
                                input={<Input />}
                                renderValue={(selected) => (
                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        {selected.map((division) => (
                                            <Chip key={division} label={division} style={{ margin: 2, padding: '15px', fontSize: '18px' }} />
                                        ))}
                                    </div>
                                )}
                                style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}
                            >
                                <MenuItem value="doctor">Doctor</MenuItem>
                                <MenuItem value="nurse">Nurse</MenuItem>
                                <MenuItem value="pharmacist">Pharmacist</MenuItem>
                                <MenuItem value="kitchen">Kitchen</MenuItem>
                                <MenuItem value="cleaningservice">Cleaning Service</MenuItem>
                                <MenuItem value="ambulance">Ambulance Driver</MenuItem>
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Rooms:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setSelectedRooms(e.target.value)}
                                fullWidth
                            >
                                {rooms.map((room) => (
                                    <MenuItem key={room.id} value={room.id}>
                                        {room.data.roomNumber}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Patient:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                fullWidth
                            >
                                {patients.map((pat) => (
                                    <MenuItem key={pat.id} value={pat.id}>
                                        {pat.data.patientName}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Box marginTop={2}>
                                <Button variant="contained" onClick={insertReport} color="secondary" fullWidth>
                                    Insert New Report!
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

export default ViewReports;
