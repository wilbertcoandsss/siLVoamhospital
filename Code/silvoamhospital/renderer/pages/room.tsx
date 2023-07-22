import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, FieldPath, addDoc, arrayRemove, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import Sidebar from '../components/Sidebar';
import { Box, DialogActions, FormHelperText, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/material';
import { async } from '@firebase/util';
import { HydrationProvider, Client } from 'react-hydration-provider';
import { DataGrid } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material';
import { parse } from 'path';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import { RenderCellExpand } from '../components/RenderCellExpand';

// Function to extract the floor from the room number
const getFloorFromRoomNumber = (roomNumber) => {
    return roomNumber.charAt(1); // Assuming the floor is always at the second index
};

const getBackgroundColorForBill = (jobStatus) => {
    if (jobStatus === 'unpaid') {
        return 'red';
    } else if (jobStatus === 'paid') {
        return 'green';
    }

    return '';
}

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

let selectedRoomId = null;
let selectedBedId = null;
let selectedBedStatus = null;
let selectedPatientId = null;
let endsPatientId = null;
let roomFeeFinal = null;
let roomDuration = null;

function RoomList() {
    const [room, setRoom] = useState([]);
    const [dataChange, setDataChange] = useState(false);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedBed, setSelectedBed] = useState(null);

    const [selectedPatient, setSelectedPatient] = useState([]);

    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);


    const [openForm1, setOpenForm1] = useState(false);
    const [openForm2, setOpenForm2] = useState(false);
    const [openForm3, setOpenForm3] = useState(false);
    const [openForm4, setOpenForm4] = useState(false);
    const [openForm5, setOpenForm5] = useState(false);
    const [openMovePatientForm, setOpenMovePatientForm] = useState(false);
    const [openMoveBed, setOpenMoveBed] = useState(false);

    const [openSnackBar, setOpenSnackbar] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const [roomBuilding, setRoomBuilding] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [roomFloor, setRoomFloor] = useState("");
    const [roomPrice, setRoomPrice] = useState(0);
    const [roomType, setRoomType] = useState("");

    const [bedNumber, setBedNumber] = useState("");
    const [bedStatus, setBedStatus] = useState("");

    const [error, setError] = useState({ roomBuilding: "", roomType: "", roomFloor: "", roomNumber: "" });

    const [bedError, setBedError] = useState("");

    const [jobRoomList, setJoobRoomList] = useState([]);

    const [patients, setPatients] = useState([]);

    const [availableRooms, setAvailableRooms] = useState([]);

    const [availableRoomsToMove, setAvailableRoomsToMove] = useState([]);

    //ENds bed
    const [openBillDetailsForm, setOpenBillDetailsForm] = useState(false);
    const [patientBill, setPatientBill] = useState([]);
    const [showRoomFee, setShowRoomFee] = useState(false);

    const calculateRoomFee = async () => {

        const patientSnapshot = await getDoc(doc(db, 'patient', endsPatientId));
        const patientData = patientSnapshot.data();

        const q = query(collection(db, 'room'), where('bedCollection', 'array-contains', patientData.bedId));
        const querySnapshot = await getDocs(q);

        let roomData = null;

        for (const doc1 of querySnapshot.docs) {
            roomData = doc1.data();

        };
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const currentDate = new Date();
        const daysSinceAssigned = Math.floor(
            (currentDate.getTime() - patientData.assignedDate.toDate().getTime()) / millisecondsPerDay
        );

        const roomFee = daysSinceAssigned * roomData.roomPrice; // Assuming the room fee is 90 per day
        console.log(daysSinceAssigned, roomData.roomPrice);

        roomFeeFinal = roomFee;
    }

    const handleOpenBillDetailsForm = () => {
        getBills();
        calculateRoomFee();
        setOpenBillDetailsForm(true);
    }

    const handleCloseBillDetailsForm = async () => {
        setOpenBillDetailsForm(false);
    }

    const getBills = async () => {
        try {
            console.log("hah masuk ga", endsPatientId);
            const patientSnapshot = await getDoc(doc(db, 'patient', endsPatientId));
            const bills = [];

            const patientData = patientSnapshot.data();
            const patientBillDocRef = patientData.billCollection;
            const bedData = patientData.bedId;

            let patientBill = [];

            if (patientBillDocRef) {
                for (const billRef of patientBillDocRef) {
                    const billDocSnapshot = await getDoc(doc(db, 'bills', billRef));

                    if (billDocSnapshot.exists()) {
                        const bill = billDocSnapshot.data();
                        bill.id = billDocSnapshot.id;
                        patientBill.push(bill);
                    }
                }
            }

            let roomData = null;

            if (bedData) {
                const q = query(collection(db, 'room'), where('bedCollection', 'array-contains', bedData));
                const querySnapshot = await getDocs(q);

                for (const doc1 of querySnapshot.docs) {
                    roomData = doc1.data();
                }
            }

            const bill1 = {
                id: patientSnapshot.id,
                data: {
                    patient: patientData,
                    bill: patientBill,
                    room: roomData,
                },
            };

            bills.push(bill1);

            setPatientBill(bills);
            console.log("hah", patientBill);

        } catch (error) {
            console.error(error);
        }
    }

    const [filterStatus, setFilterStatus] = useState('all');

    // Filter the patientBill array based on the selected filterStatus
    const filteredPatientBill = patientBill.filter((bill) => {
        if (filterStatus === 'all') {
            return true; // Show all data
        } else {
            return bill.data.bill.some((billItem) => billItem.billStatus === filterStatus);
        }
    });



    const getCompleteJob = async (roomId: string) => {
        try {
            const q = query(collection(db, 'job'), where('isDone', '==', true), where('roomId', '==', roomId));
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
            setJoobRoomList(finishedJobs);
        } catch (error) {
            console.log(error);
        }
    }

    const getPatientData = async (bedId: string) => {
        const q = query(collection(db, 'patient'), where('bedId', '==', bedId));
        const querySnapshot = await getDocs(q);
        const patientBedData = [];
        let patientId = null;

        for (const doc1 of querySnapshot.docs) {
            const patientData = doc1.data();
            const doctorDocRef = patientData.handledBy;
            const doctorData = [];
            if (doctorDocRef && doctorDocRef.length > 0) {
                for (const doctorRef of doctorDocRef) {
                    const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorRef));
                    if (doctorDocSnapshot.exists()) {
                        const doctor = doctorDocSnapshot.data();
                        doctor.id = doctorDocSnapshot.id;
                        doctorData.push(doctor);
                    }
                }
            }

            const patient = {
                id: doc1.id,
                data: {
                    ...patientData,
                },
            };

            patient.data.doctor = doctorData; // Set the bed field as an array in the room object
            patientBedData.push(patient);
            endsPatientId = doc1.id;
        }
        setSelectedPatient(patientBedData);

    }

    const openDialog1 = () => {
        setOpenForm1(true);
    }

    const closeDialog1 = () => {
        setOpenForm1(false);
    }

    const openDialog2 = (roomId: string) => {
        setOpenForm2(true);
        selectedRoomId = roomId;
    }

    const closeDialog2 = () => {
        setOpenForm2(false);
    }

    const openDialog3 = (bedId: string, bedStatus: string, roomId: string) => {
        setOpenForm3(true);
        getPatientData(bedId);
        selectedBedId = bedId;
        selectedBedStatus = bedStatus;
        selectedRoomId = roomId;
        console.log("Bed, Status. Room", selectedBedId, selectedBedStatus, selectedRoomId);
    }

    const closeDialog3 = () => {
        setOpenForm3(false);
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }


    const openMovePatient = (roomId: string, patientId: string) => {
        selectedRoomId = roomId;
        selectedPatientId = patientId;
        fetchAvailableRooms();
        setOpenMovePatientForm(true);
    }

    const closeMovePatient = () => {
        setOpenMovePatientForm(false);
    }

    const openMoveBedForm = () => {
        fetchAvailableRoomsToMove(selectedRoomId);
        setOpenMoveBed(true);
    }

    const closeMoveBed = () => {
        setOpenMoveBed(false);
    }

    const movePatient = async (newBedId: string, patientId: string, roomId: string) => {
        const patientDocRef = doc(db, 'patient', patientId);
        const patientDocSnapshot = await getDoc(patientDocRef);
        let oldBedId = null;
        if (patientDocSnapshot.exists()) {
            const patientData = patientDocSnapshot.data();
            oldBedId = patientData.bedId;

            const oldBedDocRef = doc(db, 'bed', oldBedId);
            const oldBedDocSnapshot = await getDoc(oldBedDocRef);

            if (oldBedDocSnapshot.exists()) {
                await updateDoc(oldBedDocRef, {
                    bedStatus: 'unusable',
                });
            }
        }

        const newBedDocRef = doc(db, 'bed', newBedId);

        await updateDoc(newBedDocRef, {
            bedStatus: 'unusable',
        });

        try {
            const jobRef = collection(db, 'job');
            const currentTime = new Date();
            const elevenAM = new Date();
            elevenAM.setHours(11, 0, 0, 0);
            const sevenPM = new Date();
            sevenPM.setHours(19, 0, 0, 0);

            let jobDue;
            if (currentTime < elevenAM) {
                jobDue = elevenAM;
            } else {
                jobDue = sevenPM;
            }

            const newJob = {
                jobAssigned: serverTimestamp(),
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Making Bed",
                jobStatus: "unfinished",
                patientId: patientId,
                roomId: roomId,
                staffRole: "cleaningservice",
                bedId: oldBedId,
                isDone: false,
                jobType: 'auto-assign',
            };

            await addDoc(jobRef, newJob);
        } catch (error) {
            console.log(error);
        }

        try {
            const jobRef = collection(db, 'job');
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
                jobAssigned: serverTimestamp(),
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Move Patient Bed",
                jobStatus: "unfinished",
                patientId: patientId,
                roomId: roomId,
                staffRole: "nurse",
                bedId: newBedId,
                isDone: false,
                jobType: 'auto-assign',
            };


            await addDoc(jobRef, newJob);
        } catch (error) {
            console.log(error);
        }

        await updateDoc(patientDocRef, {
            bedId: newBedId,
        });

        const notifRef = collection(db, 'notification');

        await addDoc(notifRef, {
            userRole: "cleaningservice",
            content: "Making Bed",
            notifDate: Timestamp.now(),
        })

        await addDoc(notifRef, {
            userRole: "nurse",
            content: "Move Patient Bed",
            notifDate: Timestamp.now(),
        })

        handleSnackbar();
        setAlertMessage("Patient succesfully moved!");
        closeMovePatient();
        closeDialog3();
        setDataChange(true);
    }

    // Filtered room array based on selected building and floor
    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();

        const filteredRoom = room.filter((room) => {
            if ((selectedBuilding && !room.data.roomNumber.includes(selectedBuilding)) ||
                (selectedFloor && getFloorFromRoomNumber(room.data.roomNumber) !== selectedFloor)) {
                return false;
            }
            return room.data.roomNumber.toLowerCase().includes(formattedQuery);
        });

        setSearchResults(filteredRoom);
    };

    const openDialog4 = (roomId: string) => {
        getCompleteJob(roomId);
        setOpenForm4(true);
    }

    const closeDialog4 = () => {
        setOpenForm4(false);
    }

    const openDialog5 = () => {
        getPatient();
        setOpenForm5(true);
    }

    const closeDialog5 = () => {
        setOpenForm5(false);
    }

    const getPatient = async () => {
        try {
            const q = query(collection(db, 'patient'), where('isAssigned', '==', false));
            const querySnapshot = await getDocs(q);
            const patients = [];

            for (const doc1 of querySnapshot.docs) {
                const patientData = doc1.data();
                const doctorDocRef = patientData.handledBy;
                const doctorData = [];
                if (doctorDocRef && doctorDocRef.length > 0) {
                    for (const doctorRef of doctorDocRef) {
                        const doctorDocSnapshot = await getDoc(doc(db, 'registeredusers', doctorRef));
                        if (doctorDocSnapshot.exists()) {
                            const doctor = doctorDocSnapshot.data();
                            doctor.id = doctorDocSnapshot.id;
                            doctorData.push(doctor);
                        }
                    }
                }

                const patient = {
                    id: doc1.id,
                    data: {
                        ...patientData,
                    },
                };

                patient.data.doctor = doctorData; // Set the bed field as an array in the room object
                patients.push(patient);
            }

            setPatients(patients);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    const fetchRooms = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'room'));
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
                            bed.id = bedDocSnapshot.id;
                            bedData.push(bed);
                        }
                    }
                }

                const room = {
                    id: doc1.id,
                    data: {
                        ...roomData,
                    },
                };

                room.data.bed = bedData; // Set the bed field as an array in the room object
                rooms.push(room);
            }

            setRoom(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchAvailableRooms = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'room'));
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
                                bed.id = bedDocSnapshot.id;
                                bedData.push(bed);
                            }
                        }
                    }
                }

                const room = {
                    id: doc1.id,
                    data: {
                        ...roomData,
                    },
                };

                room.data.bed = bedData; // Set the bed field as an array in the room object
                rooms.push(room);
            }

            setAvailableRooms(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }
    const fetchAvailableRoomsToMove = async (excludedBedId: string) => {
        try {
            const querySnapshot = await getDocs(collection(db, 'room'));
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
                            bed.id = bedDocSnapshot.id;
                            bedData.push(bed);
                        }
                    }
                }

                if ((bedsDocRef.length < roomData.roomCapacity || bedsDocRef.length == 0) && doc1.id != excludedBedId) {
                    // console.log("Avail bed", bedsDocRef.length, roomData.roomCapacity, roomData.roomNumber);
                    const room = {
                        id: doc1.id,
                        data: {
                            ...roomData,
                        },
                    };

                    room.data.bed = bedData;
                    rooms.push(room);
                }
            }

            setAvailableRoomsToMove(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const addNewRoom = async () => {
        let isValid = true;
        let errors = { roomBuilding: "", roomType: "", roomFloor: "", roomNumber: "" };
        let roomBedCapacity = null;
        // console.log(roomBuilding.charAt(0));
        if (roomBuilding == "default") {
            isValid = false;
            errors.roomBuilding = "Room Building must be chosen!";
        }

        if (roomType == "default") {
            isValid = false;
            errors.roomType = "Room Type must be chosen!";
        }

        if (roomType == "single" || roomType == "vip" || roomType == "royale") {
            roomBedCapacity = 1;
        }
        if (roomType == "sharing") {
            roomBedCapacity = 6;
        }
        if (roomType == "emergency") {
            roomBedCapacity = 12;
        }
        if (roomFloor == "default") {
            isValid = false;
            errors.roomFloor = "Room Floor must be chosen!";
        }

        const regex = /^\d{3}$/; // Regular expression to match exactly 3 digits

        if (!regex.test(roomNumber)) {
            isValid = false;
            errors.roomNumber = "Room Number must be consist of 3 numbers!";
        }

        setError(errors);

        if (roomType == "single") {
            setRoomPrice(980000);
        }
        if (roomType == "sharing") {
            setRoomPrice(450000);
        }
        if (roomType == "vip") {
            setRoomPrice(1550000);
        }
        if (roomType == "royale") {
            setRoomPrice(2210000);
        }


        if (isValid) {
            const constructedRoomNumber = roomBuilding.charAt(0) + roomFloor.charAt(0) + roomNumber;
            console.log(constructedRoomNumber);
            const roomRef = collection(db, 'room');
            const newRoom = {
                bedCollection: null,
                roomBuilding: roomBuilding,
                roomCapacity: roomBedCapacity,
                roomFloor: roomFloor,
                roomNumber: constructedRoomNumber,
                roomPrice: roomPrice,
                roomType: roomType
            };

            try {
                await addDoc(roomRef, newRoom);
                handleSnackbar();
                setAlertMessage("Room succesfully added!");
                closeDialog1();
                setDataChange(true);
                // Optionally, you can perform any additional logic or show a success message.
            } catch (error) {
                console.error('Error registering patient:', error);
                // Optionally, you can handle the error and show an error message to the user.
            }

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "doctor",
                content: "Approve Certificate Request",
                notifDate: Timestamp.now(),
            })
        }
    }

    const addBed = async () => {
        const bedRef = collection(db, 'bed');
        let bedStatus = "unusable";
        const newBed = {
            bedNumber: bedNumber,
            bedStatus: bedStatus,
        };

        try {
            const newBedRef = await addDoc(bedRef, newBed);

            const jobRef = collection(db, 'job');
            const currentTimestamp = serverTimestamp();

            // Determine the value for jobDue based on the current time
            const currentTime = new Date();
            const elevenAM = new Date();
            elevenAM.setHours(11, 0, 0, 0);
            const sevenPM = new Date();
            sevenPM.setHours(19, 0, 0, 0);

            let jobDue;
            if (currentTime < elevenAM) {
                jobDue = elevenAM;
            } else {
                jobDue = sevenPM;
            }

            const newJob = {
                jobAssigned: currentTimestamp,
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Add Bed",
                jobStatus: "unfinished",
                patientId: null,
                roomId: selectedRoomId,
                staffRole: "cleaningservice",
                bedId: newBedRef.id,
                isDone: false,
                jobType: 'auto-assign',
            };

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "cleaningservice",
                content: "Move Bed",
                notifDate: Timestamp.now(),
            })

            try {
                await addDoc(jobRef, newJob);
            } catch (error) {
                console.log(error);
            }

            const roomDocRef = doc(db, 'room', selectedRoomId);
            const roomDocSnapshot = await getDoc(roomDocRef);
            const roomData = roomDocSnapshot.data();

            const bedCollection = roomData.bedCollection || [];

            bedCollection.push(newBedRef.id);

            await updateDoc(roomDocRef, { bedCollection });

            handleSnackbar();
            setAlertMessage("Bed inserted succesfully!");
            closeDialog2();
            setDataChange(true);
        }
        catch (error) {
            console.log(error);
        }
    }

    const endBed = async () => {
        // Insert Bills
        const billsRef = collection(db, 'bills');

        const newBill = {
            billDate: serverTimestamp(),
            billName: "Room Fee",
            billStatus: "unpaid",
            billPrice: roomFeeFinal,
            roomId: selectedRoomId,
            durationDay: roomDuration,
        };

        const newBillRef = await addDoc(billsRef, newBill);

        // Add Bills into patient
        const patientRef = doc(db, 'patient', endsPatientId);
        const patientSnapshot = await getDoc(patientRef);

        if (patientSnapshot.exists()) {
            const patientData = patientSnapshot.data();
            const billCollectionArray = patientData.billCollection || [];

            if (billCollectionArray.length === 0) {
                await updateDoc(patientRef, {
                    billCollection: [newBillRef.id],
                    isDone: true,
                    bedId: null,
                    isAssigned: false,
                });
            } else {
                const updatedBillCollectionArray = [...billCollectionArray, newBillRef.id];
                await updateDoc(patientRef, {
                    billCollection: updatedBillCollectionArray,
                    isDone: true,
                    bedId: null,
                    isAssigned: false,
                });
            }
        }

        // Remove Bed
        const docRef = doc(db, 'bed', selectedBedId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            const jobRef = collection(db, 'job');
            const currentTimestamp = serverTimestamp();

            // Determine the value for jobDue based on the current time
            const currentTime = new Date();
            const elevenAM = new Date();
            elevenAM.setHours(11, 0, 0, 0);
            const sevenPM = new Date();
            sevenPM.setHours(19, 0, 0, 0);

            let jobDue;
            if (currentTime < elevenAM) {
                jobDue = elevenAM;
            } else {
                jobDue = sevenPM;
            }

            const newJob = {
                jobAssigned: currentTimestamp,
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Making Bed",
                jobStatus: "unfinished",
                patientId: null,
                roomId: selectedRoomId,
                staffRole: "cleaningservice",
                bedId: selectedBedId,
                isDone: false,
                jobType: 'auto-assign',
            };

            try {
                await addDoc(jobRef, newJob);
            } catch (error) {
                console.log(error);
            }

            await updateDoc(doc(db, 'bed', selectedBedId), {
                bedStatus: "unusable"
            });

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "cleaningservice",
                content: "Making Bed",
                notifDate: Timestamp.now(),
            })

            setAlertMessage("Patient succesfully discharged!");
            handleSnackbar();
            setDataChange(true);
            handleCloseBillDetailsForm();
            closeDialog3();
        }
    }

    const removeBed = async () => {
        try {
            const docRef = doc(db, 'bed', selectedBedId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const jobRef = collection(db, 'job');
                const currentTimestamp = serverTimestamp();

                // Determine the value for jobDue based on the current time
                const currentTime = new Date();
                const elevenAM = new Date();
                elevenAM.setHours(11, 0, 0, 0);
                const sevenPM = new Date();
                sevenPM.setHours(19, 0, 0, 0);

                let jobDue;
                if (currentTime < elevenAM) {
                    jobDue = elevenAM;
                } else {
                    jobDue = sevenPM;
                }

                const newJob = {
                    jobAssigned: currentTimestamp,
                    jobCategory: "Patient Management",
                    jobDone: null,
                    jobDue: jobDue,
                    jobName: "Remove Bed",
                    jobStatus: "unfinished",
                    patientId: null,
                    roomId: selectedRoomId,
                    staffRole: "cleaningservice",
                    bedId: selectedBedId,
                    isDone: false,
                    jobType: 'auto-assign',
                };

                try {
                    await addDoc(jobRef, newJob);
                } catch (error) {
                    console.log(error);
                }

                await updateDoc(doc(db, 'bed', selectedBedId), {
                    bedStatus: "unusable"
                });

                const notifRef = collection(db, 'notification');

                await addDoc(notifRef, {
                    userRole: "cleaningservice",
                    content: "Remove Bed",
                    notifDate: Timestamp.now(),
                })

                setAlertMessage("Bed succesfully removed!");
                handleSnackbar();
                setDataChange(true);
                closeDialog3();
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const moveBed = async (newRoomId: string) => {
        try {
            // Get Old Bed Number
            const bedRef = doc(db, 'bed', selectedBedId);
            const bedSnapshot = await getDoc(bedRef);
            const bedNumber = bedSnapshot.data().bedNumber;
            console.log(bedNumber);
            // Get Old Room
            const oldRoomRef = doc(db, 'room', selectedRoomId);
            const oldRoomSnapshot = await getDoc(oldRoomRef);

            if (oldRoomSnapshot.exists()) {
                const oldRoomData = oldRoomSnapshot.data();
                const oldBedCollection = oldRoomData.bedCollection;

                const updatedOldBedCollection = oldBedCollection.filter(bedRef => bedRef !== selectedBedId);
                await updateDoc(oldRoomRef, { bedCollection: updatedOldBedCollection });

                // Assign bed to new room
                const newRoomRef = doc(db, 'room', newRoomId);
                const newRoomSnapshot = await getDoc(newRoomRef);

                if (newRoomSnapshot.exists()) {
                    const newRoomData = newRoomSnapshot.data();
                    const newBedCollection = newRoomData.bedCollection || [];

                    newBedCollection.push(selectedBedId);

                    await updateDoc(newRoomRef, { bedCollection: newBedCollection });

                    await updateDoc(doc(db, 'bed', selectedBedId), {
                        bedStatus: 'unusable',
                        bedNumber: bedNumber,
                    });
                    console.log("Yg dibawah:", bedNumber);
                }
            }

            const jobRef = collection(db, 'job');
            const currentTimestamp = serverTimestamp();

            // Determine the value for jobDue based on the current time
            const currentTime = new Date();
            const elevenAM = new Date();
            elevenAM.setHours(11, 0, 0, 0);
            const sevenPM = new Date();
            sevenPM.setHours(19, 0, 0, 0);

            let jobDue;
            if (currentTime < elevenAM) {
                jobDue = elevenAM;
            } else {
                jobDue = sevenPM;
            }

            const newJob = {
                jobAssigned: currentTimestamp,
                jobCategory: "Patient Management",
                jobDone: null,
                jobDue: jobDue,
                jobName: "Move Available Bed",
                jobStatus: "unfinished",
                patientId: null,
                roomId: selectedRoomId,
                staffRole: "cleaningservice",
                bedId: selectedBedId,
                isDone: false,
                jobType: 'auto-assign',
            };

            try {
                await addDoc(jobRef, newJob);
                const notifRef = collection(db, 'notification');

                await addDoc(notifRef, {
                    userRole: "cleaningservice",
                    content: "Move Bed",
                    notifDate: Timestamp.now(),
                })
                setAlertMessage("Bed succesfully moved!");
                handleSnackbar();
                setDataChange(true);
                closeMoveBed();
                closeDialog3();

            } catch (error) {
                console.log(error);
            }
        } catch (error) {
            console.error('Error moving bed:', error);
        }
    }

    const assignPatient = async (patientId: string) => {
        await updateDoc(doc(db, 'patient', patientId), {
            bedId: selectedBedId,
            isAssigned: true,
            assignedDate: Timestamp.now(),
        });

        await updateDoc(doc(db, 'bed', selectedBedId), {
            bedStatus: "unusable"
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
                patientId: patientId,
                roomId: selectedRoomId,
                staffRole: "nurse",
                bedId: selectedBedId,
                isDone: false,
                jobType: 'auto-assign',
            };

            const notifRef = collection(db, 'notification');

            await addDoc(notifRef, {
                userRole: "nurse",
                content: "Assign Patient",
                notifDate: Timestamp.now(),
            })

            try {
                await addDoc(jobRef, newJob);
                handleSnackbar();
                setAlertMessage("Patient succesfully assigned!");
                closeDialog5();
                closeDialog3();
                setDataChange(true);
            } catch (error) {
                console.log(error);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const resetForm = () => {
        setRoomBuilding(null);
        setRoomFloor(null);
        setRoomNumber(null);
        setRoomPrice(null);
        setRoomType(null);
        setBedNumber(null);
    }

    useEffect(() => {
        fetchRooms();
        getPatient();
    }, []);

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            fetchRooms();
            resetForm();
            setDataChange(false);
            selectedRoomId = null;
        }
    }, [dataChange]);

    const displayedRooms = searchQuery
        ? searchResults
        : room.filter((room) => {
            if ((selectedBuilding && !room.data.roomNumber.includes(selectedBuilding)) ||
                (selectedFloor && getFloorFromRoomNumber(room.data.roomNumber) !== selectedFloor)) {
                return false;
            }
            return true;
        });

    const totalBillPrice = filteredPatientBill.reduce((total, bill) => {
        return total + bill.data.bill.reduce((subtotal, item) => {
            return subtotal + item.billPrice;
        }, 0);
    }, 0);

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px', width: '100%' }}>
                            <h1>Room Management</h1>
                            {localStorage.getItem('role') == 'admin' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        openDialog1();
                                    }}
                                    style={{ marginLeft: '5px', float: 'left', width: '150px    ' }}
                                >
                                    Add Room
                                </Button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'start', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                                    <div style={{ width: '20px', height: '20px', backgroundColor: 'green', marginRight: '5px' }}></div>
                                    <p>Available</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                                    <div style={{ width: '20px', height: '20px', backgroundColor: '#0055de', marginRight: '5px' }}></div>
                                    <p>Unusable</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '20px', height: '20px', backgroundColor: '#d9740f', marginRight: '5px' }}></div>
                                    <p>Used</p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'start'
                            }}>
                                <div style={{ marginBottom: '20px', marginRight: '50px' }}>
                                    <label htmlFor="building-select">Building:</label>
                                    <select
                                        id="building-select"
                                        value={selectedBuilding}
                                        onChange={(e) => setSelectedBuilding(e.target.value)}
                                        style={{ marginLeft: '10px', width: '180px', backgroundColor: 'gainsboro', borderRadius: '10px', padding: '10px', fontSize: '15px' }}
                                    >
                                        <option value="">All</option>
                                        <option value="A">Building A</option>
                                        <option value="B">Building B</option>
                                        <option value="C">Building C</option>
                                        {/* Add more building options */}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px', marginRight: '50px' }}>
                                    <label htmlFor="floor-select">Floor:</label>
                                    <select
                                        id="floor-select"
                                        value={selectedFloor}
                                        onChange={(e) => setSelectedFloor(e.target.value)}
                                        style={{ marginLeft: '10px', width: '180px', backgroundColor: 'gainsboro', borderRadius: '10px', padding: '10px', fontSize: '15px' }}
                                    >
                                        <option value="">All</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        {/* Add more floor options */}
                                    </select>
                                </div>
                                <TextField
                                    label="Search Room"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{ width: '250px', borderRadius: '10px' }}
                                />
                            </div>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'stretch' }}>
                                    {displayedRooms
                                        .sort((a, b) => a.data.roomNumber.localeCompare(b.data.roomNumber))
                                        .map((room) => {
                                            const bedCount = room.data.bed.length;
                                            const exceedCapacity = bedCount >= room.data.roomCapacity;
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
                                                        color: 'white',
                                                    }}
                                                >
                                                    <h3>{room.data.roomNumber}</h3>
                                                    <h3>{room.data.roomType}</h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                                        {room.data.bed.map((bed) => (
                                                            <Button
                                                                onClick={() => openDialog3(bed.id, bed.bedStatus, room.id)}
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
                                                        ))}
                                                    </div>
                                                    <Button
                                                        style={{
                                                            color: 'black',
                                                            backgroundColor: 'greenyellow',
                                                            marginBottom: '30px',
                                                            marginTop: '15px'
                                                        }}
                                                        onClick={() => {
                                                            openDialog4(room.id);
                                                        }}
                                                    >
                                                        See Rooms
                                                    </Button>
                                                    {localStorage.getItem('role') == 'admin' && (
                                                        <Button
                                                            style={{
                                                                color: 'black',
                                                                backgroundColor: 'cyan',
                                                                display: exceedCapacity ? 'none' : 'block',
                                                                marginBottom: '30px'
                                                            }}
                                                            onClick={() => {
                                                                openDialog2(room.id);
                                                            }}
                                                        >
                                                            Add Bed
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openForm1} onClose={closeDialog1}>
                        <DialogTitle>Add New Room</DialogTitle>
                        <DialogContent>
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Room Building:
                            </Typography>
                            <Select defaultValue="default" onChange={(e) => setRoomBuilding(e.target.value)} style={{ width: '100%' }}>
                                <MenuItem value="default">Select Building</MenuItem>
                                <MenuItem value="A">A</MenuItem>
                                <MenuItem value="B">B</MenuItem>
                                <MenuItem value="C">C</MenuItem>
                            </Select>
                            <FormHelperText error={!!error.roomBuilding}>{error.roomBuilding}</FormHelperText>
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Room Type:
                            </Typography>
                            <Select defaultValue="default" onChange={(e) => setRoomType(e.target.value)} style={{ width: '100%' }}>
                                <MenuItem value="default">Select Room Type</MenuItem>
                                <MenuItem value="single">Single</MenuItem>
                                <MenuItem value="sharing">Sharing</MenuItem>
                                <MenuItem value="vip">VIP</MenuItem>
                                <MenuItem value="royale">Royale</MenuItem>
                                <MenuItem value="emergency">Emergency</MenuItem>
                            </Select>
                            <FormHelperText error={!!error.roomType}>{error.roomType}</FormHelperText>
                            <Typography variant='h6' style={{ textAlign: 'center' }}>
                                Select Room Floor:
                            </Typography>
                            <Select defaultValue="default" onChange={(e) => setRoomFloor(e.target.value)} style={{ width: '100%' }}>
                                <MenuItem value="default">Select Room Floor</MenuItem>
                                <MenuItem value="1">1</MenuItem>
                                <MenuItem value="2">2</MenuItem>
                                <MenuItem value="3">3</MenuItem>
                                <MenuItem value="4">4</MenuItem>
                                <MenuItem value="5">5</MenuItem>
                            </Select>
                            <FormHelperText error={!!error.roomFloor}>{error.roomFloor}</FormHelperText>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="roomNumber"
                                label="Room Number"
                                type="text"
                                id="roomNumber"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                helperText={error.roomNumber}
                                error={error.roomNumber.length > 0}
                            />
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={addNewRoom} fullWidth>
                                    Register New Room
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm2} onClose={closeDialog2}>
                        <DialogTitle>Add New Bed</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="bedNumber"
                                label="Bed Number"
                                type="number"
                                id="bedNumber"
                                value={bedNumber}
                                onChange={(e) => setBedNumber(e.target.value)}
                                helperText={bedError}
                            />
                            <FormHelperText error={!!bedError}>{bedError}</FormHelperText>
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={addBed} fullWidth>
                                    Register New Bed
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm3} onClose={closeDialog3} maxWidth={false} fullWidth>
                        <DialogTitle>Bed Details</DialogTitle>
                        <DialogContent>
                            {selectedBedStatus == 'used' && (
                                <div>
                                    <h2 style={{ textAlign: 'center' }}>Patient Details</h2>
                                    <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                        <thead>
                                            <tr>
                                                <th>Patient Name</th>
                                                <th>Patient Gender</th>
                                                <th>Patient DOB</th>
                                                <th>Patient Age</th>
                                                <th>Patient Symptoms</th>
                                                <th>Handled By</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPatient.map((patient) => {
                                                const hasDoctor = patient.data.doctor.length > 0;
                                                const birthDate: Date = patient.data.patientDob.toDate();
                                                const currentDate: Date = new Date();
                                                const ageInMilliseconds: number = currentDate.getTime() - birthDate.getTime();
                                                const ageInYears: number = Math.floor(ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000));

                                                return (
                                                    <tr key={patient.id}>
                                                        <td>{patient.data.patientName}</td>
                                                        <td>{patient.data.patientGender}</td>
                                                        <td>{patient.data.patientDob.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                                                        <td>{ageInYears}</td>
                                                        <td>{patient.data.patientSymptoms ? patient.data.patientSymptoms : "Not Diagnosed"}</td>
                                                        {hasDoctor ? (
                                                            patient.data.doctor.map((doctor, index) => (
                                                                <td
                                                                    key={doctor.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                    }}
                                                                    rowSpan={index === 0 ? patient.data.doctor.length : 0}
                                                                >
                                                                    {doctor.userName} ({doctor.userRole})
                                                                </td>
                                                            ))
                                                        ) : (
                                                            <td style={{ display: 'flex', flexDirection: 'column' }} rowSpan={1}>
                                                                Not Handled
                                                            </td>
                                                        )}
                                                        <td>
                                                            {localStorage.getItem('role') == 'nurse' && (
                                                                <Button variant="contained" style={{ backgroundColor: 'green', width: '300px' }}
                                                                    onClick={() => {
                                                                        openMovePatient(patient.data.bedId, patient.id);
                                                                    }}>
                                                                    Move Patients
                                                                </Button>
                                                            )}
                                                            {localStorage.getItem('role') == 'admin' && (
                                                                <Button variant="contained" style={{ backgroundColor: 'green', width: '300px' }}
                                                                    onClick={() => {
                                                                        openMovePatient(patient.data.bedId, patient.id);
                                                                    }}>
                                                                    Move Patients
                                                                </Button>)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {localStorage.getItem('role') == 'admin' && (
                                        <Box marginTop={2} style={{ display: 'flex', justifyContent: 'center' }}>
                                            <Button
                                                variant="contained"
                                                onClick={() => {
                                                    handleOpenBillDetailsForm();
                                                }}
                                                style={{ backgroundColor: 'red', width: '300px' }}
                                            >
                                                Ends Bed Usage
                                            </Button>
                                        </Box>
                                    )}
                                </div>
                            )}
                            {selectedBedStatus == 'available' && (
                                <div>
                                    {(localStorage.getItem('role') == 'nurse' || localStorage.getItem('role') == 'admin') && (
                                        <div>
                                            <Box marginTop={2} style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button variant="contained" style={{ backgroundColor: 'green', width: '200px' }}
                                                    onClick={() => {
                                                        openDialog5();
                                                    }}
                                                >
                                                    Assign Patient
                                                </Button>
                                            </Box>
                                        </div>
                                    )}
                                    {localStorage.getItem('role') == 'admin' && (
                                        <div>
                                            <Box marginTop={2} style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button variant="contained" style={{ backgroundColor: 'darkcyan', width: '200px' }}
                                                    onClick={() => {
                                                        openMoveBedForm();
                                                    }}>
                                                    Move Bed
                                                </Button>
                                            </Box>
                                            <Box marginTop={2} style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button variant="contained" style={{ backgroundColor: 'red', width: '200px' }} onClick={removeBed}>
                                                    Remove Bed
                                                </Button>
                                            </Box>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedBedStatus == 'unusable' && (
                                <div style={{ textAlign: 'center' }}>
                                    <h2>This bed is unusable at the moment.</h2>
                                    <h2>Please wait.</h2>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm4} onClose={closeDialog4} maxWidth={false} fullWidth>
                        <DialogTitle>Room Job Details</DialogTitle>
                        <DialogContent>
                            <h1>Completed Job</h1>
                            <Box component="main" sx={{ flexGrow: 1, width: '1765px' }}>
                                <DataGrid
                                    style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    columns={[
                                        { field: 'jobName', headerName: 'Job Name', width: 200, renderCell: RenderCellExpand },
                                        { field: 'jobCategory', headerName: 'Job Category', width: 200 },
                                        { field: 'jobAssigned', headerName: 'Job Assigned', width: 220, renderCell: RenderCellExpand },
                                        { field: 'jobDue', headerName: 'Job Due', width: 230, renderCell: RenderCellExpand },
                                        {
                                            field: 'jobStatus',
                                            headerName: 'Job Status',
                                            width: 190,
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
                                        { field: 'roomNumber', headerName: 'Room Number', width: 150, renderCell: RenderCellExpand },
                                        { field: 'jobDone', headerName: 'Job Done', width: 220, renderCell: RenderCellExpand },
                                        { field: 'doneBy', headerName: 'Done By', width: 190, renderCell: RenderCellExpand },
                                    ]}
                                    rows={jobRoomList.map((job) => ({
                                        id: job.id,
                                        jobName: job.data.jobName,
                                        jobCategory: job.data.jobCategory,
                                        jobAssigned: job.data.jobAssigned ? job.data.jobAssigned.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }) : "no data",
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
                                        roomNumber: job.data.room.roomNumber,
                                        jobDone: job.data.jobDone ? job.data.jobDone.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }) : "No Done",
                                        doneBy: job.data.staff.userName,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm5} onClose={closeDialog5} maxWidth={false} fullWidth>
                        <DialogTitle>Assign Patients</DialogTitle>
                        <DialogContent>
                            <div>
                                <h2 style={{ textAlign: 'center' }}>Patient Details</h2>
                                <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                    <thead>
                                        <tr>
                                            <th>Patient Name</th>
                                            <th>Patient Gender</th>
                                            <th>Patient DOB</th>
                                            <th>Patient Age</th>
                                            <th>Patient Symptoms</th>
                                            <th>Handled By</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map((patient) => {
                                            const hasDoctor = patient.data.doctor.length > 0;
                                            const birthDate: Date = patient.data.patientDob.toDate();
                                            const currentDate: Date = new Date();
                                            const ageInMilliseconds: number = currentDate.getTime() - birthDate.getTime();
                                            const ageInYears: number = Math.floor(ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000));

                                            return (
                                                <tr key={patient.id}>
                                                    <td>{patient.data.patientName}</td>
                                                    <td>{patient.data.patientGender}</td>
                                                    <td>{patient.data.patientDob.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                                                    <td>{ageInYears}</td>
                                                    <td>{patient.data.patientSymptoms ? patient.data.patientSymptoms : "Not Diagnosed"}</td>
                                                    {hasDoctor ? (
                                                        patient.data.doctor.map((doctor, index) => (
                                                            <td
                                                                key={doctor.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                }}
                                                                rowSpan={index === 0 ? patient.data.doctor.length : 0}
                                                            >
                                                                {doctor.userName} ({doctor.userRole})
                                                            </td>
                                                        ))
                                                    ) : (
                                                        <td style={{ display: 'flex', flexDirection: 'column' }} rowSpan={1}>
                                                            Not Handled
                                                        </td>
                                                    )}
                                                    <td>
                                                        <Button variant="contained" style={{ backgroundColor: 'green', width: '300px' }}
                                                            onClick={() => {
                                                                assignPatient(patient.id);
                                                            }}>
                                                            Assign Patients
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openMovePatientForm} onClose={closeMovePatient} maxWidth={false} fullWidth>
                        <DialogTitle>Move Patients</DialogTitle>
                        <DialogContent>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <h2>Select rooms or bed that you want to moved!</h2>
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'stretch' }}>
                                    {availableRooms
                                        .sort((a, b) => a.data.roomNumber.localeCompare(b.data.roomNumber))
                                        .map((room) => {
                                            const bedCount = room.data.bed.length;
                                            const exceedCapacity = bedCount >= room.data.roomCapacity;
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
                                                    }}
                                                >
                                                    <h3>{room.data.roomNumber}</h3>
                                                    <h3>{room.data.roomType}</h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                                        {room.data.bed.map((bed) => (
                                                            <Button
                                                                onClick={() =>
                                                                    movePatient(bed.id, selectedPatientId, room.id)}
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
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openMoveBed} onClose={closeMoveBed} maxWidth={false} fullWidth>
                        <DialogTitle>Move Bed</DialogTitle>
                        <DialogContent>
                            <Box component="main" sx={{ flexGrow: 1 }}>
                                <h2>Choose rooms!</h2>
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'stretch' }}>
                                    {availableRoomsToMove
                                        .sort((a, b) => a.data.roomNumber.localeCompare(b.data.roomNumber))
                                        .map((room) => {
                                            return (
                                                <Button
                                                    onClick={() =>
                                                        moveBed(room.id)
                                                    }
                                                >
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
                                                    </div>
                                                </Button>
                                            );
                                        })}
                                </div>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openBillDetailsForm} onClose={handleCloseBillDetailsForm} fullWidth maxWidth={false}>
                        <DialogTitle>Bill Detail</DialogTitle>
                        <DialogContent>
                            <select
                                value={filterStatus}
                                style={{
                                    padding: '10px',
                                    width: '105px',
                                    marginBottom: '15px',
                                    fontSize: '15px'
                                }}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                            </select>
                            <h1>Current Room Bills</h1>
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Bill Date</th>
                                        <th>Bill Name</th>
                                        <th>Bill Price</th>
                                        <th>Stays For</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatientBill.map((bill) => {
                                        const assignedDate = bill.data.patient.assignedDate.toDate();
                                        const currentDate = new Date();
                                        const durationInMilliseconds = currentDate.getTime() - assignedDate.getTime();
                                        const durationInDays = Math.floor(durationInMilliseconds / (1000 * 60 * 60 * 24));
                                        roomDuration = durationInDays;

                                        return (
                                            <tr key={bill.data.bill.id}>
                                                <td>{bill.data.patient.patientName}</td>
                                                <td>{Timestamp.now().toDate().toLocaleDateString()}</td>
                                                <td>Room Fee</td>
                                                <td>Rp. {bill.data.room.roomPrice * durationInDays}</td>
                                                <td>{durationInDays} day(s)</td>
                                                <td>
                                                    {`Room Type: ${bill.data.room.roomType} (Rp.${bill.data.room.roomPrice})`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <h1>All Patients Bills</h1>
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Bill Date</th>
                                        <th>Bill Name</th>
                                        <th>Bill Price</th>
                                        <th>Bill Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatientBill.map((bill) => {
                                        const assignedDate = bill.data.patient.assignedDate.toDate();
                                        const currentDate = new Date();
                                        const durationInMilliseconds = currentDate.getTime() - assignedDate.getTime();
                                        const durationInDays = Math.floor(durationInMilliseconds / (1000 * 60 * 60 * 24));
                                        const roomPriceIncluded = bill.data.room.roomPrice * durationInDays;
                                        roomFeeFinal = roomPriceIncluded;

                                        return (
                                            <tr key={bill.data.bill.id}>
                                                <td>{bill.data.patient.patientName}</td>
                                                <td>
                                                    {bill.data.bill.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${bill.billDate.toDate().toLocaleDateString()}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {bill.data.bill.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${bill.billName}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {bill.data.bill.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>Rp. {`${bill.billPrice}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {bill.data.bill.map((bill, index) => (
                                                        <div key={index} style={{
                                                            marginBottom: '15px', padding: '15px',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                backgroundColor: getBackgroundColorForBill(bill.billStatus),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                borderRadius: '25px',
                                                                width: '100px',
                                                            }}>{`${bill.billStatus}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <h1
                                style={{ textAlign: 'center' }}
                            >Grand Total : <span style={{ fontWeight: 'bolder' }}>Rp. {totalBillPrice + roomFeeFinal}</span></h1>

                            <div
                                style={{ display: 'flex', justifyContent: 'center' }}
                            >
                                <Button
                                    variant='contained'
                                    onClick={endBed}
                                >
                                    Ends Patients Bed Usage
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
export default RoomList;
