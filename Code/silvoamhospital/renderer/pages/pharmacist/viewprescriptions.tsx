import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, FieldPath, Timestamp, arrayRemove, addDoc } from 'firebase/firestore';
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
import { RenderCellExpand } from '../../components/RenderCellExpand';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const getBackgroundColor = (jobStatus) => {
    if (jobStatus === 'queued') {
        return 'darkblue';
    } else if (jobStatus === 'in progress') {
        return 'orange';
    } else if (jobStatus === 'completed') {
        return 'green';
    }

    return '';
}

const getBackgroundColorForQueue = (queueStatus) => {
    if (queueStatus === 'normal') {
        return 'darkblue';
    } else if (queueStatus === 'urgent') {
        return 'red';
    }

    return '';
}

let finalGrandTotal = null;

let selectedPatientId = null;
let selectedRoomId = null;
let selectedBedId = null;
let selectedJobId = null;
let selectedPrescriptionId = null
let selectedBillId = null;

let selectedMedicineId = null;
let selectedMedicineName = null;

function ViewPrescriptions() {

    const [dataChange, setDataChange] = useState(false);

    const [myPrescriptions, setMyPrescriptions] = useState([]);
    const [myCompletePrescriptions, setMyCompletePrescriptions] = useState([]);
    const [myPrescriptionsDetail, setMyPrescriptionsDetail] = useState([]);

    // Open page
    const [openPrescriptionDetail, setOpenPrescriptionDetail] = useState(false);
    const [openCompletePrescription, setOpenCompletePrescription] = useState(false);

    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [selectedMedicines, setSelectedMedicines] = useState({});


    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleOpenPrescriptionDetail = () => {
        setOpenPrescriptionDetail(true);
    }

    const handleClosePrescriptionDetail = () => {
        setOpenPrescriptionDetail(false);
    }

    const handleOpenCompletePrescription = async (patientId: string, roomId: string, bedId: string, jobId: string, prescriptionId: string) => {
        selectedPatientId = patientId;
        selectedRoomId = roomId;
        selectedBedId = bedId;
        selectedJobId = jobId;
        selectedPrescriptionId = prescriptionId;
        const presSnapshot = await getDoc(doc(db, 'prescriptions', prescriptionId));
        const prescriptions = [];

        const docRef = doc(db, 'prescriptions', prescriptionId);

        await updateDoc(docRef, {
            prescriptionStatus: 'in progress'
        });

        setDataChange(true);
        setOpenCompletePrescription(true);
    }

    const handleCloseCompletePrescription = () => {
        setOpenCompletePrescription(false);
    }

    const [appointmentRoom, setAppointmentRoom] = useState("");
    const [patient, setPatient] = useState([]);
    const fetchPatients = async () => {
        const patientSnapshot = await getDocs(collection(db, 'patient'));
        const patientData = patientSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setPatient(patientData);
    };


    const getPrescriptions = async () => {
        try {
            const q = query(collection(db, 'job'), where('jobName', '==', 'Preparing Medicine'), where('jobStatus', '==', 'unfinished'));
            const querySnapshot = await getDocs(q);
            const prescriptions = [];
            const currentTimestamp = new Date();

            for (const doc1 of querySnapshot.docs) {
                const jobData = doc1.data();
                const patientDocRef = jobData.patientId;
                const roomDocRef = jobData.roomId;
                const prescriptionDocRef = jobData.prescriptionId;

                let patientData = null;
                let roomData = null;
                let prescriptionData = null;

                console.log("coba", roomDocRef);

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

                if (prescriptionDocRef) {
                    const prescriptionDocSnapshot = await getDoc(doc(db, 'prescriptions', prescriptionDocRef));
                    prescriptionData = prescriptionDocSnapshot.data();
                }

                prescriptions.push({
                    id: doc1.id,
                    data: {
                        ...jobData,
                        patient: patientData,
                        room: roomData,
                        prescription: prescriptionData,
                    },
                });
            }
            setMyPrescriptions(prescriptions);
        } catch (error) {
            console.log(error);
        }
    };

    const getCompletePrescriptions = async () => {
        try {
            const q = query(collection(db, 'prescriptions'), where('prescriptionStatus', '==', 'completed'));
            const querySnapshot = await getDocs(q);
            const prescriptions = [];
            // console.log
            for (const doc1 of querySnapshot.docs) {
                const presData = doc1.data();
                const doctorDocRef = presData.doctorId;
                const patientDocRef = presData.patientId;
                const pharmacistDocRef = presData.pharmacistId;
                const roomDocRef = presData.roomId;
                const medicineDocRef = presData.medicineList;

                let doctorData = null;
                let patientData = null;
                let pharmacistData = null;
                let roomData = null;
                let medicineData = [];

                if (doctorDocRef) {
                    const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
                    if (doctorDocSnapshot.exists()) {
                        doctorData = doctorDocSnapshot.data();
                    }
                }

                if (patientDocRef) {
                    const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
                    if (patientDocSnapshot.exists()) {
                        patientData = patientDocSnapshot.data();
                    }
                }

                if (pharmacistDocRef) {
                    const pharmacistDocSnapshot = await getDoc(doc(db, 'registeredusers', pharmacistDocRef));
                    if (pharmacistDocSnapshot.exists()) {
                        pharmacistData = pharmacistDocSnapshot.data();
                    }
                }

                if (roomDocRef) {
                    const roomDocSnapshot = await getDoc(doc(db, 'room', roomDocRef));
                    if (roomDocSnapshot.exists()) {
                        roomData = roomDocSnapshot.data();
                    }
                }
                for (const medication of medicineDocRef) {
                    const medicineId = medication.medicineId;
                    const quantity = medication.qty;

                    const medicineDocSnapshot = await getDoc(doc(db, 'medicine', medicineId));
                    if (medicineDocSnapshot.exists()) {
                        const medicine = medicineDocSnapshot.data();
                        const medicineWithQuantity = {
                            medicineData: medicine,
                            medicineQty: quantity,
                            medicineId: medicineId,
                        };
                        medicineData.push(medicineWithQuantity);
                    }
                }

                const prescription = {
                    id: doc1.id,
                    data: {
                        ...presData,
                        doctor: doctorData,
                        patient: patientData,
                        pharmacist: pharmacistData,
                        room: roomData,
                        medicine: medicineData,
                    },
                };
                prescriptions.push(prescription);
            }
            setMyCompletePrescriptions(prescriptions);
        } catch (error) {
            console.log(error);
        }
    };

    const seeMedDetail = async (presId: string) => {
        const presSnapshot = await getDoc(doc(db, 'prescriptions', presId));
        const prescriptions = [];

        const presData = presSnapshot.data();
        const doctorDocRef = presData.doctorId;
        const patientDocRef = presData.patientId;
        const pharmacistDocRef = presData.pharmacistId;
        const roomDocRef = presData.roomId;
        const medicineDocRef = presData.medicineList;

        let doctorData = null;
        let patientData = null;
        let pharmacistData = null;
        let roomData = null;
        let medicineData = [];

        if (doctorDocRef) {
            const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
            if (doctorDocSnapshot.exists()) {
                doctorData = doctorDocSnapshot.data();
            }
        }

        if (patientDocRef) {
            const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
            if (patientDocSnapshot.exists()) {
                patientData = patientDocSnapshot.data();
            }
        }

        if (pharmacistDocRef) {
            const pharmacistDocSnapshot = await getDoc(doc(db, 'registeredusers', pharmacistDocRef));
            if (pharmacistDocSnapshot.exists()) {
                pharmacistData = pharmacistDocSnapshot.data();
            }
        }

        if (roomDocRef) {
            const roomDocSnapshot = await getDoc(doc(db, 'room', roomDocRef));
            if (roomDocSnapshot.exists()) {
                roomData = roomDocSnapshot.data();
            }
        }
        for (const medication of medicineDocRef) {
            const medicineId = medication.medicineId;
            const quantity = medication.qty;

            const medicineDocSnapshot = await getDoc(doc(db, 'medicine', medicineId));
            if (medicineDocSnapshot.exists()) {
                const medicine = medicineDocSnapshot.data();
                const medicineWithQuantity = {
                    medicineData: medicine,
                    medicineQty: quantity,
                    medicineId: medicineId,
                };
                medicineData.push(medicineWithQuantity);
            }
        }

        const prescription = {
            id: presSnapshot.id,
            data: {
                ...presData,
                doctor: doctorData,
                patient: patientData,
                pharmacist: pharmacistData,
                room: roomData,
                medicine: medicineData,
            },
        };

        prescriptions.push(prescription);
        setMyPrescriptionsDetail(prescriptions);
    }

    const handleMedicineSelection = (medicineId) => {
        setSelectedMedicines((prevSelectedMedicines) => {
            return {
                ...prevSelectedMedicines,
                [medicineId]: !prevSelectedMedicines[medicineId],
            };
        });
    };
    const [appointmentQueueCategory, setAppointmentQueueCategory] = useState("");
    const [patientIdInsertPres, setPatientIdInsertPres] = useState("");
    const [roomIdInsertPres, setRoomIdInsertPres] = useState("");

    const handleCompletePrescription = async (grandTotal: number) => {
        // Add Bills
        const billSnapshot = await getDoc(doc(db, 'prescriptions', selectedPrescriptionId));
        const receipts = [];

        const billData = billSnapshot.data();
        const medicineDocRef = billData.medicineList;

        let medicineData = [];

        for (const medication of medicineDocRef) {
            const medicineId = medication.medicineId;
            const quantity = medication.qty;

            const medicineDocSnapshot = await getDoc(doc(db, 'medicine', medicineId));
            if (medicineDocSnapshot.exists()) {
                const medicine = medicineDocSnapshot.data();
                const medicineWithQuantity = {
                    medicineData: medicine,
                    medicineQty: quantity,
                    medicineId: medicineId,
                };
                medicineData.push(medicineWithQuantity);
            }
        }

        // Get listMedicine
        const listMedicine = medicineData.map((medication) => ({
            medicineId: medication.medicineId,
            qty: medication.medicineQty,
        }));

        // Add Bills
        const billsRef = collection(db, 'bills');
        const newBill = {
            billDate: serverTimestamp(),
            billName: 'Prescription Fee',
            billStatus: 'unpaid',
            billPrice: grandTotal,
            medicineList: listMedicine,
        };

        const newBillRef = await addDoc(billsRef, newBill);

        // // Update Patient
        const patientRef = doc(db, 'patient', selectedPatientId);
        const patientSnapshot = await getDoc(patientRef);

        if (patientSnapshot.exists()) {
            const patientData = patientSnapshot.data();
            const handledByArray = patientData.handledBy || [];
            const billCollectionArray = patientData.billCollection || [];

            if (billCollectionArray.length === 0) {
                await updateDoc(patientRef, {
                    handledBy: [localStorage.getItem('id')],
                    billCollection: [newBillRef.id],
                });
            } else {
                const updatedHandledByArray = [...handledByArray, localStorage.getItem('id')];
                const updatedBillCollectionArray = [...billCollectionArray, newBillRef.id];
                if (handledByArray.includes(localStorage.getItem('id'))) {
                    await updateDoc(patientRef, {
                        billCollection: updatedBillCollectionArray,
                    });
                }
                else {
                    await updateDoc(patientRef, {
                        handledBy: updatedHandledByArray,
                        billCollection: updatedBillCollectionArray,
                    });
                }
            }

            // Update Medicine
            const medicinesRef = collection(db, 'medicine');

            for (const medicineId in selectedMedicines) {
                if (selectedMedicines[medicineId]) {
                    const medicineDocRef = doc(medicinesRef, medicineId);
                    const selectedMedicine = myPrescriptionsDetail
                        .flatMap((presDes) => presDes.data.medicine)
                        .find((detail) => detail.medicineId === medicineId);

                    if (selectedMedicine) {
                        const stockLeft = selectedMedicine.medicineData.medicineStock - selectedMedicine.medicineQty;
                        if (stockLeft >= 0) {
                            // Update the medicine stock
                            await updateDoc(medicineDocRef, {
                                medicineStock: stockLeft
                            });
                        }
                    }
                }
            }

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "nurse",
                content: "Delivering Medicine",
                notifDate: Timestamp.now(),
            })

            // Add Job For Nurse
            const jobRef = collection(db, 'job');

            const newJob = {
                jobAssigned: Timestamp.now(),
                jobCategory: "Medicine Management",
                jobDone: false,
                jobDue: null,
                jobName: "Delivering Medicine",
                jobStatus: "unfinished",
                patientId: selectedPatientId,
                roomId: selectedRoomId,
                staffRole: "nurse",
                bedId: selectedBedId,
                isDone: false,
                jobType: 'auto-assign',
            };

            try {
                await addDoc(jobRef, newJob);
            } catch (error) {
                console.log(error);
            }

            // Update Job for Pharmacist
            const docRef = doc(db, 'job', selectedJobId);
            const querySnapshot = await getDoc(docRef);

            await updateDoc(docRef, {
                jobDone: serverTimestamp(),
                jobStatus: "completed",
                isDone: true,
                doneBy: localStorage.getItem('id'),
            });

            // Update Prescriptions
            const docRef1 = doc(db, 'prescriptions', selectedPrescriptionId);
            const querySnapshot1 = await getDoc(docRef1);

            await updateDoc(docRef1, {
                pharmacistId: localStorage.getItem('id'),
                prescriptionStatus: "completed",
            })

            handleSnackbar();
            setAlertMessage("Prescription Succesfully Completed!");
            setDataChange(true);
            handleCloseCompletePrescription();
        };
    }

    const [openInsertPres, setOpenInsertPres] = useState(false);
    const [openMedicineQty, setOpenMedicineQty] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState([
        { medicineId: '', medicineName: '', quantity: '' }
    ]);
    const [prescriptionErrorMsg, setPrescriptionErrorMsg] = useState("");
    const [medicine, setMedicine] = useState([]);
    const [qty, setQty] = useState('');
    const [prescriptionNote, setPrescriptionNote] = useState('');
    const [rooms, setRooms] = useState([]);


    const handlePrescription = async () => {
        // Handle Prescription
        if (selectedMedicine.length === 1 || prescriptionNote.length === 0) {
            setPrescriptionErrorMsg('Please select medicine and fill the notes!.');
            return;
        }
        setPrescriptionErrorMsg(null);
        const prescriptionRef = collection(db, 'prescriptions');
        let doctorid = null;
        if (localStorage.getItem('role') == 'doctor') {
            doctorid = localStorage.getItem('id');
        }
        const medicineList1 = selectedMedicine
            .filter((medicine) => medicine.medicineId && medicine.quantity) // Filter out elements with null values
            .map((medicine) => ({
                medicineId: medicine.medicineId,
                qty: medicine.quantity,
            }));

        console.log(patientIdInsertPres);

        const newPrescription = {
            doctorId: doctorid,
            medicineList: medicineList1,
            note: prescriptionNote,
            patientId: patientIdInsertPres,
            pharmacistId: null,
            prescriptionStatus: "queued",
            prescriptionDate: Timestamp.now(),
            queueCategory: appointmentQueueCategory,
            roomId: appointmentRoom,
        }

        const newPresID = await addDoc(prescriptionRef, newPrescription);

        const jobRef = collection(db, 'job');

        const newJob = {
            jobAssigned: Timestamp.now(),
            jobCategory: "Medicine Management",
            jobDone: false,
            jobDue: null,
            jobName: "Preparing Medicine",
            jobStatus: "unfinished",
            patientId: patientIdInsertPres,
            roomId: appointmentRoom,
            staffRole: "pharmacist",
            bedId: null,
            isDone: false,
            prescriptionId: newPresID.id,
            jobType: 'auto-assign',
        };

        try {
            await addDoc(jobRef, newJob);
        } catch (error) {
            console.log(error);
        }

        const notifRef = collection(db, 'notification');

        await addDoc(notifRef, {
            userRole: "nurse",
            content: "Preparing Medicine",
            notifDate: Timestamp.now(),
        })

        handleSnackbar();
        setAlertMessage("Prescription succesfully inserted!");
        handleCloseCreatePrescription();
        setDataChange(true);
    }



    const fetchMedicine = async () => {
        const medicineSnapshot = await getDocs(collection(db, 'medicine'));
        const medicineData = medicineSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setMedicine(medicineData);
    }

    const fetchRooms = async () => {
        const roomSnapshot = await getDocs(collection(db, 'room'));
        const roomData = roomSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setRooms(roomData);
    };

    const filteredRows = selectedMedicine.filter((med) => med.quantity !== null && med.quantity !== "0");

    const handleRemoveMedicine = (index) => {
        setSelectedMedicine((prevMedicine) => {
            const updatedMedicine = [...prevMedicine];
            updatedMedicine.splice(index, 1);
            return updatedMedicine;
        });
    };

    const handleOpenCreatePrescription = async () => {
        fetchMedicine();
        fetchPatients();
        fetchRooms();
        setOpenInsertPres(true);
    }

    const handleCloseCreatePrescription = async () => {
        setOpenInsertPres(false);
    }

    const handleOpenMedQty = (medId: string, medName: string) => {
        selectedMedicineId = medId;
        selectedMedicineName = medName;
        setOpenMedicineQty(true);
    }

    const handleCloseMedQty = () => {
        setOpenMedicineQty(false);
    }

    useEffect(() => {
        getPrescriptions();
        getCompletePrescriptions();
    }, []);

    useEffect(() => {
        if (dataChange) {
            getPrescriptions();
            getCompletePrescriptions();
            setDataChange(false);
        }
    }, [dataChange]);
    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '25px', marginTop: '55px' }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    handleOpenCreatePrescription();
                                }}
                                style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                            >
                                Add Prescription
                            </Button>
                            <h1>Ongoing Prescriptions Request</h1>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <DataGrid
                                    style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    columns={[
                                        { field: 'jobName', headerName: 'Job Name', width: 200, renderCell: RenderCellExpand },
                                        { field: 'prescriptionDate', headerName: 'Prescription Date', width: 180 },
                                        { field: 'prescriptionNote', headerName: 'Prescription Note', width: 180 },
                                        {
                                            field: 'prescriptionStatus',
                                            headerName: 'Prescription Status',
                                            width: 150,
                                            renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColor(params.row.prescriptionStatus),
                                                        width: '100%',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.prescriptionStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'patientName', headerName: 'Patient Name', width: 150 },
                                        { field: 'roomNumber', headerName: 'Room Number', width: 160 },
                                        {
                                            field: 'queueCategory', headerName: 'Queue Category', width: 200, renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColorForQueue(params.row.queueCategory),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.queueCategory}
                                                </div>
                                            ),
                                        },
                                        {
                                            field: 'action',

                                            headerName: 'Action',
                                            width: 390,
                                            renderCell: (params) => (
                                                <div>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            seeMedDetail(params.row.prescriptionId);
                                                            handleOpenPrescriptionDetail();
                                                        }}
                                                        style={{ marginRight: '30px' }}
                                                    >
                                                        See Medicine Details
                                                    </Button>
                                                    {localStorage.getItem('role') == 'pharmacist' && (
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                seeMedDetail(params.row.prescriptionId);
                                                                handleOpenCompletePrescription(params.row.patientId, params.row.roomId, params.row.bedId, params.row.id, params.row.prescriptionId);
                                                            }}
                                                        >
                                                            Set Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}
                                    rows={myPrescriptions.map((job) => ({
                                        id: job.id,
                                        jobName: job.data.jobName,
                                        prescriptionDate: job.data.prescription.prescriptionDate.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }),
                                        prescriptionNote: job.data.prescription.note,
                                        prescriptionStatus: job.data.prescription.prescriptionStatus,
                                        patientName: job.data.patient ? job.data.patient.patientName : 'No Patients',
                                        roomNumber: job.data.room ? job.data.room.roomNumber : 'No Room',
                                        queueCategory: job.data.prescription.queueCategory,
                                        prescriptionId: job.data.prescriptionId,
                                        patientId: job.data.patientId,
                                        roomId: job.data.roomId,
                                        bedId: job.data.bedId,
                                    }))}
                                    autoHeight
                                />
                            </Box>

                            <h1>Completed Prescriptions</h1>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <DataGrid
                                    style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    columns={[
                                        { field: 'completedBy', headerName: 'Completed By', width: 180 },
                                        { field: 'prescriptionDate', headerName: 'Prescription Date', width: 180 },
                                        { field: 'prescriptionNote', headerName: 'Prescription Note', width: 180 },
                                        {
                                            field: 'prescriptionStatus',
                                            headerName: 'Prescription Status',
                                            width: 150,
                                            renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColor(params.row.prescriptionStatus),
                                                        width: '100%',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.prescriptionStatus}
                                                </div>
                                            ),
                                        },
                                        { field: 'patientName', headerName: 'Patient Name', width: 150 },
                                        { field: 'roomNumber', headerName: 'Room Number', width: 160 },
                                        {
                                            field: 'queueCategory', headerName: 'Queue Category', width: 200, renderCell: (params) => (
                                                <div
                                                    style={{
                                                        backgroundColor: getBackgroundColorForQueue(params.row.queueCategory),
                                                        width: '170px',
                                                        height: '80%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        borderRadius: '25px',
                                                    }}
                                                >
                                                    {params.row.queueCategory}
                                                </div>
                                            ),
                                        },
                                        {
                                            field: 'action',

                                            headerName: 'Action',
                                            width: 390,
                                            renderCell: (params) => (
                                                <div>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            seeMedDetail(params.row.prescriptionId);
                                                            handleOpenPrescriptionDetail();
                                                        }}
                                                        style={{ marginRight: '30px' }}
                                                    >
                                                        See Medicine Details
                                                    </Button>
                                                </div>
                                            ),
                                        },
                                    ]}
                                    rows={myCompletePrescriptions.map((job) => ({
                                        id: job.id,
                                        completedBy: job.data.pharmacist.userName,
                                        prescriptionDate: job.data.prescriptionDate.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }),
                                        prescriptionNote: job.data.note,
                                        prescriptionStatus: job.data.prescriptionStatus,
                                        patientName: job.data.patient ? job.data.patient.patientName : 'No Patients',
                                        roomNumber: job.data.room.roomNumber,
                                        queueCategory: job.data.queueCategory,
                                        prescriptionId: job.id,
                                        patientId: job.data.patientId,
                                        roomId: job.data.roomId,
                                        bedId: job.data.bedId,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                            <Dialog open={openPrescriptionDetail} onClose={handleClosePrescriptionDetail} fullWidth maxWidth={false}>
                                <DialogTitle>Prescriptions Detail</DialogTitle>
                                <DialogContent>
                                    <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                        <thead>
                                            <tr>
                                                <th>Prescription ID</th>
                                                <th>Prescription Date</th>
                                                <th>Patient Name</th>
                                                <th>Medicine Name</th>
                                                <th>Medicine Price</th>
                                                <th>Medicine Type</th>
                                                <th>Medicine Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myPrescriptionsDetail.map((presDes) => {
                                                return (
                                                    <tr key={presDes.id}>
                                                        <td>{presDes.id}</td>
                                                        <td>{presDes.data.prescriptionDate.toDate().toLocaleDateString()}</td>
                                                        <td>{presDes.data.patient.patientName}</td>
                                                        <td>
                                                            {presDes.data.medicine.map((detail, index) => (
                                                                <div key={index}>
                                                                    <span>{`${detail.medicineData.medicineName}`}</span>
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {presDes.data.medicine.map((detail, index) => (
                                                                <div key={index}>
                                                                    <span>{`Rp. ${detail.medicineData.medicinePrice}`}</span>
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {presDes.data.medicine.map((detail, index) => (
                                                                <div key={index}>
                                                                    <span>{`${detail.medicineData.medicineType}`}</span>
                                                                </div>
                                                            ))}
                                                        </td>                                                        <td>
                                                            {presDes.data.medicine.map((detail, index) => (
                                                                <div key={index}>
                                                                    <span>{`${detail.medicineQty}`}</span>
                                                                </div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={openCompletePrescription} onClose={handleCloseCompletePrescription} fullWidth maxWidth={false}>
                                <DialogTitle>Complete Prescriptions</DialogTitle>
                                <DialogContent>
                                    {myPrescriptionsDetail.map((presDes) => {
                                        let grandTotal = null;
                                        return (
                                            <div>
                                                <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                                    <thead>
                                                        <tr>
                                                            <th>Prescription Date</th>
                                                            <th>Patient Name</th>
                                                            <th>Medicine Name</th>
                                                            <th>Medicine Price</th>
                                                            <th>Medicine Type</th>
                                                            <th>Medicine Qty</th>
                                                            <th>Stock Status</th>
                                                            <th>Checked Medicine</th>
                                                            <th>SubTotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr key={presDes.id}>
                                                            <td>{presDes.data.prescriptionDate.toDate().toLocaleDateString()}</td>
                                                            <td>{presDes.data.patient.patientName}</td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => {
                                                                    const { medicineId, medicineData, medicineQty } = detail;
                                                                    const checkboxId = `${presDes.id}-${medicineId}`;
                                                                    const stockLeft = medicineData.medicineStock - detail.medicineQty;
                                                                    const stockMessage = stockLeft >= 0 ? `(${stockLeft}) stock left` : 'Out of stock';
                                                                    const isOutOfStock = stockLeft < 0; // Check if medicine is out of stock

                                                                    return (
                                                                        <div key={index}>
                                                                            <span>{`${medicineData.medicineName}`}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => (
                                                                    <div key={index}>
                                                                        <span>{`Rp. ${detail.medicineData.medicinePrice}`}</span>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => (
                                                                    <div key={index}>
                                                                        <span>{`${detail.medicineData.medicineType}`}</span>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => (
                                                                    <div key={index}>
                                                                        <span>{`${detail.medicineQty}`}</span>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => {
                                                                    const { medicineId, medicineData, medicineQty } = detail;
                                                                    const checkboxId = `${presDes.id}-${medicineId}`;
                                                                    const stockLeft = medicineData.medicineStock - detail.medicineQty;
                                                                    const stockMessage = stockLeft >= 0 ? `(${stockLeft}) stock left` : 'Out of stock';
                                                                    const isOutOfStock = stockLeft < 0; // Check if medicine is out of stock

                                                                    return (
                                                                        <div key={index}>
                                                                            <label htmlFor={checkboxId}>
                                                                                <span>{`${stockMessage}`}</span>
                                                                            </label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => {
                                                                    const { medicineId, medicineData, medicineQty } = detail;
                                                                    const checkboxId = `${presDes.id}-${medicineId}`;
                                                                    const stockLeft = medicineData.medicineStock - detail.medicineQty;
                                                                    const stockMessage = stockLeft >= 0 ? `(${stockLeft}) stock left` : 'Out of stock';
                                                                    const isOutOfStock = stockLeft < 0; // Check if medicine is out of stock

                                                                    return (
                                                                        <div key={index}>
                                                                            <label htmlFor={checkboxId}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={checkboxId}
                                                                                    checked={selectedMedicines[medicineId]}
                                                                                    onChange={() => handleMedicineSelection(medicineId)}
                                                                                    disabled={isOutOfStock} // Disable checkbox if medicine is out of stock
                                                                                    style={{
                                                                                        width: '15px',
                                                                                        height: '13px'
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                            <td>
                                                                {presDes.data.medicine.map((detail, index) => {
                                                                    const { medicineId, medicineData, medicineQty } = detail;
                                                                    const checkboxId = `${presDes.id}-${medicineId}`;
                                                                    const stockLeft = medicineData.medicineStock - detail.medicineQty;
                                                                    const stockMessage = stockLeft >= 0 ? `(${stockLeft}) stock left` : 'Out of stock';
                                                                    const isOutOfStock = stockLeft < 0; // Check if medicine is out of stock

                                                                    const medicineSubtotal = medicineData.medicinePrice * medicineQty;

                                                                    if (!isOutOfStock) {
                                                                        // Only include medicines that are available and not out of stock in the grand total calculation
                                                                        const medicineSubtotal1 = medicineData.medicinePrice * medicineQty;
                                                                        grandTotal += medicineSubtotal1;
                                                                    }

                                                                    finalGrandTotal = grandTotal;

                                                                    return (
                                                                        <div>
                                                                            {!isOutOfStock ? <span>Rp. {medicineSubtotal}</span>
                                                                                : "Out Of Stock"}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <h1
                                                    style={{ textAlign: 'center' }}
                                                >Grand Total : <span style={{ fontWeight: 'bolder' }}>Rp. {grandTotal}</span></h1>
                                            </div>
                                        )
                                    })}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginTop: '50px',
                                    }}>

                                        <Button
                                            variant='contained'
                                            style={{
                                                width: '30%',
                                            }}
                                            onClick={(e) => {
                                                handleCompletePrescription(finalGrandTotal);
                                            }}>
                                            Complete Prescription
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Box>
                    <Dialog open={openInsertPres} onClose={handleCloseCreatePrescription} maxWidth={false} fullWidth>
                        <DialogTitle>Medicine View</DialogTitle>
                        <DialogContent>
                            <h1 style={{ textAlign: 'center' }}>Medicine List</h1>
                            <DataGrid
                                columns={[
                                    { field: 'medicineName', headerName: 'Medicine Name', width: 200 },
                                    { field: 'medicineType', headerName: 'Medicine Type', width: 180 },
                                    { field: 'medicineStock', headerName: 'Medicine Stock', width: 140 },
                                    { field: 'medicinePrice', headerName: 'Medicine Price', width: 130 },
                                    {
                                        field: 'action', headerName: 'Action', width: 200,

                                        renderCell: (params) => (
                                            <Button
                                                onClick={() => {
                                                    handleOpenMedQty(params.row.id, params.row.medicineName);
                                                }}>
                                                Add To Prescription
                                            </Button>
                                        ),
                                    }
                                ]}
                                rows={medicine.map((med) => ({
                                    id: med.id,
                                    medicineName: med.data.medicineName,
                                    medicineType: med.data.medicineType,
                                    medicineStock: med.data.medicineStock,
                                    medicinePrice: med.data.medicinePrice,
                                }))}
                                autoHeight
                            />
                            <h1 style={{ textAlign: 'center' }}>Selected Medicine</h1>
                            <DataGrid
                                columns={[
                                    { field: 'medicineName', headerName: 'Medicine Name', width: 200 },
                                    { field: 'medicineQty', headerName: 'Medicine Type', width: 180 },
                                    {
                                        field: 'action',
                                        headerName: 'Action',
                                        width: 200,
                                        renderCell: (params) => params.row.removeMed(),
                                    },
                                ]}
                                rows={filteredRows
                                    .filter((med) => med.medicineName && med.quantity) // Filter out rows with null or empty values
                                    .map((med, index) => ({
                                        id: med.medicineId,
                                        medicineName: med.medicineName,
                                        medicineQty: med.quantity,
                                        removeMed: () => (
                                            <div>
                                                <Button variant="contained" onClick={() => handleRemoveMedicine(index)}>
                                                    Remove Med
                                                </Button>
                                            </div>
                                        ),
                                    }))
                                }
                                autoHeight
                            />
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Queue Category:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentQueueCategory(e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="urgent">Urgent</MenuItem>
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Patient:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setPatientIdInsertPres(e.target.value)}
                                fullWidth
                            >
                                {patient.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.patientName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Room:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentRoom(e.target.value)}
                                fullWidth
                            >
                                {rooms.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.roomNumber}
                                    </MenuItem>
                                ))}
                            </Select>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="presDes"
                                label="Prescription Notes"
                                type="text"
                                id="presDes"
                                value={prescriptionNote}
                                onBlur={() => { }}
                                onChange={(e) => setPrescriptionNote(e.target.value)}
                                error={prescriptionNote.length <= 0}
                                helperText={prescriptionNote.length <= 0 ? 'Notes must be filled!' : ''}
                            />
                            {prescriptionErrorMsg && <p style={{ color: 'red' }}>{prescriptionErrorMsg}</p>}
                            <Button
                                style={{ float: 'right' }}
                                onClick={() => handlePrescription()}
                            >
                                Create Prescription
                            </Button>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openMedicineQty} onClose={handleCloseMedQty}>
                        <DialogTitle>Add Medicine Qty</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medQty"
                                label="Medicine Qty"
                                type="number"
                                id="medQty"
                                value={qty}
                                onBlur={() => { }}
                                onChange={(e) => setQty(e.target.value)}
                                error={parseInt(qty) <= 0}
                                helperText={parseInt(qty) <= 0 ? 'Quantity must be greater than 0' : ''}
                            />
                            <Box marginTop={2}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    onClick={() => {
                                        const selectedMedicineItem = {
                                            medicineId: selectedMedicineId,
                                            medicineName: selectedMedicineName,
                                            quantity: qty.toString(), // Convert the quantity to a string
                                        };

                                        const existingMedicine = selectedMedicine.find(
                                            (medicine) => medicine.medicineName === selectedMedicineName
                                        );

                                        if (existingMedicine) {
                                            const prevQty = parseFloat(existingMedicine.quantity); // Parse the existing quantity as a number
                                            const currentQty = parseFloat(qty); // Parse the new/current quantity as a number
                                            existingMedicine.quantity = (prevQty + currentQty).toString(); // Convert the updated quantity back to a string
                                        } else {
                                            setSelectedMedicine((prevMedicine) => [...prevMedicine, selectedMedicineItem]);
                                        }

                                        handleCloseMedQty();
                                        setQty(''); // Reset the quantity to an empty string or an appropriate initial value
                                        setDataChange(true);
                                    }}
                                >
                                    Set Qty
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

export default ViewPrescriptions;
