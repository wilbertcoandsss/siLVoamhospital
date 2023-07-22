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

const getBackgroundColor = (jobStatus) => {
    if (jobStatus === 'pending') {
        return 'orange';
    } else if (jobStatus === 'approved') {
        return 'green';
    }

    return '';
}

let selectedCertId = null;

function ViewMedicine() {
    const [displayedCertificate, setDisplayedCertificate] = useState([]);
    const [certifDetail, setCertifDetail] = useState([]);

    const [dataChange, setDataChange] = useState(false);

    const [medicineName, setMedicineName] = useState("");
    const [medicineType, setMedicineType] = useState("");
    const [medicinePrice, setMedicinePrice] = useState("");
    const [medicineStock, setMedicineStock] = useState("");

    const [openForm1, setOpenForm1] = useState(false);
    const [openForm2, setOpenForm2] = useState(false);
    const [openForm3, setOpenForm3] = useState(false);

    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [clickedMedId, setClickedMedId] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const openDialog1 = () => {
        setOpenForm1(true);
    }

    const [patient, setPatient] = useState([]);
    const [patientName, setPatientName] = useState("");
    const [certifType, setCertifType] = useState("");

    const fetchPatients = async () => {
        const patientSnapshot = await getDocs(collection(db, 'patient'));
        const patientData = patientSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setPatient(patientData);
    };

    const closeDialog1 = () => {
        setOpenForm1(false);
        setClickedMedId(null);
    }

    const openDialog2 = (certId: string) => {
        getCertificateDetails(certId);
        setOpenForm2(true);
    }

    const closeDialog2 = () => {
        setOpenForm2(false);
        setClickedMedId(null);
    }

    const openDialog3 = (certId: string) => {
        selectedCertId = certId;
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

    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredMed = displayedCertificate.filter((med) =>
            med.data.certificateName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredMed);
    };

    const getCertificate = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'certificate'));

            const certificates = [];

            for (const doc1 of querySnapshot.docs) {
                const certifData = doc1.data();
                const staffDocRef = certifData.createdBy;
                const doctorDocRef = certifData.doctorId;
                const patientDocRef = certifData.patientId;

                let staffData = null;
                let doctorData = null;
                let patientData = null;


                if (doctorDocRef) {
                    const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
                    if (doctorDocSnapshot.exists()) {
                        doctorData = doctorDocSnapshot.data();
                    }
                }

                if (staffDocRef) {
                    const staffDocSnapshot = await getDoc(doc(db, 'registeredusers', staffDocRef));
                    if (staffDocSnapshot.exists()) {
                        staffData = staffDocSnapshot.data();
                    }
                }

                if (patientDocRef) {
                    const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                    if (patientDocSnapshot.exists()) {
                        patientData = patientDocSnapshot.data();
                    }
                }

                console.log("doctor", doctorData);

                const certificate = {
                    id: doc1.id,
                    data: {
                        ...certifData,
                        doctor: doctorData,
                        patient: patientData,
                        staff: staffData,
                    },
                };

                certificates.push(certificate);
            }

            setDisplayedCertificate(certificates);
            console.log(displayedCertificate);
        }
        catch {
            console.log("error");
        }
    }

    const getCertificateDetails = async (certifId: string) => {
        const certifRef = await getDoc(doc(db, 'certificate', certifId));

        let certificates = [];

        if (certifRef.exists()) {
            const certifData = certifRef.data();
            const staffDocRef = certifData.createdBy;
            const doctorDocRef = certifData.doctorId;
            const patientDocRef = certifData.patientId;

            let staffData = null;
            let doctorData = null;
            let patientData = null;


            if (doctorDocRef) {
                const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
                if (doctorDocSnapshot.exists()) {
                    doctorData = doctorDocSnapshot.data();
                }
            }

            if (staffDocRef) {
                const staffDocSnapshot = await getDoc(doc(db, 'registeredusers', staffDocRef));
                if (staffDocSnapshot.exists()) {
                    staffData = staffDocSnapshot.data();
                }
            }

            if (patientDocRef) {
                const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                if (patientDocSnapshot.exists()) {
                    patientData = patientDocSnapshot.data();
                }
            }

            console.log("doctor", doctorData);

            const certificate = {
                id: certifRef.id,
                data: {
                    ...certifData,
                    doctor: doctorData,
                    patient: patientData,
                    staff: staffData,
                },
            };

            certificates.push(certificate);
        }

        setCertifDetail(certificates);
    }

    const insertCertificate = async () => {

        const patientSnapshot = await getDoc(doc(db, 'patient', patientName));

        const certificateRef = collection(db, 'certificate');
        const newCertif = {
            approvedAt: null,
            certificateName: certifType == "death" ? "Death Certificate" : "Birth Certificate",
            certificateStatus: "pending",
            certificateType: certifType,
            createdAt: Timestamp.now(),
            createdBy: localStorage.getItem('id'),
            doctorId: null,
            patientId: patientSnapshot.id,
        };

        const notifRef = collection(db, 'notification');

        await addDoc(notifRef, {
            userRole: "doctor",
            content: "Approve Certificate Request",
            notifDate: Timestamp.now(),
        })


        try {
            await addDoc(certificateRef, newCertif);
            handleSnackbar();
            setAlertMessage("Certificate succesfully inserted!");
            closeDialog1();
            setDataChange(true);
            // Optionally, you can perform any additional logic or show a success message.
        } catch (error) {
            console.error('Error registering patient:', error);
            // Optionally, you can handle the error and show an error message to the user.
        }
    }

    const approveCertificate = async () => {
        const certifDocRef = doc(db, 'certificate', selectedCertId);

        await updateDoc(certifDocRef, {
            doctorId: localStorage.getItem('id'),
            approvedAt: Timestamp.now(),
            certificateStatus: "approved",
        });

        handleSnackbar();
        setAlertMessage("Certificate succesfully approved!");
        closeDialog3();
        setDataChange(true);
    }

    const resetForm = () => {
        setMedicineName(null);
        setMedicinePrice(null);
        setMedicineType(null);
        setMedicineStock(null);
    }

    //Fetch for the first time
    useEffect(() => {
        getCertificate();
        fetchPatients();
    }, []);

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            getCertificate();
            resetForm();
            setClickedMedId(null);
            setDataChange(false);
        }
    }, [dataChange]);

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Certificate List</h1>
                            {/* <TextField
                                label="Search Staff"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{width: '180px'}}
                            /> */}
                            {localStorage.getItem('role') == 'admin' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        openDialog1();
                                    }}
                                    style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                                >
                                    Add Certificate
                                </Button>
                            )}
                            {localStorage.getItem('role') == 'nurse' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        openDialog1();
                                    }}
                                    style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                                >
                                    Add Certificate
                                </Button>
                            )}
                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '50px' }}>
                                <DataGrid
                                    columns={[
                                        { field: 'CertificateName', headerName: 'Certificate Name', width: 200 },
                                        { field: 'CertificateType', headerName: "Certificate Type", width: 200 },
                                        { field: 'CreatedAt', headerName: 'Created At', width: 300 },
                                        { field: 'PatientName', headerName: 'Patient Name', width: 200 },
                                        { field: 'ApprovedBy', headerName: 'Approved By', width: 180 },
                                        {
                                            field: 'certificateStatus', headerName: 'Certificate Status', width: 220, renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColor(params.row.CertificateStatus),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.CertificateStatus}
                                                </div>
                                            ),
                                        },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 280,
                                            renderCell: (params) => {
                                                if (params.row.CertificateStatus === 'approved') {
                                                    return (
                                                        <div>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    openDialog2(params.row.id);
                                                                    // setClickedMedId(params.row.MedicineID);
                                                                }}
                                                            // disabled={approvedId === params.row.id}
                                                            >
                                                                Certificate Details
                                                            </Button>
                                                        </div>
                                                    );
                                                }
                                                else if (params.row.CertificateStatus === "pending" && localStorage.getItem('role') == "doctor") {
                                                    return (
                                                        <div>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    openDialog3(params.row.id);
                                                                    // setClickedMedId(params.row.MedicineID);
                                                                }}
                                                            // disabled={approvedId === params.row.id}
                                                            >
                                                                Approved Certificate
                                                            </Button>
                                                        </div>
                                                    );
                                                }
                                                else {
                                                    return "Waiting for approval..."; // Render nothing if certificatestatus is not 'approved'
                                                }
                                            },
                                        },
                                    ]}

                                    rows={displayedCertificate.map((cert) => ({
                                        id: cert.id,
                                        CertificateStatus: cert.data.certificateStatus,
                                        CertificateType: cert.data.certificateType,
                                        CertificateName: cert.data.certificateName,
                                        CreatedAt: `${cert.data.createdAt.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        })} by (${cert.data.staff.userName})`,
                                        PatientName: cert.data.patient.patientName,
                                        ApprovedBy: cert.data.doctor ? cert.data.doctor.userName : "Not Approved",
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openForm1} onClose={closeDialog1}>
                        <DialogTitle>Add New Medicine</DialogTitle>
                        <DialogContent>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Patient:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setPatientName(e.target.value)}
                                fullWidth
                            >
                                {patient.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.patientName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Certificate Type:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setCertifType(e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="birth">
                                    Birth
                                </MenuItem>
                                <MenuItem value="death">
                                    Death
                                </MenuItem>

                            </Select>
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={insertCertificate} fullWidth>
                                    Register New Certificate
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm2} onClose={closeDialog2} maxWidth={false} fullWidth>
                        <DialogTitle>Certificate Detail</DialogTitle>
                        <DialogContent>
                            {certifDetail.map((cd) => {
                                return (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                    }}>
                                        <h1>{cd.data.certificateName}</h1>
                                        <h2>This {cd.data.certificateType} certificate belongs to</h2>
                                        <h1>{cd.data.patient.patientName}</h1>
                                        <h3>{cd.data.patient.patientAddress}</h3>
                                        <h3>Has {cd.data.certificateType} on {cd.data.createdAt.toDate().toDateString()}</h3>
                                        <h3>on siLVoam hospital</h3>
                                        <br>
                                        </br>
                                        <br>
                                        </br>

                                        <h2>Approved On</h2>
                                        <h2>{cd.data.approvedAt.toDate().toDateString()}</h2>
                                        <h2>By {cd.data.doctor.userName}</h2>
                                        <img width={300} height={300} src="images/approvedlogo.png" />

                                    </div>
                                );
                            })}
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm3} onClose={closeDialog3} PaperProps={{ style: { width: '400px', height: '300px' } }}>
                        <DialogTitle>Approve Certificate</DialogTitle>
                        <DialogContent>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                }}>
                                <p>Upload your signature file here</p>
                                <input type="file" accept="image/*" style={{
                                    width: '180px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    margin: '10px',
                                    marginBottom: '45px',
                                    marginTop: '30px',
                                }} />
                                <Button
                                    variant='contained'
                                    onClick={approveCertificate}
                                >
                                    Approve Certificate
                                </Button>

                            </div>
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
