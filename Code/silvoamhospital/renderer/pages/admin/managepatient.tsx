import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, setDoc, addDoc, Timestamp, limit } from 'firebase/firestore';
import { db, auth } from '../../../firebase/clientApp';
import Sidebar from '../../components/Sidebar';
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


let selectedPatientId = null;

const getBackgroundColor = (jobStatus) => {
    if (jobStatus === 'unpaid') {
        return 'red';
    } else if (jobStatus === 'paid') {
        return 'green';
    }

    return '';
}

function ManagePatient() {
    const [dataChange, setDataChange] = useState(false);

    const [registeredPatient, setRegisteredPatient] = useState([]);

    const [approvedId, setApprovedId] = useState("NONE");
    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState(null);
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const [error, setError] = useState({ name: "", phone: "", gender: "", dob: "", email: "", address: "" });

    const [openForm1, setOpenForm1] = useState(false);
    const [openForm2, setOpenForm2] = useState(false);

    const [clickedUserId, setClickedUserId] = useState("");

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [openBillDetailsForm, setOpenBillDetailsForm] = useState(false);

    const [patientBill, setPatientBill] = useState([]);

    const [openReceipt, setOpenReceipt] = useState(false);

    const [patientReceipt, setPatientReceipt] = useState([]);

    const handleOpenBillDetailsForm = async (patientId: string) => {
        selectedPatientId = patientId;
        getBills();
        setOpenBillDetailsForm(true);
    }

    const handleCloseBillDetailsForm = async () => {
        setOpenBillDetailsForm(false);
    }

    const openDialog1 = () => {
        setOpenForm1(true);
    }

    const closeDialog1 = () => {
        setOpenForm1(false);
    }

    const openDialog2 = () => {
        setOpenForm2(true);
    }

    const closeDialog2 = () => {
        setOpenForm2(false);
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleOpenReceipt = (billId: string) => {
        getReceipt(billId);
        setOpenReceipt(true);
    }

    const handleCloseReceipt = () => {
        setOpenReceipt(false);
    }

    const getPatient = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'patient'));
            const patientData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                data: doc.data()
            }));
            setRegisteredPatient(patientData);
        }
        catch {
            console.log("error");
        }
    }



    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredPatient = registeredPatient.filter((patient) =>
            patient.data.patientName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredPatient);
        console.log(searchQuery);
    };

    const registerNewPatient = async () => {
        const patientRef = collection(db, 'patient');
        const timestampDob = Timestamp.fromDate(dob.toDate()); // Convert JavaScript Date to a Firestore Timestamp
        console.log(timestampDob);
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
            bedId: null,
            isAssigned: false,
        };

        try {
            await addDoc(patientRef, newPatient);
            handleSnackbar();
            setAlertMessage("Patient succesfully added!");
            closeDialog1();
            setDataChange(true);
            // Optionally, you can perform any additional logic or show a success message.
        } catch (error) {
            console.error('Error registering patient:', error);
            // Optionally, you can handle the error and show an error message to the user.
        }
    };

    const editPatient = async () => {
        try {
            const docRef = doc(db, 'patient', clickedUserId);
            const docSnapshot = await getDoc(docRef);

            const timestampDob = Timestamp.fromDate(dob.toDate());

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    patientName: name,
                    patientPhone: phone,
                    patientGender: gender,
                    patientDob: timestampDob,
                    patientEmail: email,
                    patientAddress: address,
                });
                setAlertMessage("Patient succesfully updated!");
                handleSnackbar();
                setApprovedId("NONE");
                setDataChange(true);
                setClickedUserId(null);
                closeDialog2();
            } else {
                console.log('User not found!');
            }
        } catch (error) {
            console.error('Error updating user approval status:', error);
        }
    }

    const getPatientData = async () => {
        try {
            const docRef = doc(db, 'patient', clickedUserId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                setName(docSnapshot.data().patientAddress);
                setAddress(docSnapshot.data().patientAddress);
                setPhone(docSnapshot.data().patientPhone);
                setGender(docSnapshot.data().patientGender);
                setDob(docSnapshot.data().patientDob);
                setEmail(docSnapshot.data().patientEmail);
                setApprovedId("NONE");
                setClickedUserId(null);
                console.log("PENCET" + name);
            } else {
                console.log('User not found!');
            }
        } catch (error) {
            console.error('Error updating user approval status:', error);
        }
    }

    const getBills = async () => {
        try {
            const patientSnapshot = await getDoc(doc(db, 'patient', selectedPatientId));
            const bills = [];

            const patientData = patientSnapshot.data();
            const patientBillDocRef = patientData.billCollection;

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

            const bill1 = {
                id: patientSnapshot.id,
                data: {
                    patient: patientData,
                    bill: patientBill,
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
            return bill.data.bill.find((billItem) => billItem.billStatus === filterStatus);
        }
    });

    const updateBillStatus = async (billId: string) => {
        const billSnapshot = await getDoc(doc(db, 'bills', billId));
        const receipts = [];

        const billData = billSnapshot.data();
        const medicineDocRef = billData.medicineList;
        const roomData = billData.roomId === null ? null : billData.roomId;

        let medicineData = medicineDocRef === null ? null : [];
        let receiptDesc = null;

        if (medicineDocRef) {
            for (const medication of medicineDocRef) {
                const medicineId = medication.medicineId;
                const quantity = medication.qty;

                const medicineDocSnapshot = await getDoc(doc(db, 'medicine', medicineId));

                if (medicineDocSnapshot.exists()) {
                    const medicine = medicineDocSnapshot.data();
                    const medicineWithQuantity = {
                        medicineId: medicineId,
                        qty: quantity,
                    };
                    medicineData.push(medicineWithQuantity);
                }
            }
            receiptDesc = "Buying a medicine"
        }

        if (billData.billName == "Consultation Fee") {
            receiptDesc = "Consultation fee with doctor";
        }

        if (billData.billName == "Picking Up Fee") {
            receiptDesc = "Picking up fee with ambulance";
        }

        if (billData.billName == "Room Fee") {
            receiptDesc = "Room Fee for staying how many day(s)";
        }

        const receipt = {
            handledBy: localStorage.getItem('id'),
            medicineList: medicineData, // from medicine data
            patientId: selectedPatientId,
            receiptDate: Timestamp.now(),
            receiptName: billData.billName,
            receiptPrice: billData.billPrice,
            receiptStatus: "paid",
            receiptNumber: "RE" + Math.floor(Math.random() * 900 + 100),
            billId: billId,
            receiptDescription: receiptDesc,
            roomId: billData.roomId ? billData.roomId : null,
            durationDay: billData.durationDay ? billData.durationDay : null,
        }

        console.log(receipt);

        await addDoc(collection(db, 'receipt'), receipt);

        const docRef = doc(db, 'bills', billId);

        await updateDoc(docRef, {
            billStatus: "paid",
        });

        handleSnackbar();
        setAlertMessage("Bills succesfully paid!");
        setDataChange(true);
    }

    const getReceipt = async (billId: string) => {
        try {
            const q = query(collection(db, 'receipt'), where('billId', '==', billId), limit(1));
            const receiptSnapshot = await getDocs(q);
            const receipts = [];

            for (const doc1 of receiptSnapshot.docs) {

                const receiptData = doc1.data();
                const staffDocRef = receiptData.handledBy;
                const patientDocRef = receiptData.patientId;
                const medicineDocRef = receiptData.medicineList;
                const roomDocRef = receiptData.roomId;

                let staffData = null;
                let patientData = null;
                let medicineData = [];
                let roomData = null;

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

                if (roomDocRef) {
                    const roomDocSnapshot = await getDoc(doc(db, 'room', roomDocRef));
                    if (roomDocSnapshot.exists()) {
                        roomData = roomDocSnapshot.data();
                    }
                }

                if (medicineDocRef) {
                    for (const medication of medicineDocRef) {
                        const medicineId = medication.medicineId;
                        const quantity = medication.qty;

                        const medicineDocSnapshot = await getDoc(doc(db, 'medicine', medicineId));

                        if (medicineDocSnapshot.exists()) {
                            const medicine = medicineDocSnapshot.data();
                            const medicineWithQuantity = {
                                medicineData: medicine,
                                medicineId: medicineId,
                                qty: quantity,
                            };
                            medicineData.push(medicineWithQuantity);
                        }
                    }
                }

                const receipt = {
                    id: doc1.id,
                    data: {
                        ...receiptData,
                        staff: staffData,
                        patient: patientData,
                        medicine: medicineData,
                        room: roomData,
                    },
                };
                receipts.push(receipt);
            }
            setPatientReceipt(receipts);
        } catch (error) {
            console.log(error);
        }
    }

    const resetForm = () => {
        setName(null);
        setAddress(null);
        setPhone(null);
        setGender(null);
        setDob(null);
        setEmail(null);
    }

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            getPatient();
            getBills();
            resetForm();
            setDataChange(false);
        }
    }, [dataChange]);

    //Fetch for the first time
    useEffect(() => {
        getPatient();
        getBills();
    }, []);

    const displayedPatients = searchQuery ? searchResults : registeredPatient;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Patients List</h1>
                            {localStorage.getItem('role') == 'admin' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        openDialog1();
                                    }}
                                    style={{ marginLeft: '5px', float: 'left', width: '150px' }}
                                >
                                    Add Patients
                                </Button>
                            )}

                            <TextField
                                label="Search Patients"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                sx={{ width: '250px' }}
                            />
                            <Box component="main" sx={{ flexGrow: 1, marginTop: '50px' }}>
                                <DataGrid
                                    columns={[
                                        { field: 'patientName', headerName: 'Patient Name', width: 200 },
                                        { field: 'patientPhone', headerName: 'Patient Phone', width: 140 },
                                        { field: 'patientGender', headerName: 'Patient Gender', width: 130 },
                                        { field: 'patientDob', headerName: 'Patient DOB', width: 180 },
                                        { field: 'patientEmail', headerName: 'Patient Email', width: 180 },
                                        { field: 'patientAddress', headerName: 'Patient Address', width: 180 },
                                        { field: 'patientSymptoms', headerName: 'Patient Symptoms', width: 200 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 360,
                                            renderCell: (params) => (
                                                <div>
                                                    {localStorage.getItem('role') == 'admin' && (
                                                        <div>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    openDialog2();
                                                                    setClickedUserId(params.row.id);
                                                                    // getPatientData();
                                                                }}
                                                            // disabled={approvedId === params.row.id}
                                                            >
                                                                {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                                Edit Patient
                                                            </Button>
                                                            <Button
                                                                style={{ marginLeft: '40px' }}
                                                                variant="contained"
                                                                onClick={() => {
                                                                    handleOpenBillDetailsForm(params.row.id);
                                                                    setClickedUserId(params.row.id);
                                                                }}
                                                            // disabled={approvedId === params.row.id}
                                                            >
                                                                {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                                See Patient Bills
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}

                                    rows={displayedPatients.map((user) => ({
                                        id: user.id,
                                        patientName: user.data.patientName,
                                        patientPhone: user.data.patientPhone,
                                        patientGender: user.data.patientGender,
                                        patientDob: user.data.patientDob.toDate().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }),
                                        patientEmail: user.data.patientEmail,
                                        patientAddress: user.data.patientAddress,
                                        patientSymptoms: user.data.patientSymptoms ? user.data.patientSymptoms : "Not Diagnosed",
                                        uuid: user.id,
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openForm1} onClose={closeDialog1}>
                        <DialogTitle>Register Form</DialogTitle>
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
                            {/* <FormHelperText error={!!error.registerRole}>{error.registerRole}</FormHelperText> */}
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={registerNewPatient} fullWidth>
                                    Register New Patient
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm2} onClose={closeDialog2}>
                        <DialogTitle>Update Form</DialogTitle>
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
                                placeholder={email}
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
                            {/* <FormHelperText error={!!error.registerRole}>{error.registerRole}</FormHelperText> */}
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={editPatient} fullWidth>
                                    Update Patient
                                </Button>
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
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Bill Date</th>
                                        <th>Bill Name</th>
                                        <th>Bill Price</th>
                                        <th>Bill Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatientBill.map((bill) => {
                                        const filteredBillData = filterStatus === 'all'
                                            ? bill.data.bill
                                            : bill.data.bill.filter((billItem) => billItem.billStatus === filterStatus);
                                        if (filteredBillData.length === 0) {
                                            return null; // Skip rendering if there are no bills matching the filter
                                        }
                                        return (
                                            <tr key={bill.data.bill.id}>
                                                <td>{bill.data.patient.patientName}</td>
                                                <td>
                                                    {filteredBillData.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${bill.billDate.toDate().toLocaleDateString()}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {filteredBillData.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${bill.billName}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {filteredBillData.map((bill, index) => (
                                                        <div key={index} style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${bill.billPrice}`}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {filteredBillData.map((bill, index) => (
                                                        <div key={index} style={{
                                                            marginBottom: '15px', padding: '15px',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                backgroundColor: getBackgroundColor(bill.billStatus),
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
                                                <td>
                                                    {filteredBillData.map((bill, index) => (
                                                        <div key={index} style={{
                                                            marginBottom: '15px',
                                                            padding: '15px',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}>
                                                            {bill.billStatus === 'unpaid' && (
                                                                <Button
                                                                    variant='contained'
                                                                    onClick={(e) => {
                                                                        updateBillStatus(bill.id);
                                                                    }}
                                                                >
                                                                    Update Bill Status
                                                                </Button>
                                                            )}
                                                            {bill.billStatus === 'paid' && (
                                                                <Button
                                                                    style={{ marginLeft: '20px' }}
                                                                    variant='contained'
                                                                    onClick={(e) => {
                                                                        handleOpenReceipt(bill.id);
                                                                    }}
                                                                >
                                                                    See Receipt
                                                                </Button>
                                                            )}
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
                    <Dialog open={openReceipt} onClose={handleCloseReceipt} fullWidth maxWidth={false}>
                        <DialogTitle>Receipt Detail</DialogTitle>
                        <DialogContent>
                            <table style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Receipt Number</th>
                                        <th>Receipt Name</th>
                                        <th>Receipt Date</th>
                                        <th>Receipt Price</th>
                                        <th>Receipt Status</th>
                                        <th>Receipt Details</th>
                                        <th>Handled By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientReceipt.map((receipt) => {
                                        return (
                                            <tr key={receipt.id}>
                                                <td>{receipt.data.patient.patientName}</td>
                                                <td>{receipt.data.receiptNumber}</td>
                                                <td>{receipt.data.receiptName}</td>
                                                <td>{receipt.data.receiptDate.toDate().toLocaleDateString()}</td>
                                                <td>{receipt.data.receiptPrice}</td>
                                                <td>{receipt.data.receiptStatus}</td>
                                                <td>{receipt.data.receiptDescription}</td>
                                                <td>{receipt.data.staff.userName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {patientReceipt.map((receipt) => {
                                if (receipt.data.medicine.length != 0) {
                                    return (
                                        <div>
                                            <h1>Receipt Details</h1>
                                            <table key={receipt.id} style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Medicine Name</th>
                                                        <th>Medicine Type</th>
                                                        <th>Medicine Price</th>
                                                        <th>Medicine Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {receipt.data.medicine.map((med, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                                    <span>{`${med.medicineData.medicineName}`}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                                    <span>{`${med.medicineData.medicineType}`}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                                    <span>{`${med.medicineData.medicinePrice}`}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                                    <span>{`${med.qty}`}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }
                                else if (receipt.data.room != null) {
                                    const assignedDate = receipt.data.patient.assignedDate.toDate();
                                    const updatedAssignedDate = new Date(assignedDate);
                                    updatedAssignedDate.setDate(updatedAssignedDate.getDate() + receipt.data.durationDay);

                                    return (
                                        <div>
                                            <h1>Receipt Details</h1>
                                            <table key={receipt.id} style={{ width: '100%', margin: '', textAlign: 'center' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Room Number</th>
                                                        <th>Room Type</th>
                                                        <th>Room Building</th>
                                                        <th>Room Floor</th>
                                                        <th>Room Price</th>
                                                        <th>Start Usage</th>
                                                        <th>End Usage</th>
                                                        <th>Day(s) usage</th>
                                                        <th>Total Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{receipt.data.room.roomNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{receipt.data.room.roomType}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{receipt.data.room.roomBuilding}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{receipt.data.room.roomFloor}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`Rp. ${receipt.data.room.roomPrice}`}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${receipt.data.patient.assignedDate.toDate().toDateString()}`}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${updatedAssignedDate.toDateString()}`}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${receipt.data.durationDay} day(s)`}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ marginBottom: '15px', padding: '15px' }}>
                                                            <span>{`${receipt.data.room.roomPrice * receipt.data.durationDay}`}</span>
                                                        </div>
                                                    </td>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }
                                return null; // Skip rendering if receipt.data.medicine is null
                            })}
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

export default ManagePatient;
