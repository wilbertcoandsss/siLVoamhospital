import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, setDoc, addDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
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
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugion from "@fullcalendar/interaction";
import ErrorOutlineTwoToneIcon from '@mui/icons-material/ErrorOutlineTwoTone';
import HelpOutlineTwoToneIcon from '@mui/icons-material/HelpOutlineTwoTone';

const localizer = momentLocalizer(moment);

let isAppointmentCompleted = null;
let selectedAppId = null;
let selectedAppResId = null;
let selectedMedicineId = null;
let selectedMedicineName = null;
let selectedPatientId = null;
let selectedQueueCategory = null;
let selectedRoomId = null;
let selectedDate1 = null;
let selectedBedId = null;

const getBackgroundColor = (appointmentStatus) => {
    if (appointmentStatus === 'queued') {
        return 'darkblue';
    } else if (appointmentStatus === 'in progress') {
        return 'orange';
    } else if (appointmentStatus === 'completed') {
        return 'green';
    } else if (appointmentStatus === 'skipped') {
        return 'red';
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


function viewAppointment() {

    const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);

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

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [openAppointmentResult, setOpenAppointmentResult] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [dataChange, setDataChange] = useState(false);
    const [appointmentList, setAppointmentList] = useState([]);
    const [doctorAppointmentList, setDoctorAppointmentList] = useState([]);
    const [appointmentResult, setAppointmentResult] = useState([]);

    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState("");

    // Appointment Form
    const [createAppointment, setCreateAppointment] = useState(false);
    const [openAppointmentStatus, setOpenAppointmentStatus] = useState(false);
    const [openUpdateAppointmentForm, setOpenUpdateAppointmentForm] = useState(false);
    const [selectedAppointmentData, setSelectedAppointmentData] = useState([]);
    const [openPopupReservedDate, setOpenPopupReservedDate] = useState(false);
    const [openPopupScheduleConfirmation, setOpenPopupScheduleConfirmation] = useState(false);
    const [popupAppointmentResult, setPopupAppointmentResult] = useState(false);
    const [popupEditAppointmentResult, setPopupEditAppointmentResult] = useState(false);
    // DB Attributes
    const [appointmentDate, setAppointmentDate] = useState(null);
    const [appointmentName, setAppointmentName] = useState("");
    const [appointmentBed, setAppointmentBed] = useState("");
    const [appointmentDoctor, setAppointmentDoctor] = useState("");
    const [appointmentPatient, setAppointmentPatient] = useState("");
    const [appointmentRoom, setAppointmentRoom] = useState("");
    const [appointmentQueueCategory, setAppointmentQueueCategory] = useState("");

    const [patientSymptoms, setPatientSymptoms] = useState("");
    const [doctorDiagnosis, setDoctorDiagnosis] = useState("");

    // fetch
    const [rooms, setRooms] = useState([]);
    const [doctor, setDoctor] = useState([]);
    const [beds, setBeds] = useState([]);
    const [patient, setPatient] = useState([]);
    const [medicine, setMedicine] = useState([]);

    // Prescription
    const [openMedicineView, setOpenMedicineView] = useState(false);
    const [openMedicineQty, setOpenMedicineQty] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState([
        { medicineId: '', medicineName: '', quantity: '' }
    ]);
    const [qty, setQty] = useState('');
    const [prescriptionNote, setPrescriptionNote] = useState('');

    const [prescriptionErrorMsg, setPrescriptionErrorMsg] = useState("");

    const [openNextAppointment, setOpenNextAppointment] = useState(false);

    const [selectedNextScheduleDate, setSelecteedNextScheduleDate] = useState('');
    const [selectedScheduleOption, setSelectedScheduleOption] = useState('');
    const [selectedTime, setSelectedTime] = useState('');


    const [confirmationNextSchedule, setConfirmationNextSchedule] = useState(false);

    const fetchRooms = async () => {
        const roomSnapshot = await getDocs(collection(db, 'room'));
        const roomData = roomSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setRooms(roomData);
    };

    const handleOpenAppointmentStatus = (appointmentId: string) => {
        selectedAppId = appointmentId;
        setOpenAppointmentStatus(true);
    }

    const handleCloseAppointmentStatus = () => {
        setOpenAppointmentStatus(false);
    }

    const handleOpenUpdateAppointmentForm = (appointmentId: string) => {
        selectedAppId = appointmentId;
        setOpenUpdateAppointmentForm(true);
    }

    const handleCloseUpdateAppointmentForm = () => {
        setOpenUpdateAppointmentForm(false);
    }

    const handleOpenMedicineView = () => {
        setOpenMedicineView(true);
    }

    const handleCloseMedicineView = () => {
        setOpenMedicineView(false);
    }

    const handleOpenNextAppointment = () => {
        handleCloseMedicineView();
        fetchAppointment();
        setOpenNextAppointment(true);
    }

    const handleCloseNextAppointment = () => {
        setOpenNextAppointment(false);
    }

    const handleOpenMedQty = (medId: string, medName: string) => {
        selectedMedicineId = medId;
        selectedMedicineName = medName;
        setOpenMedicineQty(true);
    }

    const handleCloseMedQty = () => {
        setOpenMedicineQty(false);
    }

    const handleOpenPopupReservedDate = () => {
        setOpenPopupReservedDate(true);
    }

    const handleClosePopupReservedDate = () => {
        setOpenPopupReservedDate(false);
    }

    const handleOpenPopupScheduleConfirmation = () => {
        setOpenPopupScheduleConfirmation(true);
    }

    const handleClosePopupScheduleConfirmation = () => {
        setOpenPopupScheduleConfirmation(false);
    }

    const handleCloseConfirmationNextSchedule = () => {
        setConfirmationNextSchedule(false);
        setOpenPopupScheduleConfirmation(false);
    }

    const handleOpenPopupAppointmentResult = () => {
        handleCloseNextAppointment();
        handleCloseConfirmationNextSchedule();
        setPopupAppointmentResult(true);
    }

    const handleClosePopupAppointmentResult = () => {
        setPopupAppointmentResult(false);
    }

    const handleOpenEditPopupAppointmentResult = (appId: string) => {
        selectedAppId = appId;
        setPopupEditAppointmentResult(true);
    }

    const handleCloseEditPopupAppointmentResult = () => {
        setPopupEditAppointmentResult(false);
    }

    const fetchDoctor = async () => {
        const q = query(collection(db, 'registeredusers'), where('userRole', '==', 'doctor'));
        const doctorSnapshot = await getDocs(q);
        const doctorData = doctorSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setDoctor(doctorData);
    };

    const fetchBeds = async () => {
        const bedSnapshot = await getDocs(collection(db, 'bed'));
        const bedData = bedSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setBeds(bedData);
    };

    const fetchPatients = async () => {
        const patientSnapshot = await getDocs(collection(db, 'patient'));
        const patientData = patientSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setPatient(patientData);
    };

    const fetchMedicine = async () => {
        const medicineSnapshot = await getDocs(collection(db, 'medicine'));
        const medicineData = medicineSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        setMedicine(medicineData);
    }

    const handleOpenCreateAppointment = () => {
        setCreateAppointment(true);
    }

    const handleCloseCreateAppointment = () => {
        setCreateAppointment(false);
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleOpenAppointmentResult = (appId: string) => {
        getAppointmentResult(appId);
        setOpenAppointmentResult(true);
    }

    const handleCloseAppointmentResult = () => {
        setOpenAppointmentResult(false);
    }

    const fetchAppointment = async () => {
        try {
            let q = query(collection(db, 'appointment'));

            if (localStorage.getItem('role') === 'nurse') {
                // Retrieve all appointments
                q = query(collection(db, 'appointment'));
            } else if (localStorage.getItem('role') === 'doctor') {
                const doctorId = localStorage.getItem('id');
                q = query(collection(db, 'appointment'), where('doctorId', '==', doctorId));
            }

            const querySnapshot = await getDocs(q);
            const appointments = [];

            for (const doc1 of querySnapshot.docs) {
                const appointmentData = doc1.data();

                const doctorDocRef = appointmentData.doctorId;
                const patientDocRef = appointmentData.patientId;
                const roomDocRef = appointmentData.roomId;
                const bedDocRef = appointmentData.bedNumber;
                const appResRef = appointmentData.appointmentResult;

                let doctorData = null;
                let patientData = null;
                let roomData = null;
                let bedData = null;
                let appResData = null;

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

                if (doctorDocRef) {
                    const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
                    if (doctorDocSnapshot.exists()) {
                        doctorData = doctorDocSnapshot.data();
                    }
                }

                if (bedDocRef) {
                    const bedDocSnapshot = await getDoc(doc(db, 'bed', bedDocRef));
                    if (bedDocSnapshot.exists()) {
                        bedData = bedDocSnapshot.data();
                    }
                }

                if (appResRef) {
                    const appResSnapshot = await getDoc(doc(db, 'appointmentresult', appointmentData.appointmentResult));
                    if (appResSnapshot.exists()) {
                        appResData = appResSnapshot.data();
                    }
                }

                const appointment = {
                    id: doc1.id,
                    data: {
                        ...appointmentData,
                        patient: patientData,
                        room: roomData,
                        doctor: doctorData,
                        result: appResData,
                        bed: bedData,
                    },
                };
                appointments.push(appointment);
            }
            setAppointmentList(appointments);
        } catch (error) {
            console.log("error", error);
        }
    }

    const getAppointmentResult = async (appointmentId: string) => {
        const appoinmentSnapshot = await getDoc(doc(db, 'appointment', appointmentId));

        const appointmentData = appoinmentSnapshot.data();

        const appointmentResultsId = appointmentData.appointmentResult;

        const appointmentResultSnapshot = await getDoc(doc(db, 'appointmentresult', appointmentResultsId));

        let appResult = [];
        let patientData = null;
        let doctorData = null;
        let appointmentResult = null;

        const appResData = appointmentResultSnapshot.data();

        const patientDocRef = appointmentData.patientId;
        const doctorDocRef = appointmentData.doctorId;

        if (patientDocRef) {
            const patientDocSnapshot = await getDoc(doc(db, 'patient', patientDocRef));
            if (patientDocSnapshot.exists()) {
                patientData = patientDocSnapshot.data();
            }
        }

        if (doctorDocRef) {
            const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorDocRef));
            if (doctorDocSnapshot.exists()) {
                doctorData = doctorDocSnapshot.data();
            }
        }

        const appRes = {
            id: appointmentResultSnapshot.id,
            data: {
                ...appResData,
                appointment: appointmentData,
                patient: patientData,
                doctor: doctorData,
            },
        };

        appResult.push(appRes);
        setAppointmentResult(appResult);
    };

    const insertAppointment = async () => {
        try {
            const appointmentRef = collection(db, 'appointment');
            const timestampAppDate = Timestamp.fromDate(appointmentDate.toDate());

            const maxQueueRef = await getDocs(query(collection(db, 'appointment'), orderBy('queueNumber', 'desc'), limit(1)));

            let maxQueue = null;

            if (maxQueueRef && maxQueueRef.size > 0) {
                maxQueue = maxQueueRef.docs[0].data().queueNumber;
            }
            else{
                maxQueue = 0;
            }

            const newAppointment = {
                appointmentDate: timestampAppDate,
                appointmentName: appointmentName,
                appointmentResult: null,
                appointmentStatus: "queued",
                bedNumber: appointmentBed,
                doctorId: appointmentDoctor,
                isDone: false,
                patientId: appointmentPatient,
                queueCategory: appointmentQueueCategory,
                queueNumber: maxQueue + 1,
                roomId: appointmentRoom,
            }

            await addDoc(appointmentRef, newAppointment);
            handleSnackbar();
            setAlertMessage("Appointment Succesfully Inserted!");
            handleCloseCreateAppointment();
            setDataChange(true);
        } catch (error) {
            console.log(error);
        }
    }

    const deleteAppointment = async (appointmentId: string) => {
        try {
            const docRef = doc(db, 'appointment', appointmentId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await deleteDoc(docRef);
                setAlertMessage("Appointment Succesfully Deleted!");
                handleSnackbar();
                setDataChange(true);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const updateAppointmentStatus = async () => {
        try {
            const docRef = doc(db, 'appointment', selectedAppId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    appointmentStatus: selectedAppointmentStatus,
                });
                setAlertMessage("Appointment Status Succesfully Updated!");
                handleSnackbar();
                setDataChange(true);
                handleCloseAppointmentStatus();
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const updateAppointmentDetail = async () => {
        try {
            const docRef = doc(db, 'appointment', selectedAppId);
            const docSnapshot = await getDoc(docRef);
            const timestampAppDate = Timestamp.fromDate(appointmentDate.toDate());

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    appointmentDate: timestampAppDate,
                    appointmentName: appointmentName,
                    appointmentResult: null,
                    appointmentStatus: "queued",
                    bedNumber: appointmentBed,
                    doctorId: appointmentDoctor,
                    isDone: false,
                    patientId: appointmentPatient,
                    queueCategory: appointmentQueueCategory,
                    roomId: appointmentRoom,
                });
                setAlertMessage("Appointment Status Succesfully Updated!");
                handleSnackbar();
                setDataChange(true);
                handleCloseUpdateAppointmentForm();
            }
        } catch (error) {
            console.log(error);
        }
    }

    const completeAppointment = async (appointmentId: string, patientId: string, queueCategory: string, roomId: string, bedId: string) => {
        try {
            selectedAppId = appointmentId;
            selectedPatientId = patientId;
            selectedQueueCategory = queueCategory;
            selectedRoomId = roomId;
            selectedBedId = bedId;
            console.log("masuk ga si", selectedBedId, bedId);

            // Set Prescriptions
            fetchMedicine();
            handleOpenMedicineView();

        } catch (error) {
            console.log(error);
        }
    }

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

        const newPrescription = {
            doctorId: doctorid,
            medicineList: medicineList1,
            note: prescriptionNote,
            patientId: selectedPatientId,
            pharmacistId: null,
            prescriptionStatus: "queued",
            prescriptionDate: Timestamp.now(),
            queueCategory: selectedQueueCategory,
            roomId: selectedRoomId,
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
            patientId: selectedPatientId,
            roomId: selectedRoomId,
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
        handleOpenNextAppointment();
    }

    const finalCompleteAppointment = async () => {
        // Consultation Fee
        const billsRef = collection(db, 'bills');

        const newBill = {
            billDate: serverTimestamp(),
            billName: "Consultation Fee",
            billStatus: "unpaid",
            billPrice: 150000,
        };

        const newBillId = await addDoc(billsRef, newBill);

        // Insert to Patient Bills
        const patientRef = doc(db, 'patient', selectedPatientId);
        const patientSnapshot = await getDoc(patientRef);

        if (patientSnapshot.exists()) {
            const patientData = patientSnapshot.data();
            const handledByArray = patientData.handledBy || [];
            const billCollectionArray = patientData.billCollection || [];

            if (billCollectionArray.length === 0) {
                await updateDoc(patientRef, {
                    isHandled: true,
                    handledBy: [localStorage.getItem('id')],
                    billCollection: [newBillId.id],
                });
            } else {
                const updatedHandledByArray = [...handledByArray, localStorage.getItem('id')];
                const updatedBillCollectionArray = [...billCollectionArray, newBillId.id];
                if (handledByArray.includes(localStorage.getItem('id'))) {
                    await updateDoc(patientRef, {
                        isHandled: true,
                        billCollection: updatedBillCollectionArray,
                    });
                }
                else {
                    await updateDoc(patientRef, {
                        isHandled: true,
                        handledBy: updatedHandledByArray,
                        billCollection: updatedBillCollectionArray,
                    });
                }
            }

            await updateDoc(patientRef, {
                patientSymptoms: patientSymptoms,
                lastDoctor: localStorage.getItem('id'),
            })
        }

        // Check if needed next appointment or not
        if (selectedScheduleOption == 'yes') {
            console.log(selectedBedId);
            const appointmentRef = collection(db, 'appointment');

            const selectedDate = new Date(selectedNextScheduleDate);
            const timestampAppDate = Timestamp.fromDate(selectedDate);


            const maxQueueRef = await getDocs(query(collection(db, 'appointment'), orderBy('queueNumber', 'desc'), limit(1)));

            let maxQueue = null;

            if (maxQueueRef.size > 0) {
                maxQueue = maxQueueRef.docs[0].data().queueNumber;
            }

            const newAppointment = {
                appointmentDate: timestampAppDate,
                appointmentName: "Follow Up / Next Appointment",
                appointmentResult: null,
                appointmentStatus: "queued",
                bedNumber: selectedBedId,
                doctorId: localStorage.getItem('id'),
                isDone: false,
                patientId: selectedPatientId,
                queueCategory: selectedQueueCategory,
                queueNumber: maxQueue + 1,
                roomId: selectedRoomId,
            }

            await addDoc(appointmentRef, newAppointment);
        }

        handleSnackbar();
        setAlertMessage("Appointment succesfully completed!");
        setDataChange(true);
        handleClosePopupAppointmentResult();

        // Insert App Result
        const appResRef = collection(db, 'appointmentresult');

        const newAppRes = {
            doctorDiagnosis: doctorDiagnosis,
            patientSymptoms: patientSymptoms,
            updatedAt: Timestamp.now(),
        };



        const newAppResID = await addDoc(appResRef, newAppRes);

        const appointmentRef = doc(db, 'appointment', selectedAppId);
        const appointmentSnapshot = await getDoc(appointmentRef);

        // Update Appointment Status
        if (appointmentSnapshot.exists()) {
            await updateDoc(appointmentRef, {
                appointmentResult: newAppResID.id,
                isDone: true,
                appointmentStatus: "completed",
            });

            handleSnackbar();
            setAlertMessage("Appointment succesfully completed!");
            setDataChange(true);
            handleClosePopupAppointmentResult();
        }
    }

    useEffect(() => {
        fetchAppointment();
        fetchRooms();
        fetchDoctor();
        fetchPatients();
        fetchBeds();
    }, []);

    useEffect(() => {
        if (dataChange) {
            fetchAppointment();
            setDataChange(false);
        }
    }, [dataChange]);

    const handleRemoveMedicine = (index) => {
        setSelectedMedicine((prevMedicine) => {
            const updatedMedicine = [...prevMedicine];
            updatedMedicine.splice(index, 1);
            return updatedMedicine;
        });
    };

    const handleTimeChange = (event) => {
        setSelectedTime(event.target.value);
    };

    const handleOpenConfirmationNextSchedule = () => {
        handleDateClickOnceAgain();
        setConfirmationNextSchedule(true);
    }

    const handleDateClickOnceAgain = () => {
        const selectedDate = selectedDate1;
        const [hours, minutes] = selectedTime.split(':');

        selectedDate.setHours(parseInt(hours, 10));
        selectedDate.setMinutes(parseInt(minutes, 10));
        selectedDate.setSeconds(0);

        setSelecteedNextScheduleDate(selectedDate);
        console.log("aman", selectedNextScheduleDate);
    }

    const handleDateClick = (dateClickInfo) => {
        const selectedDate = dateClickInfo.date;

        selectedDate1 = selectedDate;

        // Check if the selected date has events
        const hasEvents = appointmentList.some((appointment) =>
            appointment.data.appointmentDate.toDate().toDateString() === selectedDate.toDateString()
        );

        if (hasEvents) {
            handleOpenPopupReservedDate();
            return;
        }


        setSelecteedNextScheduleDate(selectedDate);
        console.log(selectedNextScheduleDate);

        handleOpenPopupScheduleConfirmation();
    };

    const updateAppointmentResults = async () => {

        const appointmentRef = doc(db, 'appointment', selectedAppId);
        const appointmentSnapshot = await getDoc(appointmentRef);

        const appResult = appointmentSnapshot.data().appointmentResult;
        const patientRef = appointmentSnapshot.data().patientId;

        const appResRef = doc(db, 'appointmentresult', appResult);

        // Update Appointment Status
        if (appointmentSnapshot.exists()) {
            await updateDoc(appResRef, {
                doctorDiagnosis: doctorDiagnosis,
                patientSymptoms: patientSymptoms,
                updatedAt: Timestamp.now(),
            });


            const patientRes = doc(db, 'patient', patientRef);

            await updateDoc(patientRes, {
                patientSymptoms: patientSymptoms,
            });
        }

        handleSnackbar();
        setAlertMessage("Appointment Result succesfully updated!");
        setDataChange(true);
        handleCloseEditPopupAppointmentResult();
    }

    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredPatient = appointmentList.filter((patient) =>
            patient.data.appointmentName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredPatient);
    };

    const filteredRows = selectedMedicine.filter((med) => med.quantity !== null && med.quantity !== "0");

    const filteredApp = searchQuery ? searchResults : appointmentList;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Appointment List</h1>
                            <h3>Already Sorted Based on Queue Number & Category</h3>

                            {isSpotlightVisible && (
                                <TextField
                                    label="Search Appointment Name"
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
                            {localStorage.getItem('role') == 'nurse' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        handleOpenCreateAppointment();
                                    }}
                                    style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                                >
                                    Add Appointment
                                </Button>
                            )}
                            {/* <TextField
                                label="Search Patients"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            /> */}

                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '50px', marginRight: '5px' }}>
                                <div style={{ overflowX: 'auto', width: '1550px ' }}>
                                    <DataGrid
                                        columns={[

                                            { field: 'appointmentName', headerName: 'Appointment Name', width: 230 },
                                            { field: 'doctorName', headerName: 'Doctor Name', width: 130 },
                                            { field: 'patientName', headerName: 'Patient Name', width: 140 },
                                            { field: 'roomNumber', headerName: 'Room Number', width: 130 },
                                            { field: 'bedNumber', headerName: 'Bed Number', width: 130 },
                                            { field: 'appointmentDate', headerName: 'Appointment Date', width: 200 },
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
                                            { field: 'queueNumber', headerName: 'Queue Number', width: 170 },
                                            { field: 'appointmentTime', headerName: 'Appointment Time', width: 190 },
                                            {
                                                field: 'appointmentStatus', headerName: 'Appointment Status', width: 210,
                                                renderCell: (params) => (
                                                    <div
                                                        style={{
                                                            backgroundColor: getBackgroundColor(params.row.appointmentStatus),
                                                            width: '170px',
                                                            height: '80%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            borderRadius: '25px',
                                                        }}
                                                    >
                                                        {params.row.appointmentStatus}
                                                    </div>
                                                ),
                                            },
                                            {
                                                field: 'appointmentResult',
                                                headerName: 'Appointment Results',
                                                width: 410,
                                                renderCell: (params) => params.row.appointmentResult(),
                                            },
                                            {
                                                field: 'action',
                                                headerName: 'Action',
                                                width: 900,
                                                renderCell: (params) => (
                                                    <div>
                                                        {localStorage.getItem('role') === 'nurse' ? (
                                                            <>
                                                                {params.row.appointmentStatus !== "completed" && (
                                                                    <Button variant="contained"
                                                                        style={{ marginRight: '59px' }}
                                                                        onClick={(e) => {
                                                                            handleOpenAppointmentStatus(params.row.id);
                                                                        }}>
                                                                        Update Appointment Status
                                                                    </Button>
                                                                )}
                                                                {params.row.appointmentStatus === "queued" && (
                                                                    <Button variant="contained"
                                                                        style={{ marginRight: '30px' }}
                                                                        onClick={(e) => {
                                                                            deleteAppointment(params.row.id);
                                                                        }}>
                                                                        Delete Appointment
                                                                    </Button>
                                                                )}
                                                                {params.row.appointmentStatus !== "completed" && (
                                                                    <Button variant='contained' style={{ marginLeft: '0px' }}
                                                                        onClick={(e) => {
                                                                            handleOpenUpdateAppointmentForm(params.row.id);
                                                                        }}>
                                                                        Update Appointment Detail
                                                                    </Button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {
                                                                    params.row.appointmentStatus === "in progress" && (
                                                                        <div>
                                                                            <Button
                                                                                variant='contained'
                                                                                style={{ marginLeft: '0px' }}
                                                                                onClick={(e) => {
                                                                                    completeAppointment(
                                                                                        params.row.id,
                                                                                        params.row.patientId,
                                                                                        params.row.queueCategory,
                                                                                        params.row.roomId,
                                                                                        params.row.bedId
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Complete Appointment
                                                                            </Button>
                                                                        </div>
                                                                    )
                                                                }
                                                            </>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                        ]}

                                        rows={filteredApp.sort((a, b) => {
                                            if (a.data.queueCategory === "urgent" && b.data.queueCategory !== "urgent") {
                                                return -1; // a comes before b if a is urgent and b is not urgent
                                            } else if (a.data.queueCategory !== "urgent" && b.data.queueCategory === "urgent") {
                                                return 1; // b comes before a if b is urgent and a is not urgent
                                            } else {
                                                return 0; // maintain the original order if both have the same queueCategory
                                            }
                                        }).map((appointment) => ({
                                            id: appointment.id,
                                            roomId: appointment.data.roomId,
                                            appointmentName: appointment.data.appointmentName,
                                            doctorName: appointment.data.doctor.userName,
                                            patientName: appointment.data.patient.patientName,
                                            patientId: appointment.data.patientId,
                                            roomNumber: appointment.data.room.roomNumber,
                                            bedNumber: appointment.data.bed ? appointment.data.bed.bedNumber : null,
                                            bedId: appointment.data.bedNumber,
                                            appointmentDate: appointment.data.appointmentDate.toDate().toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }),
                                            appointmentTime: appointment.data.appointmentDate.toDate().toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                second: 'numeric',
                                            }),
                                            appointmentStatus: appointment.data.appointmentStatus,
                                            queueCategory: appointment.data.queueCategory,
                                            appointmentResult: () => (
                                                <div>
                                                    {appointment.data.appointmentStatus == "completed" ? (
                                                        <div>
                                                            <Button variant="contained" onClick={() => handleOpenAppointmentResult(appointment.id)}>
                                                                View Result
                                                            </Button>
                                                            <Button style={{ marginLeft: '50px' }} variant="contained" onClick={() => handleOpenEditPopupAppointmentResult(appointment.id)}>
                                                                Edit Appointment Result
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span>No Result</span>
                                                    )}
                                                </div>
                                            ),
                                            queueNumber: appointment.data.queueNumber,
                                        }))}
                                        autoHeight
                                    />
                                </div>
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openAppointmentResult} onClose={handleCloseAppointmentResult} fullWidth maxWidth={false}>
                        <DialogTitle>Apppointment Results</DialogTitle>
                        <DialogContent>
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Appointment Name</th>
                                        <th>Patient Name</th>
                                        <th>Patient Symptomps</th>
                                        <th>Doctor Diagnosis</th>
                                        <th>Last Updated At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointmentResult.map((appRes) => {
                                        return (
                                            <tr key={appRes.id}>
                                                <td>{appRes.data.appointment.appointmentName}</td>
                                                <td>{appRes.data.patient.patientName}</td>
                                                <td>{appRes.data.patientSymptoms}</td>
                                                <td>{appRes.data.doctorDiagnosis}</td>
                                                <td>
                                                    <span>{`${appRes.data.doctor.userName} (${appRes.data.doctor.userRole}) on ${appRes.data.updatedAt.toDate().toLocaleTimeString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={createAppointment} onClose={handleCloseCreateAppointment} fullWidth>
                        <DialogTitle>Create New Appointment</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="reportName"
                                label="Appointment Name"
                                type="text"
                                id="reportName"
                                autoFocus
                                value={appointmentName}
                                onChange={(e) => setAppointmentName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Appointment Date"
                                    value={appointmentDate}
                                    onChange={(newValue) => setAppointmentDate(newValue)}
                                    sx={{ width: '100%', marginTop: '28px' }}
                                />
                            </LocalizationProvider>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Doctor:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentDoctor(e.target.value)}
                                fullWidth
                            >
                                {doctor.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.userName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Patient:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentPatient(e.target.value)}
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
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Bed:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentBed(e.target.value)}
                                fullWidth
                            >
                                {beds.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.bedNumber}
                                    </MenuItem>
                                ))}
                            </Select>
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
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={insertAppointment} fullWidth>
                                    Insert New Appointment
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openUpdateAppointmentForm} onClose={handleCloseUpdateAppointmentForm} fullWidth>
                        <DialogTitle>Update Current Appointment</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="reportName"
                                label="Appointment Name"
                                type="text"
                                id="reportName"
                                autoFocus
                                value={appointmentName}
                                onChange={(e) => setAppointmentName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Appointment Date"
                                    value={appointmentDate}
                                    onChange={(newValue) => setAppointmentDate(newValue)}
                                    sx={{ width: '100%', marginTop: '28px' }}
                                />
                            </LocalizationProvider>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Doctor:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentDoctor(e.target.value)}
                                fullWidth
                            >
                                {doctor.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.userName}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Patient:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentPatient(e.target.value)}
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
                            <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                Select Bed:
                            </Typography>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setAppointmentBed(e.target.value)}
                                fullWidth
                            >
                                {beds.map((app) => (
                                    <MenuItem key={app.id} value={app.id}>
                                        {app.data.bedNumber}
                                    </MenuItem>
                                ))}
                            </Select>
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
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={updateAppointmentDetail} fullWidth>
                                    Update Appointment Details
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openAppointmentStatus} onClose={handleCloseAppointmentStatus}>
                        <DialogTitle>Apppointment Results</DialogTitle>
                        <DialogContent>
                            <Select
                                defaultValue="default"
                                onChange={(e) => setSelectedAppointmentStatus(e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="in progress">In Progress</MenuItem>
                                <MenuItem value="skipped">Skipped</MenuItem>
                            </Select>
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={updateAppointmentStatus} fullWidth>
                                    Update Appointment Status
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openMedicineView} onClose={handleCloseMedicineView} maxWidth={false} fullWidth>
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
                                Next
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
                    <Dialog open={openNextAppointment} onClose={handleCloseNextAppointment} maxWidth={false} fullWidth>
                        <DialogTitle>Add Next Schedule</DialogTitle>
                        <DialogContent>
                            <div>
                                <Typography variant='h6' style={{ textAlign: 'left', marginTop: '20px' }}>
                                    Do you want scheduling next meeting?
                                </Typography>
                                <Select
                                    value={selectedScheduleOption}
                                    onChange={(e) => setSelectedScheduleOption(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">Select an option</MenuItem>
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </Select>
                                {selectedScheduleOption == "yes" && (
                                    <div>
                                        <h1>My Calendar</h1>
                                        <FullCalendar
                                            dateClick={handleDateClick}
                                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugion]}
                                            initialView={"dayGridMonth"}
                                            events={appointmentList.map((appointment) => ({
                                                title: appointment.data.appointmentName,
                                                start: appointment.data.appointmentDate.toDate(),
                                                allDay: false,
                                            }))}
                                            height={800}
                                            headerToolbar={{
                                                start: "today prev, next",
                                                center: "title",
                                                end: "dayGridMonth, timeGridWeek, timeGridDay",
                                            }}
                                            contentHeight="auto"
                                            aspectRatio={2}
                                        />
                                    </div>
                                )}
                                {selectedScheduleOption == "no" && (
                                    <div>
                                        <Button
                                            style={{ marginTop: '30px', float: 'right' }}
                                            variant='contained'
                                            onClick={handleOpenPopupAppointmentResult}>
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openPopupReservedDate} onClose={handleClosePopupReservedDate}>
                        <DialogTitle>Error</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ErrorOutlineTwoToneIcon style={{ fontSize: '2.5rem', marginRight: '10px' }} />
                                <h3>Selected Date is already reserved!</h3>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openPopupScheduleConfirmation} onClose={handleClosePopupScheduleConfirmation}>
                        <DialogTitle>Selected Date and Pick Time</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <h3>Pick Selected Time</h3>
                                <br></br>
                                <input type="time" value={selectedTime} onChange={handleTimeChange}
                                    style={{ width: '210px', height: '50px', backgroundColor: 'gainsboro', borderRadius: '15px', fontSize: '20px', fontFamily: 'arial', paddingLeft: '10px' }}
                                />
                                <Button
                                    variant='contained'
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                        marginTop: '25px'
                                    }}
                                    onClick={handleOpenConfirmationNextSchedule}
                                >
                                    Confirmation
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={confirmationNextSchedule} onClose={handleCloseConfirmationNextSchedule}>
                        <DialogTitle>Confirmation Date</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <h3>Make sure these next schedule are correct!</h3>
                                <HelpOutlineTwoToneIcon style={{ fontSize: '2.5rem', marginRight: '10px' }} />
                                <h3>{selectedNextScheduleDate.toString()}</h3>
                                <br></br>
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
                                <Button
                                    variant='contained'
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                    }}
                                    onClick={handleOpenPopupAppointmentResult}
                                >
                                    Set Next Appointment Schedule
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={popupAppointmentResult} onClose={handleClosePopupAppointmentResult}>
                        <DialogTitle>Appointment Result</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="presDes"
                                    label="Patients Symptoms"
                                    type="text"
                                    id="presDes"
                                    value={patientSymptoms}
                                    onChange={(e) => setPatientSymptoms(e.target.value)}
                                    onBlur={(e) => setPatientSymptoms(e.target.value.trim())}
                                    error={patientSymptoms.trim().length === 0}
                                    helperText={patientSymptoms.trim().length === 0 ? 'Symptoms must be filled!' : ''}
                                />
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="presDes"
                                    label="Doctor Diagnosis"
                                    type="text"
                                    id="presDes"
                                    value={doctorDiagnosis}
                                    onChange={(e) => setDoctorDiagnosis(e.target.value)}
                                    onBlur={(e) => setDoctorDiagnosis(e.target.value.trim())}
                                    error={doctorDiagnosis.trim().length === 0}
                                    helperText={doctorDiagnosis.trim().length === 0 ? 'Diagnosis must be filled!' : ''}
                                />
                                <Button
                                    variant='contained'
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                    }}
                                    onClick={finalCompleteAppointment}
                                >
                                    Set Appointment to Complete
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={popupEditAppointmentResult} onClose={handleCloseEditPopupAppointmentResult}>
                        <DialogTitle>Appointment Result</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="presDes"
                                    label="Patients Symptoms"
                                    type="text"
                                    id="presDes"
                                    value={patientSymptoms}
                                    onChange={(e) => setPatientSymptoms(e.target.value)}
                                    onBlur={(e) => setPatientSymptoms(e.target.value.trim())}
                                    error={patientSymptoms.trim().length === 0}
                                    helperText={patientSymptoms.trim().length === 0 ? 'Symptoms must be filled!' : ''}
                                />
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="presDes"
                                    label="Doctor Diagnosis"
                                    type="text"
                                    id="presDes"
                                    value={doctorDiagnosis}
                                    onChange={(e) => setDoctorDiagnosis(e.target.value)}
                                    onBlur={(e) => setDoctorDiagnosis(e.target.value.trim())}
                                    error={doctorDiagnosis.trim().length === 0}
                                    helperText={doctorDiagnosis.trim().length === 0 ? 'Diagnosis must be filled!' : ''}
                                />
                                <Button
                                    variant='contained'
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                    }}
                                    onClick={updateAppointmentResults}
                                >
                                    Update Appointment Results
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
            </Client >
        </HydrationProvider >

    );
}

export default viewAppointment;
